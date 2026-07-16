export const CIRCUIT_STATES = Object.freeze(['closed', 'open', 'half-open']);
export const CIRCUIT_SCOPES = Object.freeze(['provider', 'model', 'provider-model']);

export const DEFAULT_CIRCUIT_BREAKER_POLICY = Object.freeze({
  enabled: false,
  failure_threshold: 3,
  success_threshold: 1,
  open_duration_ms: 30000,
  half_open_max_attempts: 1,
  tracked_categories: ['timeout', 'upstream-timeout', 'transient-upstream', 'provider-unavailable', 'stream'],
  scope: 'provider',
  metadata: {},
});

function normalizeState(state = {}) {
  return {
    state: CIRCUIT_STATES.includes(state.state) ? state.state : 'closed',
    failure_count: Number.isInteger(state.failure_count) && state.failure_count >= 0 ? state.failure_count : 0,
    success_count: Number.isInteger(state.success_count) && state.success_count >= 0 ? state.success_count : 0,
    half_open_attempts: Number.isInteger(state.half_open_attempts) && state.half_open_attempts >= 0 ? state.half_open_attempts : 0,
    opened_at: Number.isFinite(state.opened_at) ? state.opened_at : null,
  };
}

function normalizePolicy(policy = {}) {
  const source = { ...DEFAULT_CIRCUIT_BREAKER_POLICY, ...(policy || {}) };
  return {
    enabled: source.enabled === true,
    failure_threshold: Number.isInteger(source.failure_threshold) && source.failure_threshold > 0 ? source.failure_threshold : DEFAULT_CIRCUIT_BREAKER_POLICY.failure_threshold,
    success_threshold: Number.isInteger(source.success_threshold) && source.success_threshold > 0 ? source.success_threshold : DEFAULT_CIRCUIT_BREAKER_POLICY.success_threshold,
    open_duration_ms: Number.isInteger(source.open_duration_ms) && source.open_duration_ms >= 0 ? source.open_duration_ms : DEFAULT_CIRCUIT_BREAKER_POLICY.open_duration_ms,
    half_open_max_attempts: Number.isInteger(source.half_open_max_attempts) && source.half_open_max_attempts > 0 ? source.half_open_max_attempts : DEFAULT_CIRCUIT_BREAKER_POLICY.half_open_max_attempts,
    tracked_categories: Array.isArray(source.tracked_categories) ? [...new Set(source.tracked_categories)].sort() : [...DEFAULT_CIRCUIT_BREAKER_POLICY.tracked_categories],
    scope: CIRCUIT_SCOPES.includes(source.scope) ? source.scope : DEFAULT_CIRCUIT_BREAKER_POLICY.scope,
    metadata: source.metadata && typeof source.metadata === 'object' && !Array.isArray(source.metadata) ? { ...source.metadata } : {},
  };
}

export function simulateCircuitBreakerTransition({
  currentState = {},
  event = {},
  policy = {},
  currentTime = 1,
  openedAt = null,
} = {}) {
  const normalizedPolicy = normalizePolicy(policy);
  const state = normalizeState(currentState);
  const now = Number.isFinite(currentTime) ? currentTime : 1;
  const reasons = [];
  if (!normalizedPolicy.enabled) {
    return {
      previous_state: state.state,
      next_state: state.state,
      failure_count: state.failure_count,
      success_count: state.success_count,
      opened_at: state.opened_at,
      eligible_for_half_open_at: null,
      allows_attempt: true,
      reasons: ['circuit-breaker-disabled'],
    };
  }

  let nextState = state.state;
  let failureCount = state.failure_count;
  let successCount = state.success_count;
  let halfOpenAttempts = state.half_open_attempts;
  let opened = openedAt ?? state.opened_at;
  const category = event.failure?.category || event.category || null;
  const result = event.result || event.type || null;

  if (state.state === 'open') {
    const eligibleAt = (opened ?? now) + normalizedPolicy.open_duration_ms;
    if (now >= eligibleAt) {
      nextState = 'half-open';
      halfOpenAttempts = 0;
      reasons.push('open-duration-elapsed');
    } else {
      return {
        previous_state: state.state,
        next_state: 'open',
        failure_count: failureCount,
        success_count: successCount,
        opened_at: opened,
        eligible_for_half_open_at: eligibleAt,
        allows_attempt: false,
        reasons: ['circuit-open'],
      };
    }
  }

  if (result === 'success') {
    successCount += 1;
    failureCount = 0;
    if (nextState === 'half-open' && successCount >= normalizedPolicy.success_threshold) {
      nextState = 'closed';
      opened = null;
      halfOpenAttempts = 0;
      reasons.push('half-open-success-threshold-met');
    }
  } else if (result === 'failure' && normalizedPolicy.tracked_categories.includes(category)) {
    failureCount += 1;
    successCount = 0;
    if (nextState === 'half-open' || failureCount >= normalizedPolicy.failure_threshold) {
      nextState = 'open';
      opened = now;
      reasons.push(nextState === 'open' ? 'failure-threshold-met' : 'failure-tracked');
    }
  } else if (result === 'attempt') {
    halfOpenAttempts += nextState === 'half-open' ? 1 : 0;
    if (nextState === 'half-open' && halfOpenAttempts > normalizedPolicy.half_open_max_attempts) {
      return {
        previous_state: state.state,
        next_state: 'half-open',
        failure_count: failureCount,
        success_count: successCount,
        opened_at: opened,
        eligible_for_half_open_at: opened === null ? null : opened + normalizedPolicy.open_duration_ms,
        allows_attempt: false,
        reasons: ['half-open-attempt-limit'],
      };
    }
  } else if (result === 'failure') {
    reasons.push('failure-category-not-tracked');
  }

  return {
    previous_state: state.state,
    next_state: nextState,
    failure_count: failureCount,
    success_count: successCount,
    opened_at: opened,
    eligible_for_half_open_at: opened === null ? null : opened + normalizedPolicy.open_duration_ms,
    allows_attempt: nextState !== 'open',
    reasons: reasons.length ? reasons : ['state-unchanged'],
  };
}
