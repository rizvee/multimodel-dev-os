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
  endpoint_forbidden: 403,
  endpoint_invalid: 400,
  credential_reference_invalid: 400,
  credential_unavailable: 503,
  cancelled: 499,
  configuration_error: 500,
  internal_error: 500,
  internal_execution_error: 500,
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
  const rawCode = error?.error?.code || (error?.category && STATUS_BY_CODE[error.category] ? error.category : error?.code) || fallback.code || 'internal_error';
  const code = STATUS_BY_CODE[rawCode] ? rawCode : 'internal_error';
  const rawStatus = error?.error?.status || error?.status || fallback.status || null;
  const status = (rawStatus && rawStatus !== 500) ? rawStatus : (STATUS_BY_CODE[code] || rawStatus || 500);
  const message = error?.error?.message || error?.message || fallback.message || 'Gateway runtime error';
  return createRuntimeError({
    code,
    status,
    message,
    request_id: fallback.request_id || error?.request_id || null,
    details: fallback.details || error?.details || null,
    cause: error?.name || fallback.cause || code,
  });
}

export function statusForGatewayError(errorResponse) {
  const code = errorResponse?.error?.code;
  return STATUS_BY_CODE[code] || errorResponse?.error?.status || 500;
}
