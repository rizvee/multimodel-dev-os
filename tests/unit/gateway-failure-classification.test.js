import { describe, expect, it } from 'vitest';
import { classifyGatewayFailure } from '../../src/gateway/index.js';

describe('gateway failure classification', () => {
  it('classifies timeout as retryable and fallback eligible', () => {
    const failure = classifyGatewayFailure({ error: { code: 'timeout' }, providerId: 'alpha', modelId: 'alpha-fast', attempt: 1 });

    expect(failure.category).toBe('timeout');
    expect(failure.retryable).toBe(true);
    expect(failure.fallback_eligible).toBe(true);
  });

  it('keeps invalid request and authentication failures non-retryable', () => {
    const invalid = classifyGatewayFailure({ error: { code: 'invalid_request' } });
    const auth = classifyGatewayFailure({ error: { code: 'authentication_failed' } });

    expect(invalid.retryable).toBe(false);
    expect(auth.retryable).toBe(false);
    expect(auth.category).toBe('authentication');
  });

  it('prevents policy denial bypass through retry or fallback', () => {
    const failure = classifyGatewayFailure({ error: { code: 'policy_denied' } });

    expect(failure.retryable).toBe(false);
    expect(failure.fallback_eligible).toBe(false);
    expect(failure.policy_fault).toBe(true);
  });

  it('redacts sensitive failure details', () => {
    const failure = classifyGatewayFailure({
      error: { code: 'upstream_error', details: { api_key: 'secret-value', safe: 'ok' } },
    });

    expect(failure.details.api_key).toBe('[REDACTED]');
    expect(failure.details.safe).toBe('ok');
  });
});
