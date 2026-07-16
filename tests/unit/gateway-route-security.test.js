import { describe, expect, it, vi } from 'vitest';
import { dryRunGatewayRoute } from '../../src/gateway/index.js';
import { baseRoutingRequest, createRoutingSnapshot } from '../fixtures/gateway-routing/fixtures.js';

describe('gateway route security boundaries', () => {
  it('dry-run always reports executed false and performs no network call', () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    try {
      const result = dryRunGatewayRoute({
        snapshot: createRoutingSnapshot(),
        request: baseRoutingRequest,
        requestId: 'req-dry-run',
        decisionTime: 1800000000,
      });

      expect(result.executed).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('does not read provider credential values into decisions', () => {
    process.env.ALPHA_API_KEY = 'sk-test-secret-value';
    const result = dryRunGatewayRoute({
      snapshot: createRoutingSnapshot(),
      request: baseRoutingRequest,
      requestId: 'req-env',
      decisionTime: 1800000000,
    });

    expect(JSON.stringify(result)).not.toContain('sk-test-secret-value');
    delete process.env.ALPHA_API_KEY;
  });
});
