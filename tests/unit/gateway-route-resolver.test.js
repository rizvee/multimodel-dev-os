import { describe, expect, it } from 'vitest';
import { resolveGatewayRoute, tryResolveGatewayRoute } from '../../src/gateway/index.js';
import { baseRoutingRequest, createRoutingSnapshot } from '../fixtures/gateway-routing/fixtures.js';

describe('gateway route resolver', () => {
  it('is deterministic for repeated equivalent inputs', () => {
    const options = {
      snapshot: createRoutingSnapshot(),
      request: baseRoutingRequest,
      requestId: 'req-deterministic',
      decisionTime: 1800000000,
    };

    expect(resolveGatewayRoute(options)).toEqual(resolveGatewayRoute(options));
  });

  it('does not mutate request, policy, or snapshot objects', () => {
    const snapshot = createRoutingSnapshot();
    const request = { ...baseRoutingRequest };
    const policy = { strategy: 'balanced' };
    const before = JSON.stringify({ snapshot, request, policy });

    resolveGatewayRoute({ snapshot, request, policy, requestId: 'req-mutation', decisionTime: 1800000000 });

    expect(JSON.stringify({ snapshot, request, policy })).toBe(before);
  });

  it('returns structured errors for unknown provider and no viable candidates', () => {
    const provider = tryResolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: { ...baseRoutingRequest, requested_provider: 'missing' },
      requestId: 'req-missing-provider',
      decisionTime: 1800000000,
    });
    const noViable = tryResolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: { ...baseRoutingRequest, required_capabilities: ['audio'] },
      requestId: 'req-no-viable',
      decisionTime: 1800000000,
    });

    expect(provider.success).toBe(false);
    expect(provider.error.error.code).toBe('provider_not_found');
    expect(noViable.success).toBe(false);
    expect(noViable.error.error.cause).toBe('no_viable_candidate');
  });

  it('returns provider/model mismatch as a structured error', () => {
    const result = tryResolveGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: { ...baseRoutingRequest, requested_provider: 'alpha', requested_model: 'beta-cheap' },
      requestId: 'req-mismatch',
      decisionTime: 1800000000,
    });

    expect(result.success).toBe(false);
    expect(result.error.error.cause).toBe('provider_model_mismatch');
  });
});
