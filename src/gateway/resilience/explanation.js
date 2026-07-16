import { redactSensitiveValue } from '../protocol/errors.js';

export function createResilienceExplanation({
  finalStatus,
  initialRoute,
  attempts = [],
  retryDecisions = [],
  fallbackDecisions = [],
  timeoutBudget = null,
  circuitBreakerDecisions = [],
  rateLimitDecisions = [],
  quotaDecisions = [],
  warnings = [],
} = {}) {
  return {
    summary: `resilience simulation ended with ${finalStatus || 'unknown'} status`,
    final_status: finalStatus || 'invalid-simulation',
    initial_route: initialRoute || null,
    attempts_planned: redactSensitiveValue(attempts),
    retry_decisions: redactSensitiveValue(retryDecisions),
    fallback_decisions: redactSensitiveValue(fallbackDecisions),
    timeout_budget: redactSensitiveValue(timeoutBudget),
    circuit_breaker_decisions: redactSensitiveValue(circuitBreakerDecisions),
    rate_limit_decisions: redactSensitiveValue(rateLimitDecisions),
    quota_decisions: redactSensitiveValue(quotaDecisions),
    warnings: [...new Set(warnings || [])].sort(),
    deterministic: true,
    executed: false,
  };
}
