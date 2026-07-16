import { normalizeRetryPolicy } from './retry-policy.js';

export function normalizeRateLimitState(rateLimit = {}) {
  return {
    retry_after_ms: Number.isFinite(rateLimit.retry_after_ms) && rateLimit.retry_after_ms >= 0 ? Math.round(rateLimit.retry_after_ms) : null,
    limit: Number.isFinite(rateLimit.limit) && rateLimit.limit >= 0 ? rateLimit.limit : null,
    remaining: Number.isFinite(rateLimit.remaining) && rateLimit.remaining >= 0 ? rateLimit.remaining : null,
    reset_at: Number.isFinite(rateLimit.reset_at) ? rateLimit.reset_at : null,
    scope: typeof rateLimit.scope === 'string' && rateLimit.scope ? rateLimit.scope : 'provider',
    provider_reported: rateLimit.provider_reported === true,
    metadata: rateLimit.metadata && typeof rateLimit.metadata === 'object' && !Array.isArray(rateLimit.metadata) ? { ...rateLimit.metadata } : {},
  };
}

export function planRateLimitResponse({
  failure,
  rateLimit = {},
  retryPolicy = {},
  currentTime = 1,
} = {}) {
  const normalizedRateLimit = normalizeRateLimitState(rateLimit);
  const policy = normalizeRetryPolicy(retryPolicy);
  const warnings = [];
  const reasons = [];
  if (failure?.category !== 'rate-limit') reasons.push('failure-is-not-rate-limit');
  if (normalizedRateLimit.retry_after_ms === null && normalizedRateLimit.reset_at !== null) {
    normalizedRateLimit.retry_after_ms = Math.max(0, normalizedRateLimit.reset_at - currentTime);
  }
  if (normalizedRateLimit.retry_after_ms === null) warnings.push('retry-after metadata unavailable');
  const retryAllowed = policy.enabled
    && policy.retry_on_rate_limit
    && normalizedRateLimit.retry_after_ms !== null
    && normalizedRateLimit.retry_after_ms <= policy.max_total_delay_ms;
  const fallbackRecommended = failure?.fallback_eligible === true && !retryAllowed;
  let action = 'fail';
  if (retryAllowed && normalizedRateLimit.retry_after_ms > 0) action = 'wait-then-retry';
  if (retryAllowed && normalizedRateLimit.retry_after_ms === 0) action = 'retry-same-route';
  if (fallbackRecommended) action = 'fallback';
  if (!retryAllowed && !fallbackRecommended && failure?.category === 'rate-limit') action = 'require-user-action';
  return {
    action,
    retry_allowed: retryAllowed,
    fallback_recommended: fallbackRecommended,
    planned_delay_ms: retryAllowed ? normalizedRateLimit.retry_after_ms : null,
    reset_at: normalizedRateLimit.reset_at,
    warnings,
    reasons,
  };
}
