import { timingSafeEqual } from 'node:crypto';
import { createRuntimeError } from './errors.js';
import { isLoopbackAddress } from './limits.js';

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function bearerAuthError(context, code, message, cause) {
  throw createRuntimeError({
    code,
    message,
    request_id: context.request_id,
    cause,
  });
}

function readBearerTokenHeader(request, context) {
  const header = request.headers.authorization;
  if (Array.isArray(header)) {
    bearerAuthError(context, 'authentication_failed', 'Bearer token header is malformed', 'multiple_authorization_headers');
  }
  if (typeof header !== 'string' || header.length === 0) {
    bearerAuthError(context, 'authentication_required', 'Bearer token is required', 'missing_bearer_token');
  }
  if (header.length > 4096) {
    bearerAuthError(context, 'authentication_failed', 'Bearer token header is too long', 'authorization_header_too_long');
  }
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) {
    bearerAuthError(context, 'authentication_required', 'Bearer token is required', 'missing_bearer_token');
  }
  const token = header.slice(prefix.length);
  if (token.trim().length === 0 || token !== token.trim()) {
    bearerAuthError(context, 'authentication_failed', 'Bearer token is malformed', 'malformed_bearer_token');
  }
  return token;
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
  const token = readBearerTokenHeader(request, context);
  if (!constantTimeEqual(token, config.auth_token)) {
    throw createRuntimeError({
      code: 'authentication_failed',
      message: 'Bearer token is invalid',
      request_id: context.request_id,
      cause: 'invalid_bearer_token',
    });
  }
  return { authenticated: true, mode: config.auth_mode };
}
