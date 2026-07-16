import { GATEWAY_PROTOCOL_VERSION } from '../protocol/constants.js';
import { createRedactedRequestDiagnostic } from '../protocol/normalize.js';
import { estimateGatewayCost } from '../observability/cost.js';
import { normalizeGatewayUsageRecord } from '../observability/usage.js';
import { authenticateRequest } from './auth.js';
import { readJsonBody } from './body-reader.js';
import { createRuntimeError, statusForGatewayError, toRuntimeError } from './errors.js';
import { createRequestContext } from './request-context.js';
import { writeError, writeJson } from './response-writer.js';
import { matchGatewayRoute } from './router.js';
import { writeSseStream } from './sse.js';
import { withRuntimeTimeout } from './timeouts.js';

function routeError(result, context) {
  return createRuntimeError({
    code: result.errors?.[0]?.code || 'invalid_request',
    message: result.errors?.map((error) => error.message).join('; ') || 'Invalid gateway request',
    request_id: context.request_id,
    details: { diagnostic: createRedactedRequestDiagnostic(result.value || {}) },
    cause: 'request_validation_failed',
  });
}

function providerTimeout(requestId) {
  return createRuntimeError({
    code: 'upstream_timeout',
    message: 'Mock provider timed out',
    request_id: requestId,
    provider: 'mock',
    cause: 'mock_provider_timeout',
  });
}

function modelList(provider) {
  return {
    object: 'list',
    data: provider.listModels().map(({ id, object, created, owned_by }) => ({ id, object, created, owned_by })),
  };
}

function healthResponse({ provider, state, startTime, context }) {
  return {
    object: 'gateway.health',
    status: 'ok',
    gateway_version: GATEWAY_PROTOCOL_VERSION,
    runtime: 'mock-local',
    provider: provider.id,
    state,
    uptime_ms: Math.max(0, Date.now() - startTime),
    request_id: context.request_id,
  };
}

function safeRecord(callback) {
  try {
    return callback();
  } catch {
    return null;
  }
}

function observeEvent(collector, event) {
  return collector ? safeRecord(() => collector.recordEvent(event)) : null;
}

function observeTrace(collector, trace) {
  return collector ? safeRecord(() => collector.recordTrace(trace)) : null;
}

function finishTrace(collector, traceId, updates) {
  return collector ? safeRecord(() => collector.finishTrace(traceId, updates)) : null;
}

function traceLimitFrom(url) {
  const parsed = new URL(url || '/', 'http://localhost');
  const raw = Number.parseInt(parsed.searchParams.get('limit') || '50', 10);
  return Number.isInteger(raw) && raw >= 0 && raw <= 100 ? raw : 50;
}

function routeNotFound(context, cause = 'route_not_found') {
  return createRuntimeError({
    code: 'model_not_found',
    message: `Gateway route not found: ${context.pathname}`,
    request_id: context.request_id,
    status: 404,
    cause,
  });
}

function recordProviderHealth(collector, {
  success,
  providerId = 'mock',
  timestamp,
  durationMs = null,
} = {}) {
  if (!collector) return null;
  const current = collector.getHealth()[providerId] || {};
  return safeRecord(() => collector.updateHealth({
    provider_id: providerId,
    status: success ? 'healthy' : 'degraded',
    executable: true,
    local: true,
    last_success_at: success ? timestamp : current.last_success_at || null,
    last_failure_at: success ? current.last_failure_at || null : timestamp,
    consecutive_successes: success ? (current.consecutive_successes || 0) + 1 : 0,
    consecutive_failures: success ? 0 : (current.consecutive_failures || 0) + 1,
    request_count: (current.request_count || 0) + 1,
    error_count: (current.error_count || 0) + (success ? 0 : 1),
    latencies: durationMs !== null ? [durationMs] : [],
    metadata: { mock: true },
  }));
}

function traceComplete(collector, traceId, context, updates = {}) {
  const completedAt = updates.completed_at || Date.now();
  return finishTrace(collector, traceId, {
    completed_at: completedAt,
    duration_ms: Math.max(0, completedAt - context.start_time),
    ...updates,
  });
}

function observeEndpointPayload(route, collector, request) {
  if (route.name === 'observability-metrics') return collector.getMetrics();
  if (route.name === 'observability-provider-health') {
    return { object: 'gateway.provider_health.list', data: Object.values(collector.getHealth()) };
  }
  return { object: 'gateway.trace.list', data: collector.getTraces({ limit: traceLimitFrom(request.url) }) };
}

export function createGatewayApp({
  config,
  provider,
  state,
  startTime,
  requestIdFactory = null,
  observability = null,
} = {}) {
  return async function handleGatewayRequest(request, response) {
    const context = createRequestContext(request, { requestIdFactory });
    const collector = observability || null;
    const eventIds = [];
    const trace = observeTrace(collector, {
      request_id: context.request_id,
      method: context.method,
      pathname: context.pathname,
      metadata: { source: 'runtime' },
    });
    const traceId = trace?.trace_id || null;
    const received = observeEvent(collector, {
      trace_id: traceId,
      request_id: context.request_id,
      type: 'request-received',
      metadata: { route: context.pathname },
    });
    if (received?.event_id) eventIds.push(received.event_id);

    try {
      authenticateRequest(request, context, config);
      const route = matchGatewayRoute(context.method, context.pathname);
      if (route.name === 'not-found') throw routeNotFound(context);
      if (!route.matched) {
        throw createRuntimeError({
          code: 'invalid_request',
          message: `Method not allowed for ${context.pathname}`,
          request_id: context.request_id,
          status: 405,
          cause: 'method_not_allowed',
        });
      }

      if (route.name.startsWith('observability-')) {
        if (!collector || config.observability.expose_http_endpoints !== true) {
          throw routeNotFound(context, 'observability_endpoint_disabled');
        }
        const payload = observeEndpointPayload(route, collector, request);
        traceComplete(collector, traceId, context, { status_code: 200, success: true, event_ids: eventIds });
        writeJson(response, 200, payload, context);
        return;
      }

      if (route.name === 'health') {
        traceComplete(collector, traceId, context, { status_code: 200, success: true, event_ids: eventIds });
        writeJson(response, 200, healthResponse({ provider, state: state(), startTime, context }), context);
        return;
      }

      if (route.name === 'models') {
        traceComplete(collector, traceId, context, { status_code: 200, success: true, event_ids: eventIds });
        writeJson(response, 200, modelList(provider), context);
        return;
      }

      const body = await readJsonBody(request, context, config);
      const validation = provider.validateRequest(body);
      if (!validation.success) throw routeError({ ...validation, value: body }, context);

      const validated = observeEvent(collector, {
        trace_id: traceId,
        request_id: context.request_id,
        type: 'request-validated',
        provider_id: 'mock',
        model_id: body.model,
        metadata: { validation: 'passed' },
      });
      if (validated?.event_id) eventIds.push(validated.event_id);
      const planned = observeEvent(collector, {
        trace_id: traceId,
        request_id: context.request_id,
        type: 'route-planned',
        provider_id: 'mock',
        model_id: body.model,
        route_strategy: 'mock-local',
        metadata: { strategy: 'mock-local' },
      });
      if (planned?.event_id) eventIds.push(planned.event_id);

      if (body.stream === true) {
        const streamStarted = observeEvent(collector, {
          trace_id: traceId,
          request_id: context.request_id,
          type: 'stream-started',
          provider_id: 'mock',
          model_id: body.model,
          route_strategy: 'mock-local',
        });
        if (streamStarted?.event_id) eventIds.push(streamStarted.event_id);
        const chunks = provider.stream(body, context);
        await writeSseStream(response, chunks, context, config, {
          onChunk: (_chunk, index) => {
            const event = observeEvent(collector, {
              trace_id: traceId,
              request_id: context.request_id,
              type: 'stream-chunk',
              provider_id: 'mock',
              model_id: body.model,
              metadata: { chunk_count: index + 1 },
            });
            if (event?.event_id) eventIds.push(event.event_id);
          },
          onComplete: ({ chunk_count }) => {
            const timestamp = Date.now();
            const usage = normalizeGatewayUsageRecord({
              usage: { input_tokens: 2, output_tokens: 2, total_tokens: 4, estimated: false, provider_reported: true },
              provider_id: 'mock',
              model_id: body.model,
              request_id: context.request_id,
              trace_id: traceId,
              timestamp,
              metadata: { mock: true },
            });
            collector?.recordUsage(usage);
            recordProviderHealth(collector, { success: true, timestamp, durationMs: Math.max(0, timestamp - context.start_time) });
            const event = observeEvent(collector, {
              trace_id: traceId,
              request_id: context.request_id,
              type: 'stream-completed',
              provider_id: 'mock',
              model_id: body.model,
              status: 'success',
              usage,
              metadata: { chunk_count },
            });
            if (event?.event_id) eventIds.push(event.event_id);
            traceComplete(collector, traceId, context, {
              completed_at: timestamp,
              status_code: 200,
              provider_id: 'mock',
              model_id: body.model,
              route_strategy: 'mock-local',
              streamed: true,
              success: true,
              usage,
              event_ids: eventIds,
            });
          },
        });
        return;
      }

      const providerStarted = observeEvent(collector, {
        trace_id: traceId,
        request_id: context.request_id,
        type: 'mock-provider-started',
        provider_id: 'mock',
        model_id: body.model,
        route_strategy: 'mock-local',
      });
      if (providerStarted?.event_id) eventIds.push(providerStarted.event_id);
      const result = await withRuntimeTimeout(
        Promise.resolve().then(() => provider.invoke(body, context)),
        { timeoutMs: config.provider_timeout_ms, requestId: context.request_id, createTimeoutError: providerTimeout },
      );
      if (result?.error) {
        const timestamp = Date.now();
        recordProviderHealth(collector, { success: false, timestamp, durationMs: Math.max(0, timestamp - context.start_time) });
        traceComplete(collector, traceId, context, {
          completed_at: timestamp,
          status_code: result.error.status || 502,
          provider_id: 'mock',
          model_id: body.model,
          route_strategy: 'mock-local',
          success: false,
          error: result.error,
          event_ids: eventIds,
        });
        writeJson(response, result.error.status || 502, result, context);
        return;
      }

      const timestamp = Date.now();
      const usage = normalizeGatewayUsageRecord({
        usage: { ...result.usage, estimated: false, provider_reported: true },
        provider_id: result.provider_id,
        model_id: result.model,
        request_id: context.request_id,
        trace_id: traceId,
        timestamp,
        metadata: { mock: true },
      });
      const cost = estimateGatewayCost({ usage, model: { input_cost: null, output_cost: null, currency: null } });
      collector?.recordUsage({ ...usage, cost_estimate: cost });
      recordProviderHealth(collector, { success: true, providerId: result.provider_id, timestamp, durationMs: Math.max(0, timestamp - context.start_time) });
      const providerCompleted = observeEvent(collector, {
        trace_id: traceId,
        request_id: context.request_id,
        type: 'mock-provider-completed',
        provider_id: result.provider_id,
        model_id: result.model,
        route_strategy: 'mock-local',
        status: 'success',
        usage,
        cost_estimate: cost,
      });
      if (providerCompleted?.event_id) eventIds.push(providerCompleted.event_id);
      const requestCompleted = observeEvent(collector, {
        trace_id: traceId,
        request_id: context.request_id,
        type: 'request-completed',
        provider_id: result.provider_id,
        model_id: result.model,
        status: 'success',
        usage,
        cost_estimate: cost,
      });
      if (requestCompleted?.event_id) eventIds.push(requestCompleted.event_id);
      traceComplete(collector, traceId, context, {
        completed_at: timestamp,
        status_code: 200,
        provider_id: result.provider_id,
        model_id: result.model,
        route_strategy: 'mock-local',
        streamed: false,
        success: true,
        usage,
        cost_estimate: cost,
        event_ids: eventIds,
        metadata: { strategy: 'mock-local' },
      });
      writeJson(response, 200, result, context);
    } catch (error) {
      const runtimeError = toRuntimeError(error, { request_id: context.request_id });
      const status = runtimeError.status || statusForGatewayError(runtimeError.gatewayError);
      const timestamp = Date.now();
      const event = observeEvent(collector, {
        trace_id: traceId,
        request_id: context.request_id,
        type: runtimeError.gatewayError.error.code?.startsWith('authentication') ? 'auth-failed' : 'request-failed',
        timestamp,
        duration_ms: Math.max(0, timestamp - context.start_time),
        status: 'failed',
        error_code: runtimeError.gatewayError.error.code,
        metadata: { route: context.pathname },
      });
      if (event?.event_id) eventIds.push(event.event_id);
      traceComplete(collector, traceId, context, {
        completed_at: timestamp,
        status_code: status,
        success: false,
        error: runtimeError.gatewayError.error,
        event_ids: eventIds,
      });
      writeError(response, error, context);
    }
  };
}
