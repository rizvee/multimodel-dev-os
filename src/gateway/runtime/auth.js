import { timingSafeEqual } from 'node:crypto';
import { createRuntimeError } from './errors.js';
import { isLoopbackAddress } from './limits.js';

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function assertLocalRequest(context, config) {
  if (config.auth_mode === 'none-localhost-only' && !isLoopbackAddress(context.remote_address)) {
    throw createRuntimeError({
      code: 'policy_denied',
      message: 'Remote requests are not allowed in localhost-only mode',
      request_id: context.request_id,
      cause: 'remote_request_denied',
    });
  }
}

export function authenticateRequest(request, context, config) {
  assertLocalRequest(context, config);
  if (config.auth_mode !== 'bearer-token') return { authenticated: true, mode: config.auth_mode };
  const header = request.headers.authorization || '';
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) {
    throw createRuntimeError({
      code: 'authentication_required',
      message: 'Bearer token is required',
      request_id: context.request_id,
      cause: 'missing_bearer_token',
    });
  }
  if (!constantTimeEqual(header.slice(prefix.length), config.auth_token)) {
    throw createRuntimeError({
      code: 'authentication_failed',
      message: 'Bearer token is invalid',
      request_id: context.request_id,
      cause: 'invalid_bearer_token',
    });
  }
  return { authenticated: true, mode: config.auth_mode };
}
