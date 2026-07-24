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
import { createExecutionDispatcher } from './execution-dispatcher.js';
import { executeGovernedRequest } from '../execution/executor.js';
import { createExecutionRequest } from '../contracts/execution-request.js';
import { validateGatewayRequest } from '../protocol/validation.js';

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

function modelList(provider, dispatcher) {
  const baseData = provider.listModels().map(({ id, object, created, owned_by }) => ({ id, object, created, owned_by }));
  const externalData = dispatcher.enabled ? dispatcher.listExternalModels() : [];
  return {
    object: 'list',
    data: [...baseData, ...externalData],
  };
}

function healthResponse({ provider, state, startTime, context, dispatcher }) {
  return {
    object: 'gateway.health',
    status: 'ok',
    gateway_version: GATEWAY_PROTOCOL_VERSION,
    runtime: 'mock-local',
    provider: provider.id,
    state,
    uptime_ms: Math.max(0, Date.now() - startTime),
    request_id: context.request_id,
    governed_execution: {
      enabled: dispatcher.enabled === true,
    },
  };
}

function waitForDrain(response, signal) {
  if (!response || response.writableEnded || response.destroyed || signal?.aborted) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const onDrain = () => {
      cleanup();
      resolve();
    };
    const onAbort = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      response.removeListener('drain', onDrain);
      response.removeListener('close', onDrain);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
    };
    response.once('drain', onDrain);
    response.once('close', onDrain);
    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
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
  const isMock = providerId === 'mock';
  const current = collector.getHealth()[providerId] || {};
  return safeRecord(() => collector.updateHealth({
    provider_id: providerId,
    status: success ? 'healthy' : 'degraded',
    executable: true,
    local: isMock,
    last_success_at: success ? timestamp : current.last_success_at || null,
    last_failure_at: success ? current.last_failure_at || null : timestamp,
    consecutive_successes: success ? (current.consecutive_successes || 0) + 1 : 0,
    consecutive_failures: success ? 0 : (current.consecutive_failures || 0) + 1,
    request_count: (current.request_count || 0) + 1,
    error_count: (current.error_count || 0) + (success ? 0 : 1),
    latencies: durationMs !== null ? [durationMs] : [],
    metadata: { mock: isMock, governed: !isMock },
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

function sanitizeClientBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const copy = { ...body };
  delete copy.provider_id;
  delete copy.endpoint;
  delete copy.base_url;
  delete copy.policy;
  delete copy.credential_ref;
  delete copy.capability;
  delete copy.transport;
  delete copy.environment;
  return copy;
}

export function createGatewayApp({
  config,
  provider,
  state,
  startTime,
  requestIdFactory = null,
  observability = null,
  governed_execution = null,
} = {}) {
  const dispatcher = createExecutionDispatcher(governed_execution || {});

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
        writeJson(response, 200, healthResponse({ provider, state: state(), startTime, context, dispatcher }), context);
        return;
      }

      if (route.name === 'models') {
        traceComplete(collector, traceId, context, { status_code: 200, success: true, event_ids: eventIds });
        writeJson(response, 200, modelList(provider, dispatcher), context);
        return;
      }

      const rawBody = await readJsonBody(request, context, config);
      const routeDecision = dispatcher.resolveRoute(rawBody?.model);

      if (routeDecision.type === 'disabled-external') {
        throw createRuntimeError({
          code: 'execution_disabled',
          message: `Governed execution is disabled for model ${rawBody?.model}`,
          request_id: context.request_id,
          status: 403,
          cause: 'execution_disabled',
        });
      }

      if (routeDecision.type === 'unknown') {
        throw createRuntimeError({
          code: 'model_not_found',
          message: `Model not found: ${rawBody?.model}`,
          request_id: context.request_id,
          status: 404,
          cause: 'unknown_model',
        });
      }

      if (routeDecision.type === 'governed-external') {
        const body = sanitizeClientBody(rawBody);

        const reqValidation = validateGatewayRequest(body);
        if (!reqValidation.success) throw routeError({ ...reqValidation, value: body }, context);

        const validated = observeEvent(collector, {
          trace_id: traceId,
          request_id: context.request_id,
          type: 'request-validated',
          provider_id: routeDecision.provider_id,
          model_id: routeDecision.resolved_model,
          metadata: { validation: 'passed' },
        });
        if (validated?.event_id) eventIds.push(validated.event_id);

        const planned = observeEvent(collector, {
          trace_id: traceId,
          request_id: context.request_id,
          type: 'route-selected',
          provider_id: routeDecision.provider_id,
          model_id: routeDecision.resolved_model,
          route_strategy: 'governed-external',
          metadata: { strategy: 'governed-external', requested_model: routeDecision.requested_model },
        });
        if (planned?.event_id) eventIds.push(planned.event_id);

        const runtimeTimeoutMs = config?.provider_timeout_ms || 30000;

        // Governed Streaming Branch
        if (body.stream === true) {
          const abortController = new AbortController();
          let timeoutTimer = null;

          const cleanupListeners = () => {
            if (timeoutTimer) {
              clearTimeout(timeoutTimer);
              timeoutTimer = null;
            }
            request.removeListener('aborted', onAbort);
            response.removeListener('close', onClose);
            request.socket?.removeListener('close', onClose);
          };

          const onAbort = () => {
            if (!abortController.signal.aborted) {
              abortController.abort(createRuntimeError({
                code: 'cancelled',
                message: 'Client request aborted during stream',
                request_id: context.request_id,
                status: 499,
                cause: 'client_aborted',
              }));
            }
          };

          const onClose = () => {
            if (!response.writableEnded && !response.finished && !abortController.signal.aborted) {
              if (!request.readableEnded || !response.headersSent) {
                abortController.abort(createRuntimeError({
                  code: 'cancelled',
                  message: 'Client connection closed before stream completed',
                  request_id: context.request_id,
                  status: 499,
                  cause: 'socket_closed',
                }));
              }
            }
          };

          request.once('aborted', onAbort);
          response.once('close', onClose);
          request.socket?.once('close', onClose);

          timeoutTimer = setTimeout(() => {
            if (!abortController.signal.aborted) {
              abortController.abort(createRuntimeError({
                code: 'timeout',
                message: `Governed stream execution timed out after ${runtimeTimeoutMs}ms`,
                request_id: context.request_id,
                status: 504,
                cause: 'runtime_timeout',
              }));
            }
          }, runtimeTimeoutMs);
          if (timeoutTimer.unref) timeoutTimer.unref();

          let streamResult = null;
          try {
            streamResult = await dispatcher.executeStreamRoute({
              requested_model: rawBody?.model,
              gateway_request: body,
              request_id: context.request_id,
              signal: abortController.signal,
              runtime_timeout_ms: runtimeTimeoutMs,
            });
          } catch (err) {
            cleanupListeners();
            throw err;
          }

          if (!streamResult || !streamResult.success) {
            cleanupListeners();
            const errToThrow = streamResult?.error || createRuntimeError({
              code: 'internal_execution_error',
              message: 'Governed stream execution failed preflight',
              request_id: context.request_id,
              status: 500,
            });
            throw toRuntimeError(errToThrow, { request_id: context.request_id });
          }

          // Write SSE Headers
          response.writeHead(200, {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-cache',
            'connection': 'keep-alive',
            'x-request-id': context.request_id,
          });

          const started = observeEvent(collector, {
            trace_id: traceId,
            request_id: context.request_id,
            type: 'governed-stream-started',
            provider_id: routeDecision.provider_id,
            model_id: routeDecision.resolved_model,
            route_strategy: 'governed-external',
          });
          if (started?.event_id) eventIds.push(started.event_id);

          let chunkCount = 0;
          let byteCount = 0;

          try {
            for await (const chunkEvent of streamResult.session.event_stream) {
              if (chunkEvent.type === 'chunk') {
                chunkCount++;
                const payload = `data: ${JSON.stringify(chunkEvent.gateway_response)}\n\n`;
                byteCount += Buffer.byteLength(payload, 'utf8');
                const canWrite = response.write(payload);
                if (!canWrite) {
                  await waitForDrain(response, abortController.signal);
                }

                const chunkObs = observeEvent(collector, {
                  trace_id: traceId,
                  request_id: context.request_id,
                  type: 'governed-stream-chunk',
                  provider_id: routeDecision.provider_id,
                  model_id: routeDecision.resolved_model,
                  route_strategy: 'governed-external',
                  metadata: { chunk_index: chunkCount },
                });
                if (chunkObs?.event_id) eventIds.push(chunkObs.event_id);
              }
            }

            if (!response.writableEnded) {
              response.write('data: [DONE]\n\n');
            }

            const timestamp = Date.now();
            const durationMs = Math.max(0, timestamp - context.start_time);
            recordProviderHealth(collector, { success: true, providerId: routeDecision.provider_id, timestamp, durationMs });

            const compEvent = observeEvent(collector, {
              trace_id: traceId,
              request_id: context.request_id,
              type: 'governed-stream-completed',
              provider_id: routeDecision.provider_id,
              model_id: routeDecision.resolved_model,
              route_strategy: 'governed-external',
              metadata: { chunk_count: chunkCount, byte_count: byteCount },
            });
            if (compEvent?.event_id) eventIds.push(compEvent.event_id);

            traceComplete(collector, traceId, context, { status_code: 200, success: true, event_ids: eventIds });
          } catch (streamErr) {
            const timestamp = Date.now();
            const durationMs = Math.max(0, timestamp - context.start_time);
            const isTimeout = streamErr?.code === 'timeout' || streamErr?.category === 'timeout';
            const isCancel = streamErr?.code === 'cancelled' || streamErr?.category === 'cancelled' || abortController.signal.aborted;

            recordProviderHealth(collector, { success: false, providerId: routeDecision.provider_id, timestamp, durationMs });

            const failEventType = isTimeout ? 'governed-stream-timed-out' : (isCancel ? 'governed-stream-cancelled' : 'governed-stream-failed');
            const failEvent = observeEvent(collector, {
              trace_id: traceId,
              request_id: context.request_id,
              type: failEventType,
              provider_id: routeDecision.provider_id,
              model_id: routeDecision.resolved_model,
              route_strategy: 'governed-external',
              metadata: { chunk_count: chunkCount, byte_count: byteCount, error_code: streamErr?.code || 'stream_error' },
            });
            if (failEvent?.event_id) eventIds.push(failEvent.event_id);

            traceComplete(collector, traceId, context, { status_code: isTimeout ? 504 : (isCancel ? 499 : 502), success: false, event_ids: eventIds });

            if (!response.writableEnded) {
              const safeRuntimeErr = toRuntimeError(streamErr, { request_id: context.request_id });
              response.write(`data: ${JSON.stringify({ error: safeRuntimeErr.gatewayError.error })}\n\n`);
              response.write('data: [DONE]\n\n');
            }
          } finally {
            cleanupListeners();
            if (streamResult.session?.cancel) {
              streamResult.session.cancel();
            }
            if (!response.writableEnded) {
              response.end();
            }
          }
          return;
        }

        // Non-stream governed external branch
        const started = observeEvent(collector, {
          trace_id: traceId,
          request_id: context.request_id,
          type: 'execution-started',
          provider_id: routeDecision.provider_id,
          model_id: routeDecision.resolved_model,
          route_strategy: 'governed-external',
        });
        if (started?.event_id) eventIds.push(started.event_id);

        const abortController = new AbortController();
        let timeoutTimer = null;

        const cleanupListeners = () => {
          if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
          }
          request.removeListener('aborted', onAbort);
          response.removeListener('close', onClose);
          request.socket?.removeListener('close', onClose);
        };

        const onAbort = () => {
          if (!abortController.signal.aborted) {
            abortController.abort(createRuntimeError({
              code: 'cancelled',
              message: 'Client request aborted',
              request_id: context.request_id,
              status: 499,
              cause: 'client_aborted',
            }));
          }
        };

        const onClose = () => {
          if (!response.writableEnded && !response.finished && !abortController.signal.aborted) {
            if (!request.readableEnded || !response.headersSent) {
              abortController.abort(createRuntimeError({
                code: 'cancelled',
                message: 'Client connection closed before response completed',
                request_id: context.request_id,
                status: 499,
                cause: 'socket_closed',
              }));
            }
          }
        };

        request.once('aborted', onAbort);
        response.once('close', onClose);
        request.socket?.once('close', onClose);

        timeoutTimer = setTimeout(() => {
          if (!abortController.signal.aborted) {
            abortController.abort(createRuntimeError({
              code: 'timeout',
              message: `Governed execution timed out after ${runtimeTimeoutMs}ms`,
              request_id: context.request_id,
              status: 504,
              cause: 'runtime_timeout',
            }));
          }
        }, runtimeTimeoutMs);
        if (timeoutTimer.unref) timeoutTimer.unref();

        let execResult = null;
        try {
          execResult = await dispatcher.executeRoute({
            requested_model: rawBody?.model,
            gateway_request: body,
            request_id: context.request_id,
            signal: abortController.signal,
            runtime_timeout_ms: runtimeTimeoutMs,
          });
        } finally {
          cleanupListeners();
        }

        const timestamp = Date.now();
        const durationMs = execResult.timing?.duration_ms || Math.max(0, timestamp - context.start_time);

        if (execResult.state === 'completed') {
          const usage = normalizeGatewayUsageRecord({
            usage: { ...execResult.gateway_response.usage, estimated: false, provider_reported: true },
            provider_id: routeDecision.provider_id,
            model_id: routeDecision.resolved_model,
            request_id: context.request_id,
            trace_id: traceId,
            timestamp,
            metadata: { governed: true },
          });
          const cost = estimateGatewayCost({ usage, model: { input_cost: null, output_cost: null, currency: null } });
          collector?.recordUsage({ ...usage, cost_estimate: cost });
          recordProviderHealth(collector, { success: true, providerId: routeDecision.provider_id, timestamp, durationMs });

          const compEvent = observeEvent(collector, {
            trace_id: traceId,
            request_id: context.request_id,
            type: 'execution-completed',
            provider_id: routeDecision.provider_id,
            model_id: routeDecision.resolved_model,
            route_strategy: 'governed-external',
            status: 'success',
            usage,
            cost_estimate: cost,
          });
          if (compEvent?.event_id) eventIds.push(compEvent.event_id);

          traceComplete(collector, traceId, context, {
            completed_at: timestamp,
            status_code: 200,
            provider_id: routeDecision.provider_id,
            model_id: routeDecision.resolved_model,
            route_strategy: 'governed-external',
            streamed: false,
            success: true,
            usage,
            cost_estimate: cost,
            event_ids: eventIds,
            metadata: { strategy: 'governed-external' },
          });

          writeJson(response, 200, execResult.gateway_response, context);
          return;
        }

        recordProviderHealth(collector, { success: false, providerId: routeDecision.provider_id, timestamp, durationMs });

        let eventType = 'execution-failed';
        if (execResult.state === 'cancelled') eventType = 'execution-cancelled';
        if (execResult.state === 'timed_out') eventType = 'execution-timed-out';

        const failEvent = observeEvent(collector, {
          trace_id: traceId,
          request_id: context.request_id,
          type: eventType,
          provider_id: routeDecision.provider_id,
          model_id: routeDecision.resolved_model,
          route_strategy: 'governed-external',
          status: execResult.state,
          error_code: execResult.error?.code,
        });
        if (failEvent?.event_id) eventIds.push(failEvent.event_id);

        const errCode = execResult.error?.code || 'upstream_error';
        const status = execResult.error?.status || statusForGatewayError({ error: execResult.error }) || 502;

        traceComplete(collector, traceId, context, {
          completed_at: timestamp,
          status_code: status,
          provider_id: routeDecision.provider_id,
          model_id: routeDecision.resolved_model,
          route_strategy: 'governed-external',
          success: false,
          error: execResult.error,
          event_ids: eventIds,
        });

        const runtimeError = createRuntimeError({
          code: errCode,
          message: execResult.error?.message || 'Governed execution failed',
          request_id: context.request_id,
          provider: routeDecision.provider_id,
          model: routeDecision.resolved_model,
          status,
          cause: execResult.error?.category || 'governed_execution_failed',
        });

        writeError(response, runtimeError, context);
        return;
      }

      // Default mock provider route
      const validation = provider.validateRequest(rawBody);
      if (!validation.success) throw routeError({ ...validation, value: rawBody }, context);

      const validated = observeEvent(collector, {
        trace_id: traceId,
        request_id: context.request_id,
        type: 'request-validated',
        provider_id: 'mock',
        model_id: rawBody.model,
        metadata: { validation: 'passed' },
      });
      if (validated?.event_id) eventIds.push(validated.event_id);
      const planned = observeEvent(collector, {
        trace_id: traceId,
        request_id: context.request_id,
        type: 'route-planned',
        provider_id: 'mock',
        model_id: rawBody.model,
        route_strategy: 'mock-local',
        metadata: { strategy: 'mock-local' },
      });
      if (planned?.event_id) eventIds.push(planned.event_id);

      if (rawBody.stream === true) {
        const streamStarted = observeEvent(collector, {
          trace_id: traceId,
          request_id: context.request_id,
          type: 'stream-started',
          provider_id: 'mock',
          model_id: rawBody.model,
          route_strategy: 'mock-local',
        });
        if (streamStarted?.event_id) eventIds.push(streamStarted.event_id);
        const chunks = provider.stream(rawBody, context);
        await writeSseStream(response, chunks, context, config, {
          onChunk: (_chunk, index) => {
            const event = observeEvent(collector, {
              trace_id: traceId,
              request_id: context.request_id,
              type: 'stream-chunk',
              provider_id: 'mock',
              model_id: rawBody.model,
              metadata: { chunk_count: index + 1 },
            });
            if (event?.event_id) eventIds.push(event.event_id);
          },
          onComplete: ({ chunk_count }) => {
            const timestamp = Date.now();
            const usage = normalizeGatewayUsageRecord({
              usage: { input_tokens: 2, output_tokens: 2, total_tokens: 4, estimated: false, provider_reported: true },
              provider_id: 'mock',
              model_id: rawBody.model,
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
              model_id: rawBody.model,
              status: 'success',
              usage,
              metadata: { chunk_count },
            });
            if (event?.event_id) eventIds.push(event.event_id);
            traceComplete(collector, traceId, context, {
              completed_at: timestamp,
              status_code: 200,
              provider_id: 'mock',
              model_id: rawBody.model,
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
        model_id: rawBody.model,
        route_strategy: 'mock-local',
      });
      if (providerStarted?.event_id) eventIds.push(providerStarted.event_id);
      const result = await withRuntimeTimeout(
        Promise.resolve().then(() => provider.invoke(rawBody, context)),
        { timeoutMs: config.provider_timeout_ms, requestId: context.request_id, createTimeoutError: providerTimeout },
      );
      if (result?.error) {
        const timestamp = Date.now();
        recordProviderHealth(collector, { success: false, timestamp, durationMs: Math.max(0, timestamp - context.start_time) });
        traceComplete(collector, traceId, context, {
          completed_at: timestamp,
          status_code: result.error.status || 502,
          provider_id: 'mock',
          model_id: rawBody.model,
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
