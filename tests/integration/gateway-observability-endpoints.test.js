import { afterEach, describe, expect, it } from 'vitest';
import { requestJson, requestRaw, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway observability endpoints', () => {
  it('keeps endpoints disabled by default and exposes safe metrics when enabled', async () => {
    const disabled = await startTestGateway();
    gateway = disabled.gateway;
    const missing = await requestRaw({ address: disabled.address, path: '/v1/gateway/metrics' });
    expect(missing.status).toBe(404);
    await gateway.stop();

    const enabled = await startTestGateway({ observability: { expose_http_endpoints: true } });
    gateway = enabled.gateway;
    await requestJson({
      address: enabled.address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'mock-chat', messages: [{ role: 'user', content: 'hidden' }] },
    });
    const metrics = await requestJson({ address: enabled.address, path: '/v1/gateway/metrics' });
    const health = await requestJson({ address: enabled.address, path: '/v1/gateway/health/providers' });
    const traces = await requestJson({ address: enabled.address, path: '/v1/gateway/traces?limit=1' });

    expect(metrics.status).toBe(200);
    expect(metrics.json.requests_success).toBeGreaterThanOrEqual(1);
    expect(health.json.data[0].provider_id).toBe('mock');
    expect(traces.json.data).toHaveLength(1);
    expect(JSON.stringify(traces.json)).not.toContain('hidden');
  });

  it('inherits bearer authentication for observability endpoints', async () => {
    const started = await startTestGateway({ auth_mode: 'bearer-token', auth_token: 'test-token', observability: { expose_http_endpoints: true } });
    gateway = started.gateway;
    const missing = await requestRaw({ address: started.address, path: '/v1/gateway/metrics' });
    const valid = await requestJson({ address: started.address, path: '/v1/gateway/metrics', headers: { authorization: 'Bearer test-token' } });

    expect(missing.status).toBe(401);
    expect(valid.status).toBe(200);
    expect(JSON.stringify(valid.json)).not.toContain('test-token');
  });
});
