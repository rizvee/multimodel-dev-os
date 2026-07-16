import { describe, expect, it } from 'vitest';
import { planRateLimitResponse } from '../../src/gateway/index.js';

describe('gateway rate-limit planning', () => {
  it('respects normalized retry-after metadata', () => {
    const decision = planRateLimitResponse({
      failure: { category: 'rate-limit', fallback_eligible: true },
      rateLimit: { retry_after_ms: 200, provider_reported: true },
      retryPolicy: { enabled: true, retry_on_rate_limit: true, max_total_delay_ms: 1000 },
      currentTime: 100,
    });

    expect(decision.action).toBe('wait-then-retry');
    expect(decision.planned_delay_ms).toBe(200);
  });

  it('recommends fallback when retry metadata is unavailable', () => {
    const decision = planRateLimitResponse({
      failure: { category: 'rate-limit', fallback_eligible: true },
      rateLimit: {},
      retryPolicy: { enabled: true, retry_on_rate_limit: true, max_total_delay_ms: 1000 },
    });

    expect(decision.action).toBe('fallback');
    expect(decision.fallback_recommended).toBe(true);
  });
});
