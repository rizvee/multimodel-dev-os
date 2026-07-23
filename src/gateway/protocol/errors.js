import { SENSITIVE_KEY_PATTERN } from './constants.js';

export const ERROR_DEFINITIONS = Object.freeze({
  invalid_request: { type: 'invalid_request_error', status: 400, retryable: false },
  unsupported_field: { type: 'invalid_request_error', status: 400, retryable: false },
  unsupported_capability: { type: 'invalid_request_error', status: 400, retryable: false },
  model_not_found: { type: 'not_found_error', status: 404, retryable: false },
  provider_not_found: { type: 'not_found_error', status: 404, retryable: false },
  provider_unavailable: { type: 'upstream_error', status: 503, retryable: true },
  authentication_required: { type: 'authentication_error', status: 401, retryable: false },
  authentication_failed: { type: 'authentication_error', status: 401, retryable: false },
  rate_limited: { type: 'rate_limit_error', status: 429, retryable: true },
  quota_exceeded: { type: 'quota_error', status: 429, retryable: false },
  context_length_exceeded: { type: 'invalid_request_error', status: 400, retryable: false },
  request_too_large: { type: 'invalid_request_error', status: 413, retryable: false },
  timeout: { type: 'timeout_error', status: 408, retryable: true },
  upstream_timeout: { type: 'upstream_error', status: 504, retryable: true },
  upstream_error: { type: 'upstream_error', status: 502, retryable: true },
  stream_error: { type: 'stream_error', status: 502, retryable: true },
  policy_denied: { type: 'policy_error', status: 403, retryable: false },
  configuration_error: { type: 'configuration_error', status: 500, retryable: false },
  internal_error: { type: 'internal_error', status: 500, retryable: false },
});

export const ERROR_CODES = Object.keys(ERROR_DEFINITIONS);

export function redactSensitiveValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveValue(entry));
  }

  if (value && typeof value === 'object') {
    const redacted = {};
    for (const [key, entry] of Object.entries(value)) {
      redacted[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactSensitiveValue(entry);
    }
    return redacted;
  }

  return value;
}

export function createGatewayError({
  code,
  message,
  provider = null,
  model = null,
  request_id = null,
  details = null,
  cause = null,
} = {}) {
  const safeCode = ERROR_CODES.includes(code) ? code : 'internal_error';
  const definition = ERROR_DEFINITIONS[safeCode];
  return {
    error: {
      code: safeCode,
      message: message || safeCode.replace(/_/g, ' '),
      type: definition.type,
      status: definition.status,
      retryable: definition.retryable,
      provider,
      model,
      request_id,
      details: details === null ? null : redactSensitiveValue(details),
      cause: cause || safeCode,
    },
  };
}

export function normalizeGatewayError(error, context = {}) {
  if (error && error.error && ERROR_CODES.includes(error.error.code)) {
    return createGatewayError({
      ...error.error,
      details: error.error.details,
      cause: error.error.cause,
    });
  }

  return createGatewayError({
    code: context.code || 'internal_error',
    message: error && error.message ? error.message : 'Gateway error',
    provider: context.provider || null,
    model: context.model || null,
    request_id: context.request_id || null,
    details: context.details || null,
    cause: context.cause || (error && error.name) || 'unknown',
  });
}
