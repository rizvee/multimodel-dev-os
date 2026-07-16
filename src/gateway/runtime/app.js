import { GATEWAY_PROTOCOL_VERSION } from '../protocol/constants.js';
import { createRedactedRequestDiagnostic } from '../protocol/normalize.js';
import { authenticateRequest } from './auth.js';
import { readJsonBody } from './body-reader.js';
import { createRuntimeError } from './errors.js';
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

export function createGatewayApp({
  config,
  provider,
  state,
  startTime,
  requestIdFactory = null,
} = {}) {
  return async function handleGatewayRequest(request, response) {
    const context = createRequestContext(request, { requestIdFactory });
    try {
      authenticateRequest(request, context, config);
      const route = matchGatewayRoute(context.method, context.pathname);
      if (route.name === 'not-found') {
        throw createRuntimeError({
          code: 'model_not_found',
          message: `Gateway route not found: ${context.pathname}`,
          request_id: context.request_id,
          status: 404,
          cause: 'route_not_found',
        });
      }
      if (!route.matched) {
        throw createRuntimeError({
          code: 'invalid_request',
          message: `Method not allowed for ${context.pathname}`,
          request_id: context.request_id,
          status: 405,
          cause: 'method_not_allowed',
        });
      }

      if (route.name === 'health') {
        writeJson(response, 200, healthResponse({ provider, state: state(), startTime, context }), context);
        return;
      }

      if (route.name === 'models') {
        writeJson(response, 200, modelList(provider), context);
        return;
      }

      const body = await readJsonBody(request, context, config);
      const validation = provider.validateRequest(body);
      if (!validation.success) {
        throw routeError({ ...validation, value: body }, context);
      }

      if (body.stream === true) {
        const chunks = provider.stream(body, context);
        await writeSseStream(response, chunks, context, config);
        return;
      }

      const result = await withRuntimeTimeout(
        Promise.resolve().then(() => provider.invoke(body, context)),
        { timeoutMs: config.provider_timeout_ms, requestId: context.request_id, createTimeoutError: providerTimeout },
      );
      if (result?.error) {
        writeJson(response, result.error.status || 502, result, context);
        return;
      }
      writeJson(response, 200, result, context);
    } catch (error) {
      writeError(response, error, context);
    }
  };
}
