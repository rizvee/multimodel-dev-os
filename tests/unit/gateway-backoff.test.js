import { describe, expect, it } from 'vitest';
import { planRetryDelay } from '../../src/gateway/index.js';

describe('gateway backoff planning', () => {
  it('plans fixed, linear, exponential, and bounded exponential delays', () => {
    const base = { max_total_delay_ms: 10000, base_delay_ms: 100, max_delay_ms: 1000, multiplier: 2 };

    expect(planRetryDelay({ attempt: 2, policy: { ...base, backoff_strategy: 'fixed' } }).bounded_delay_ms).toBe(100);
    expect(planRetryDelay({ attempt: 2, policy: { ...base, backoff_strategy: 'linear' } }).bounded_delay_ms).toBe(200);
    expect(planRetryDelay({ attempt: 3, policy: { ...base, backoff_strategy: 'exponential' } }).bounded_delay_ms).toBe(400);
    expect(planRetryDelay({ attempt: 5, policy: { ...base, backoff_strategy: 'bounded-exponential' } }).bounded_delay_ms).toBe(1000);
  });

  it('respects retry-after metadata within ceilings', () => {
    const delay = planRetryDelay({
      attempt: 2,
      retryAfterMs: 250,
      policy: { max_total_delay_ms: 1000, max_delay_ms: 500, backoff_strategy: 'fixed', base_delay_ms: 100, respect_retry_after: true },
    });

    expect(delay.strategy).toBe('retry-after');
    expect(delay.bounded_delay_ms).toBe(250);
  });

  it('rejects malformed retry-after metadata and supports deterministic jitter', () => {
    const bad = planRetryDelay({ retryAfterMs: -1, policy: { backoff_strategy: 'retry-after' } });
    const first = planRetryDelay({ attempt: 3, deterministicSeed: 'seed', policy: { max_total_delay_ms: 10000, max_delay_ms: 1000, base_delay_ms: 100, backoff_strategy: 'exponential', jitter_mode: 'deterministic' } });
    const second = planRetryDelay({ attempt: 3, deterministicSeed: 'seed', policy: { max_total_delay_ms: 10000, max_delay_ms: 1000, base_delay_ms: 100, backoff_strategy: 'exponential', jitter_mode: 'deterministic' } });

    expect(bad.warnings).toContain('retry-after must be a non-negative finite value');
    expect(first).toEqual(second);
    expect(first.jitter_applied).toBe(true);
  });
});
