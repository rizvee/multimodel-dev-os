export const DEFAULT_RETRY_POLICY = Object.freeze({
  enabled: false,
  max_attempts: 1,
  max_total_delay_ms: 0,
  retryable_categories: ['rate-limit', 'timeout', 'upstream-timeout', 'transient-upstream', 'provider-unavailable', 'stream'],
  retryable_codes: ['rate_limited', 'timeout', 'upstream_timeout', 'upstream_error', 'provider_unavailable', 'stream_error'],
  same_provider_retry_limit: 0,
  same_model_retry_limit: 0,
  respect_retry_after: true,
  backoff_strategy: 'none',
  base_delay_ms: 0,
  max_delay_ms: 0,
  multiplier: 2,
  jitter_mode: 'none',
  retry_on_timeout: false,
  retry_on_rate_limit: false,
  metadata: {},
});

export const BACKOFF_STRATEGIES = Object.freeze([
  'none',
  'fixed',
  'linear',
  'exponential',
  'retry-after',
  'bounded-exponential',
]);

export const JITTER_MODES = Object.freeze(['none', 'deterministic']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isFiniteInteger(value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function arrayOfStrings(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.trim() !== '');
}

function normalizeInteger(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  return isFiniteInteger(value, { min, max }) ? value : fallback;
}

export function normalizeRetryPolicy(policy = {}) {
  const source = { ...DEFAULT_RETRY_POLICY, ...(policy || {}) };
  return {
    enabled: source.enabled === true,
    max_attempts: normalizeInteger(source.max_attempts, DEFAULT_RETRY_POLICY.max_attempts, { min: 1, max: 10 }),
    max_total_delay_ms: normalizeInteger(source.max_total_delay_ms, DEFAULT_RETRY_POLICY.max_total_delay_ms, { min: 0, max: 3600000 }),
    retryable_categories: arrayOfStrings(source.retryable_categories) ? [...new Set(source.retryable_categories)].sort() : clone(DEFAULT_RETRY_POLICY.retryable_categories),
    retryable_codes: arrayOfStrings(source.retryable_codes) ? [...new Set(source.retryable_codes)].sort() : clone(DEFAULT_RETRY_POLICY.retryable_codes),
    same_provider_retry_limit: normalizeInteger(source.same_provider_retry_limit, DEFAULT_RETRY_POLICY.same_provider_retry_limit, { min: 0, max: 10 }),
    same_model_retry_limit: normalizeInteger(source.same_model_retry_limit, DEFAULT_RETRY_POLICY.same_model_retry_limit, { min: 0, max: 10 }),
    respect_retry_after: source.respect_retry_after !== false,
    backoff_strategy: BACKOFF_STRATEGIES.includes(source.backoff_strategy) ? source.backoff_strategy : DEFAULT_RETRY_POLICY.backoff_strategy,
    base_delay_ms: normalizeInteger(source.base_delay_ms, DEFAULT_RETRY_POLICY.base_delay_ms, { min: 0, max: 3600000 }),
    max_delay_ms: normalizeInteger(source.max_delay_ms, DEFAULT_RETRY_POLICY.max_delay_ms, { min: 0, max: 3600000 }),
    multiplier: Number.isFinite(source.multiplier) && source.multiplier >= 1 && source.multiplier <= 10 ? source.multiplier : DEFAULT_RETRY_POLICY.multiplier,
    jitter_mode: JITTER_MODES.includes(source.jitter_mode) ? source.jitter_mode : DEFAULT_RETRY_POLICY.jitter_mode,
    retry_on_timeout: source.retry_on_timeout === true,
    retry_on_rate_limit: source.retry_on_rate_limit === true,
    metadata: source.metadata && typeof source.metadata === 'object' && !Array.isArray(source.metadata) ? clone(source.metadata) : {},
  };
}

export function validateRetryPolicy(policy = {}) {
  const normalized = normalizeRetryPolicy(policy);
  const errors = [];
  if (policy.max_attempts !== undefined && !isFiniteInteger(policy.max_attempts, { min: 1, max: 10 })) {
    errors.push({ code: 'configuration_error', path: 'max_attempts', message: 'max_attempts must be an integer from 1 to 10' });
  }
  if (policy.max_total_delay_ms !== undefined && !isFiniteInteger(policy.max_total_delay_ms, { min: 0, max: 3600000 })) {
    errors.push({ code: 'configuration_error', path: 'max_total_delay_ms', message: 'max_total_delay_ms must be a bounded non-negative integer' });
  }
  if (policy.backoff_strategy !== undefined && !BACKOFF_STRATEGIES.includes(policy.backoff_strategy)) {
    errors.push({ code: 'configuration_error', path: 'backoff_strategy', message: 'backoff_strategy is unsupported' });
  }
  if (policy.jitter_mode !== undefined && !JITTER_MODES.includes(policy.jitter_mode)) {
    errors.push({ code: 'configuration_error', path: 'jitter_mode', message: 'jitter_mode is unsupported' });
  }
  return {
    success: errors.length === 0,
    errors,
    warnings: normalized.enabled && normalized.max_attempts === 1 ? ['retry policy is enabled but permits only one attempt'] : [],
    value: normalized,
  };
}

function historyDelay(history) {
  return history.reduce((sum, entry) => sum + (Number.isFinite(entry.planned_delay_ms) ? entry.planned_delay_ms : 0), 0);
}

function historyCount(history, predicate) {
  return history.filter(predicate).length;
}

export function evaluateRetryEligibility({
  failure,
  policy = {},
  attemptHistory = [],
  currentCandidate = {},
} = {}) {
  const normalized = normalizeRetryPolicy(policy);
  const history = Array.isArray(attemptHistory) ? clone(attemptHistory) : [];
  const reasonCodes = [];
  const warnings = [];
  const nextAttempt = history.length + 1;
  const usedDelay = historyDelay(history);
  const remainingDelay = Math.max(0, normalized.max_total_delay_ms - usedDelay);
  const sameProviderCount = historyCount(history, (entry) => entry.provider_id === currentCandidate.provider_id);
  const sameModelCount = historyCount(history, (entry) => entry.model_id === currentCandidate.model_id);
  const sameProviderAllowed = sameProviderCount < normalized.same_provider_retry_limit;
  const sameModelAllowed = sameModelCount < normalized.same_model_retry_limit;

  if (!normalized.enabled) reasonCodes.push('retry-policy-disabled');
  if (!failure?.retryable) reasonCodes.push('failure-not-retryable');
  if (!normalized.retryable_categories.includes(failure?.category)) reasonCodes.push('category-not-allowed');
  if (!normalized.retryable_codes.includes(failure?.code)) reasonCodes.push('code-not-allowed');
  if (failure?.category === 'policy-denied') reasonCodes.push('policy-denied');
  if (failure?.category === 'invalid-request') reasonCodes.push('invalid-request');
  if (failure?.category === 'authentication') reasonCodes.push('authentication-failure');
  if (failure?.category === 'configuration') reasonCodes.push('configuration-failure');
  if (failure?.category === 'timeout' && !normalized.retry_on_timeout) reasonCodes.push('timeout-retry-disabled');
  if (failure?.category === 'rate-limit' && !normalized.retry_on_rate_limit) reasonCodes.push('rate-limit-retry-disabled');
  if (nextAttempt > normalized.max_attempts) reasonCodes.push('max-attempts-exhausted');
  if (remainingDelay <= 0 && normalized.max_total_delay_ms === 0 && normalized.backoff_strategy !== 'none') reasonCodes.push('delay-budget-exhausted');
  if (!sameProviderAllowed) reasonCodes.push('same-provider-limit-exhausted');
  if (!sameModelAllowed) reasonCodes.push('same-model-limit-exhausted');

  const eligible = reasonCodes.length === 0;
  if (!eligible && failure?.category === 'quota') warnings.push('quota failures should prefer fallback or user action');

  return {
    eligible,
    reason_codes: reasonCodes,
    next_attempt: nextAttempt,
    remaining_attempts: Math.max(0, normalized.max_attempts - history.length),
    remaining_delay_budget_ms: remainingDelay,
    same_provider_allowed: sameProviderAllowed,
    same_model_allowed: sameModelAllowed,
    warnings,
  };
}
