import { describe, expect, it, vi } from 'vitest';
import { simulateGatewayResilience } from '../../src/gateway/index.js';

describe('gateway resilience security posture', () => {
  it('keeps explanations free of prompt content and secrets', () => {
    const result = simulateGatewayResilience({
      routeDecision: {
        selected_provider: 'alpha',
        selected_model: 'alpha-fast',
        strategy: 'balanced',
        score: 0.9,
        reasons: [],
        rejected_candidates: [],
        fallback_chain: [],
        warnings: [],
        request_id: 'secure',
        decision_timestamp: 1,
      },
      outcomes: [{ result: 'failure', error: { code: 'upstream_error', details: { api_key: 'sk-secret-value', prompt: 'secret prompt' } } }],
      retryPolicy: { enabled: false, max_attempts: 1, max_total_delay_ms: 0 },
      requestId: 'secure',
      startTime: 1,
    });
    const serialized = JSON.stringify(result.explanation);

    expect(serialized).not.toContain('sk-secret-value');
    expect(serialized).not.toContain('secret prompt');
    expect(result.executed).toBe(false);
  });

  it('does not use timers, network APIs, provider credentials, or writes', () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const beforeEnv = process.env.OPENAI_API_KEY;

    simulateGatewayResilience({
      routeDecision: {
        selected_provider: 'alpha',
        selected_model: 'alpha-fast',
        strategy: 'balanced',
        score: 0.9,
        reasons: [],
        rejected_candidates: [],
        fallback_chain: [],
        warnings: [],
        request_id: 'secure',
        decision_timestamp: 1,
      },
      outcomes: [{ result: 'success' }],
      requestId: 'secure',
      startTime: 1,
    });

    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(process.env.OPENAI_API_KEY).toBe(beforeEnv);
    timeoutSpy.mockRestore();
    fetchSpy.mockRestore();
  });
});
