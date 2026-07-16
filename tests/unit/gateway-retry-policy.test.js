import { describe, expect, it } from 'vitest';
import { evaluateRetryEligibility, validateRetryPolicy } from '../../src/gateway/index.js';

const timeoutFailure = { category: 'timeout', code: 'timeout', retryable: true };

describe('gateway retry policy', () => {
  it('allows timeout retry only when policy permits it', () => {
    const decision = evaluateRetryEligibility({
      failure: timeoutFailure,
      policy: {
        enabled: true,
        max_attempts: 2,
        max_total_delay_ms: 1000,
        same_provider_retry_limit: 1,
        same_model_retry_limit: 1,
        retry_on_timeout: true,
      },
      attemptHistory: [],
      currentCandidate: { provider_id: 'alpha', model_id: 'alpha-fast' },
    });

    expect(decision.eligible).toBe(true);
  });

  it('enforces same-provider and same-model limits', () => {
    const policy = {
      enabled: true,
      max_attempts: 3,
      max_total_delay_ms: 1000,
      same_provider_retry_limit: 1,
      same_model_retry_limit: 1,
      retry_on_timeout: true,
    };
    const decision = evaluateRetryEligibility({
      failure: timeoutFailure,
      policy,
      attemptHistory: [{ provider_id: 'alpha', model_id: 'alpha-fast', planned_delay_ms: 100 }],
      currentCandidate: { provider_id: 'alpha', model_id: 'alpha-fast' },
    });

    expect(decision.eligible).toBe(false);
    expect(decision.reason_codes).toContain('same-provider-limit-exhausted');
    expect(decision.reason_codes).toContain('same-model-limit-exhausted');
  });

  it('rejects non-retryable and policy-denied failures', () => {
    const policy = { enabled: true, max_attempts: 3, max_total_delay_ms: 1000 };
    const invalid = evaluateRetryEligibility({ failure: { category: 'invalid-request', code: 'invalid_request', retryable: false }, policy });
    const denied = evaluateRetryEligibility({ failure: { category: 'policy-denied', code: 'policy_denied', retryable: false }, policy });

    expect(invalid.eligible).toBe(false);
    expect(denied.eligible).toBe(false);
    expect(denied.reason_codes).toContain('policy-denied');
  });

  it('validates bounded retry policy values', () => {
    expect(validateRetryPolicy({ max_attempts: 0 }).success).toBe(false);
    expect(validateRetryPolicy({ backoff_strategy: 'fixed', max_attempts: 2 }).success).toBe(true);
  });
});
