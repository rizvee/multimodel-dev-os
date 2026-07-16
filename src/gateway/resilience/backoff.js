import { normalizeRetryPolicy } from './retry-policy.js';

function deterministicRatio(seed) {
  const text = String(seed || 'resilience');
  let hash = 0;
  for (let index = 0; index < text.length; index++) {
    hash = ((hash * 31) + text.charCodeAt(index)) % 1000003;
  }
  return (hash % 1000) / 1000;
}

function calculateDelay(strategy, attempt, policy, retryAfterMs) {
  if (strategy === 'none') return 0;
  if (strategy === 'retry-after') return retryAfterMs ?? policy.base_delay_ms;
  if (strategy === 'fixed') return policy.base_delay_ms;
  if (strategy === 'linear') return policy.base_delay_ms * attempt;
  if (strategy === 'exponential') return policy.base_delay_ms * (policy.multiplier ** Math.max(0, attempt - 1));
  if (strategy === 'bounded-exponential') return policy.base_delay_ms * (policy.multiplier ** Math.max(0, attempt - 1));
  return 0;
}

export function planRetryDelay({
  attempt = 1,
  policy = {},
  retryAfterMs = null,
  deterministicSeed = 'retry-delay',
} = {}) {
  const normalized = normalizeRetryPolicy(policy);
  const warnings = [];
  const safeAttempt = Number.isInteger(attempt) && attempt > 0 ? attempt : 1;
  if (retryAfterMs !== null && (!Number.isFinite(retryAfterMs) || retryAfterMs < 0)) {
    return {
      strategy: normalized.backoff_strategy,
      attempt: safeAttempt,
      base_delay_ms: normalized.base_delay_ms,
      calculated_delay_ms: 0,
      bounded_delay_ms: 0,
      retry_after_applied: false,
      jitter_applied: false,
      total_delay_after_attempt_ms: 0,
      warnings: ['retry-after must be a non-negative finite value'],
    };
  }
  const retryAfterApplied = normalized.respect_retry_after && retryAfterMs !== null;
  const strategy = retryAfterApplied ? 'retry-after' : normalized.backoff_strategy;
  const calculated = calculateDelay(strategy, safeAttempt, normalized, retryAfterApplied ? retryAfterMs : null);
  const maxDelay = normalized.max_delay_ms > 0 ? normalized.max_delay_ms : calculated;
  let bounded = Math.min(calculated, maxDelay, normalized.max_total_delay_ms || calculated);
  if (bounded < calculated) warnings.push('delay bounded by policy ceiling');
  let jitterApplied = false;
  if (normalized.jitter_mode === 'deterministic' && bounded > 0) {
    jitterApplied = true;
    const adjustment = 0.9 + (deterministicRatio(`${deterministicSeed}:${safeAttempt}`) * 0.2);
    bounded = Math.round(bounded * adjustment);
    if (normalized.max_delay_ms > 0) bounded = Math.min(bounded, normalized.max_delay_ms);
    if (normalized.max_total_delay_ms > 0) bounded = Math.min(bounded, normalized.max_total_delay_ms);
  }
  return {
    strategy,
    attempt: safeAttempt,
    base_delay_ms: normalized.base_delay_ms,
    calculated_delay_ms: Math.round(calculated),
    bounded_delay_ms: Math.round(bounded),
    retry_after_applied: retryAfterApplied,
    jitter_applied: jitterApplied,
    total_delay_after_attempt_ms: Math.round(bounded),
    warnings,
  };
}
