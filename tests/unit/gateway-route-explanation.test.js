import { describe, expect, it } from 'vitest';
import { dryRunGatewayRoute } from '../../src/gateway/index.js';
import { baseRoutingRequest, createRoutingSnapshot } from '../fixtures/gateway-routing/fixtures.js';

describe('gateway route explanations', () => {
  it('returns human and machine-readable planning explanations', () => {
    const result = dryRunGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: {
        ...baseRoutingRequest,
        messages: [{ role: 'user', content: 'secret prompt body must not appear' }],
        metadata: { ...baseRoutingRequest.metadata, api_key: 'sk-test-secret-value' },
      },
      requestId: 'req-explain',
      decisionTime: 1800000000,
    });
    const serialized = JSON.stringify(result);

    expect(result.executed).toBe(false);
    expect(result.explanation.summary).toContain('planning only');
    expect(result.explanation.score_breakdown.length).toBeGreaterThan(0);
    expect(serialized).not.toContain('secret prompt body');
    expect(serialized).not.toContain('sk-test-secret-value');
  });
});
