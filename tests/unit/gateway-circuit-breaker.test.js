import { describe, expect, it } from 'vitest';
import { simulateCircuitBreakerTransition } from '../../src/gateway/index.js';

const policy = { enabled: true, failure_threshold: 2, success_threshold: 1, open_duration_ms: 1000, half_open_max_attempts: 1, tracked_categories: ['timeout'], scope: 'provider' };

describe('gateway circuit breaker simulation', () => {
  it('transitions closed to open after tracked failures', () => {
    const transition = simulateCircuitBreakerTransition({
      currentState: { state: 'closed', failure_count: 1 },
      event: { result: 'failure', failure: { category: 'timeout' } },
      policy,
      currentTime: 10,
    });

    expect(transition.next_state).toBe('open');
    expect(transition.allows_attempt).toBe(false);
  });

  it('transitions open to half-open after the supplied time', () => {
    const transition = simulateCircuitBreakerTransition({
      currentState: { state: 'open', failure_count: 2, opened_at: 100 },
      event: { result: 'attempt' },
      policy,
      currentTime: 1200,
    });

    expect(transition.next_state).toBe('half-open');
    expect(transition.allows_attempt).toBe(true);
  });

  it('moves half-open to closed on success and back to open on failure', () => {
    const closed = simulateCircuitBreakerTransition({ currentState: { state: 'half-open' }, event: { result: 'success' }, policy, currentTime: 1300 });
    const opened = simulateCircuitBreakerTransition({ currentState: { state: 'half-open' }, event: { result: 'failure', failure: { category: 'timeout' } }, policy, currentTime: 1300 });

    expect(closed.next_state).toBe('closed');
    expect(opened.next_state).toBe('open');
  });

  it('keeps untracked failures isolated from provider health state', () => {
    const transition = simulateCircuitBreakerTransition({
      currentState: { state: 'closed', failure_count: 1 },
      event: { result: 'failure', failure: { category: 'configuration' } },
      policy,
      currentTime: 10,
    });

    expect(transition.next_state).toBe('closed');
  });
});
