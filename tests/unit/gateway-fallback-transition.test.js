import { describe, expect, it } from 'vitest';
import { planFallbackTransition } from '../../src/gateway/index.js';

const chain = [
  { provider_id: 'beta', model_id: 'beta-cheap', rank: 1 },
  { provider_id: 'gamma', model_id: 'gamma-safe', rank: 2 },
];

describe('gateway fallback transition planning', () => {
  it('selects the first valid fallback transition', () => {
    const transition = planFallbackTransition({
      primary: { provider_id: 'alpha', model_id: 'alpha-fast' },
      fallbackChain: chain,
      failure: { category: 'timeout', fallback_eligible: true },
      retryDecision: { eligible: false },
      policy: { fallback_allowed: true, max_fallbacks: 2 },
    });

    expect(transition.transition_allowed).toBe(true);
    expect(transition.to.provider_id).toBe('beta');
  });

  it('respects fallback disabled behavior and policy denial', () => {
    const disabled = planFallbackTransition({ primary: {}, fallbackChain: chain, failure: { fallback_eligible: true }, retryDecision: { eligible: false }, policy: { fallback_allowed: false } });
    const denied = planFallbackTransition({ primary: {}, fallbackChain: chain, failure: { category: 'policy-denied', fallback_eligible: false, policy_fault: true }, retryDecision: { eligible: false }, policy: { fallback_allowed: true } });

    expect(disabled.transition_allowed).toBe(false);
    expect(disabled.reason_codes).toContain('fallback-disabled');
    expect(denied.reason_codes).toContain('policy-denied');
  });

  it('prevents fallback loops and skips exhausted candidates', () => {
    const transition = planFallbackTransition({
      primary: { provider_id: 'alpha', model_id: 'alpha-fast' },
      fallbackChain: [{ provider_id: 'alpha', model_id: 'alpha-fast', rank: 1 }, chain[0]],
      failure: { category: 'timeout', fallback_eligible: true },
      retryDecision: { eligible: false },
      policy: { fallback_allowed: true, max_fallbacks: 2 },
      transitionHistory: [{ to: { provider_id: 'beta', model_id: 'beta-cheap' } }],
    });

    expect(transition.transition_allowed).toBe(false);
    expect(transition.reason_codes).toContain('no-fallback-candidate');
  });
});
