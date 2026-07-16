import { describe, expect, it } from 'vitest';
import { planQuotaResponse } from '../../src/gateway/index.js';

describe('gateway quota planning', () => {
  it('recommends fallback for exhausted quota when available', () => {
    const decision = planQuotaResponse({
      quota: { exhausted: true, provider_reported: true },
      failure: { category: 'quota', fallback_eligible: true },
      fallbackChain: [{ provider_id: 'beta', model_id: 'beta-cheap' }],
      policy: { fallback_allowed: true },
    });

    expect(decision.action).toBe('fallback');
    expect(decision.retry_allowed).toBe(false);
  });

  it('requires user action when no fallback remains', () => {
    const decision = planQuotaResponse({
      quota: { exhausted: true },
      failure: { category: 'quota', fallback_eligible: true },
      fallbackChain: [],
    });

    expect(decision.action).toBe('require-user-action');
    expect(decision.user_action_required).toBe(true);
  });
});
