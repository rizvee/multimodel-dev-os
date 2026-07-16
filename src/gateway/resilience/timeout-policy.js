export const DEFAULT_TIMEOUT_POLICY = Object.freeze({
  request_timeout_ms: 60000,
  provider_timeout_ms: 60000,
  connect_timeout_ms: 10000,
  stream_idle_timeout_ms: 30000,
  stream_total_timeout_ms: 60000,
  total_operation_timeout_ms: 120000,
  timeout_retryable: false,
  metadata: {},
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeInteger(value, fallback, max = 3600000) {
  return Number.isInteger(value) && value >= 0 && value <= max ? value : fallback;
}

export function normalizeTimeoutPolicy(policy = {}) {
  const source = { ...DEFAULT_TIMEOUT_POLICY, ...(policy || {}) };
  return {
    request_timeout_ms: normalizeInteger(source.request_timeout_ms, DEFAULT_TIMEOUT_POLICY.request_timeout_ms),
    provider_timeout_ms: normalizeInteger(source.provider_timeout_ms, DEFAULT_TIMEOUT_POLICY.provider_timeout_ms),
    connect_timeout_ms: normalizeInteger(source.connect_timeout_ms, DEFAULT_TIMEOUT_POLICY.connect_timeout_ms),
    stream_idle_timeout_ms: normalizeInteger(source.stream_idle_timeout_ms, DEFAULT_TIMEOUT_POLICY.stream_idle_timeout_ms),
    stream_total_timeout_ms: normalizeInteger(source.stream_total_timeout_ms, DEFAULT_TIMEOUT_POLICY.stream_total_timeout_ms),
    total_operation_timeout_ms: normalizeInteger(source.total_operation_timeout_ms, DEFAULT_TIMEOUT_POLICY.total_operation_timeout_ms),
    timeout_retryable: source.timeout_retryable === true,
    metadata: source.metadata && typeof source.metadata === 'object' && !Array.isArray(source.metadata) ? clone(source.metadata) : {},
  };
}

export function validateTimeoutPolicy(policy = {}) {
  const errors = [];
  for (const field of Object.keys(DEFAULT_TIMEOUT_POLICY)) {
    if (field === 'timeout_retryable' || field === 'metadata') continue;
    if (policy[field] !== undefined && (!Number.isInteger(policy[field]) || policy[field] < 0 || policy[field] > 3600000)) {
      errors.push({ code: 'configuration_error', path: field, message: `${field} must be a bounded non-negative integer` });
    }
  }
  const normalized = normalizeTimeoutPolicy(policy);
  if (normalized.total_operation_timeout_ms < normalized.provider_timeout_ms) {
    errors.push({ code: 'configuration_error', path: 'total_operation_timeout_ms', message: 'total operation timeout must cover provider timeout' });
  }
  return { success: errors.length === 0, errors, warnings: [], value: normalized };
}

export function planTimeoutBudget({
  policy = {},
  elapsedMs = 0,
  attempt = 1,
  plannedDelayMs = 0,
} = {}) {
  const normalized = normalizeTimeoutPolicy(policy);
  const elapsed = Number.isFinite(elapsedMs) && elapsedMs >= 0 ? elapsedMs : 0;
  const delay = Number.isFinite(plannedDelayMs) && plannedDelayMs >= 0 ? plannedDelayMs : 0;
  const remaining = Math.max(0, normalized.total_operation_timeout_ms - elapsed - delay);
  const warnings = [];
  if (remaining === 0) warnings.push('operation timeout budget exhausted');
  if (delay > 0 && remaining < normalized.provider_timeout_ms) warnings.push('planned delay reduces provider budget');
  return {
    remaining_operation_ms: remaining,
    provider_budget_ms: Math.min(normalized.provider_timeout_ms, remaining),
    stream_idle_budget_ms: Math.min(normalized.stream_idle_timeout_ms, remaining),
    stream_total_budget_ms: Math.min(normalized.stream_total_timeout_ms, remaining),
    retry_possible: normalized.timeout_retryable && remaining > 0,
    fallback_possible: remaining > 0,
    attempt: Number.isInteger(attempt) && attempt > 0 ? attempt : 1,
    warnings,
  };
}
