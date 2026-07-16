import { describe, expect, it } from 'vitest';
import { resolveGatewayRoute } from '../../src/gateway/index.js';
import { baseRoutingRequest, createRoutingSnapshot } from '../fixtures/gateway-routing/fixtures.js';

describe('gateway router scoring', () => {
  it('prefers lower known static cost for cost-first planning', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: baseRoutingRequest,
      policy: { strategy: 'cost-first' },
      requestId: 'req-cost',
      decisionTime: 1800000000,
    });

    expect(decision.selected_model).toBe('beta-cheap');
    expect(decision.strategy).toBe('cost-first');
  });

  it('marks missing cost metrics without treating them as free', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: { ...baseRoutingRequest, required_capabilities: ['vision'] },
      policy: { strategy: 'cost-first' },
      requestId: 'req-missing-cost',
      decisionTime: 1800000000,
    });

    expect(decision.selected_model).toBe('beta-vision');
    expect(decision.warnings).toContain('cost metrics unavailable for all viable candidates');
  });

  it('prefers lower static latency hint for latency-first planning', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: baseRoutingRequest,
      policy: { strategy: 'latency-first' },
      requestId: 'req-latency',
      decisionTime: 1800000000,
    });

    expect(decision.selected_model).toBe('ollama:local-chat');
  });
});
