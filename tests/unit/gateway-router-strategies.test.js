import { describe, expect, it } from 'vitest';
import { resolveGatewayRoute } from '../../src/gateway/index.js';
import { baseRoutingRequest, createRoutingSnapshot } from '../fixtures/gateway-routing/fixtures.js';

describe('gateway router strategies', () => {
  it('supports explicit provider and model selection', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: { ...baseRoutingRequest, requested_provider: 'alpha', requested_model: 'alpha-fast' },
      requestId: 'req-explicit',
      decisionTime: 1800000000,
    });

    expect(decision.selected_provider).toBe('alpha');
    expect(decision.selected_model).toBe('alpha-fast');
    expect(decision.strategy).toBe('explicit');
  });

  it('resolves model aliases deterministically', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: { ...baseRoutingRequest, requested_model: 'fast' },
      requestId: 'req-alias',
      decisionTime: 1800000000,
    });

    expect(decision.selected_model).toBe('alpha-fast');
  });

  it('uses capability strategy for preferred capability matches', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: { ...baseRoutingRequest, preferred_capabilities: ['tools'] },
      policy: { strategy: 'capability' },
      requestId: 'req-capability',
      decisionTime: 1800000000,
    });

    expect(decision.selected_model).toBe('alpha-fast');
    expect(decision.strategy).toBe('capability-based');
  });

  it('uses routing presets and caller policy precedence', () => {
    const decision = resolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: baseRoutingRequest,
      presetId: 'cheap-chat',
      policy: { strategy: 'latency-first' },
      requestId: 'req-preset',
      decisionTime: 1800000000,
    });

    expect(decision.strategy).toBe('latency-first');
    expect(decision.explanation.preset_id).toBe('cheap-chat');
  });
});
