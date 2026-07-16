import { describe, expect, it } from 'vitest';
import { resolveGatewayRoute } from '../../src/gateway/index.js';
import { baseRoutingRequest, createRoutingSnapshot } from '../fixtures/gateway-routing/fixtures.js';

describe('gateway router fallback planning', () => {
  it('plans bounded fallback chains without execution', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: baseRoutingRequest,
      policy: { strategy: 'fallback-chain', max_fallbacks: 2 },
      requestId: 'req-fallback',
      decisionTime: 1800000000,
    });

    expect(decision.fallback_chain).toHaveLength(2);
    expect(decision.fallback_chain[0]).toMatchObject({ rank: 1 });
    expect(decision.fallback_chain.every((entry) => entry.reasons[0].includes('planned'))).toBe(true);
  });

  it('omits fallbacks when disabled', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: { ...baseRoutingRequest, fallback_allowed: false },
      policy: { fallback_allowed: false },
      requestId: 'req-no-fallback',
      decisionTime: 1800000000,
    });

    expect(decision.fallback_chain).toEqual([]);
  });
});
