import { createGatewayError } from '../protocol/errors.js';

const STATUS_BY_CODE = Object.freeze({
  invalid_request: 400,
  unsupported_field: 400,
  unsupported_capability: 400,
  model_not_found: 404,
  provider_not_found: 404,
  provider_unavailable: 503,
  authentication_required: 401,
  authentication_failed: 401,
  rate_limited: 429,
  quota_exceeded: 429,
  context_length_exceeded: 400,
  request_too_large: 413,
  response_too_large: 502,
  timeout: 504,
  upstream_timeout: 504,
  upstream_error: 502,
  upstream_server_error: 502,
  upstream_client_error: 400,
  upstream_authentication: 401,
  upstream_rate_limit: 429,
  upstream_quota: 429,
  upstream_protocol_error: 502,
  stream_error: 502,
  policy_denied: 403,
  execution_disabled: 403,
  provider_not_enabled: 403,
  credential_unavailable: 503,
  cancelled: 499,
  configuration_error: 500,
  internal_error: 500,
  method_not_allowed: 405,
  unsupported_media_type: 415,
});

export class GatewayRuntimeError extends Error {
  constructor({ code = 'internal_error', message = 'Gateway runtime error', request_id = null, provider = null, model = null, details = null, cause = null, status = null } = {}) {
    super(message);
    this.name = 'GatewayRuntimeError';
    this.status = status || STATUS_BY_CODE[code] || 500;
    this.gatewayError = createGatewayError({
      code: STATUS_BY_CODE[code] ? code : 'internal_error',
      message,
      request_id,
      provider,
      model,
      details,
      cause: cause || code,
      status: this.status,
    });
  }
}

export function createRuntimeError(options = {}) {
  return new GatewayRuntimeError(options);
}

export function toRuntimeError(error, fallback = {}) {
  if (error instanceof GatewayRuntimeError) return error;
  return createRuntimeError({
    code: fallback.code || 'internal_error',
    message: fallback.message || error?.message || 'Gateway runtime error',
    request_id: fallback.request_id || null,
    details: fallback.details || null,
    cause: error?.name || fallback.cause || 'unknown',
  });
}

export function statusForGatewayError(errorResponse) {
  const code = errorResponse?.error?.code;
  return STATUS_BY_CODE[code] || errorResponse?.error?.status || 500;
}
