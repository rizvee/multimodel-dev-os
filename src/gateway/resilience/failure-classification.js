import { ERROR_CODES } from '../protocol/constants.js';
import { redactSensitiveValue } from '../protocol/errors.js';

export const FAILURE_CATEGORIES = Object.freeze([
  'invalid-request',
  'authentication',
  'authorization',
  'rate-limit',
  'quota',
  'timeout',
  'upstream-timeout',
  'transient-upstream',
  'permanent-upstream',
  'context-limit',
  'unsupported-capability',
  'provider-unavailable',
  'policy-denied',
  'configuration',
  'stream',
  'internal',
]);

const CODE_CATEGORY = Object.freeze({
  invalid_request: 'invalid-request',
  unsupported_field: 'invalid-request',
  unsupported_capability: 'unsupported-capability',
  model_not_found: 'invalid-request',
  provider_not_found: 'invalid-request',
  provider_unavailable: 'provider-unavailable',
  authentication_required: 'authentication',
  authentication_failed: 'authentication',
  rate_limited: 'rate-limit',
  quota_exceeded: 'quota',
  context_length_exceeded: 'context-limit',
  request_too_large: 'invalid-request',
  timeout: 'timeout',
  upstream_timeout: 'upstream-timeout',
  upstream_error: 'transient-upstream',
  stream_error: 'stream',
  policy_denied: 'policy-denied',
  configuration_error: 'configuration',
  internal_error: 'internal',
});

const RETRYABLE_CATEGORIES = new Set([
  'rate-limit',
  'timeout',
  'upstream-timeout',
  'transient-upstream',
  'provider-unavailable',
  'stream',
]);

const FALLBACK_CATEGORIES = new Set([
  'rate-limit',
  'quota',
  'timeout',
  'upstream-timeout',
  'transient-upstream',
  'permanent-upstream',
  'context-limit',
  'unsupported-capability',
  'provider-unavailable',
  'stream',
  'internal',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function numberOrNull(value) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function errorPayload(error) {
  if (isObject(error?.error)) return error.error;
  if (isObject(error)) return error;
  return {};
}

function normalizeCode(error) {
  const payload = errorPayload(error);
  return ERROR_CODES.includes(payload.code) ? payload.code : 'internal_error';
}

function retryAfter(error) {
  const payload = errorPayload(error);
  return numberOrNull(payload.retry_after_ms)
    ?? numberOrNull(payload.details?.retry_after_ms)
    ?? numberOrNull(payload.details?.retry_after);
}

function statusFor(code, error) {
  const payload = errorPayload(error);
  if (Number.isInteger(payload.status)) return payload.status;
  if (Number.isInteger(payload.details?.status)) return payload.details.status;
  if (code === 'rate_limited' || code === 'quota_exceeded') return 429;
  if (code === 'timeout') return 408;
  if (code === 'upstream_timeout') return 504;
  if (code === 'provider_unavailable') return 503;
  if (code === 'authentication_required' || code === 'authentication_failed') return 401;
  if (code === 'policy_denied') return 403;
  return code === 'internal_error' ? 500 : 400;
}

export function classifyGatewayFailure({
  error,
  providerId = null,
  modelId = null,
  attempt = 1,
  requestId = null,
} = {}) {
  const code = normalizeCode(error);
  const category = CODE_CATEGORY[code] || 'internal';
  const policyFault = category === 'policy-denied';
  const requestFault = [
    'invalid-request',
    'context-limit',
    'unsupported-capability',
    'authentication',
    'authorization',
    'configuration',
  ].includes(category);
  const providerFault = [
    'rate-limit',
    'quota',
    'timeout',
    'upstream-timeout',
    'transient-upstream',
    'permanent-upstream',
    'provider-unavailable',
    'stream',
  ].includes(category);
  const retryable = RETRYABLE_CATEGORIES.has(category) && !policyFault;
  const fallbackEligible = FALLBACK_CATEGORIES.has(category) && !policyFault;
  const retryAfterMs = retryAfter(error);
  const reasons = [`classified ${code} as ${category}`];
  const warnings = [];

  if (category === 'rate-limit' && retryAfterMs === null) {
    warnings.push('rate limit is retryable only when bounded by retry policy');
  }
  if (category === 'quota') {
    reasons.push('quota exhaustion favors fallback over same-provider retry');
  }
  if (category === 'policy-denied') {
    reasons.push('policy denial cannot be bypassed by retry or fallback');
  }
  if (category === 'internal') {
    warnings.push('unknown failures use conservative classification');
  }

  return {
    category,
    code,
    retryable,
    fallback_eligible: fallbackEligible,
    provider_fault: providerFault,
    request_fault: requestFault,
    policy_fault: policyFault,
    status: statusFor(code, error),
    retry_after_ms: retryAfterMs,
    provider_id: providerId,
    model_id: modelId,
    attempt: Number.isInteger(attempt) && attempt > 0 ? attempt : 1,
    request_id: requestId,
    details: redactSensitiveValue(errorPayload(error).details || null),
    reasons,
    warnings,
  };
}
