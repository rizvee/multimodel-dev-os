import { afterEach, describe, expect, it } from 'vitest';
import { requestRaw, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway runtime models integration', () => {
  it('serves mock-only model list', async () => {
    const started = await startTestGateway();
    gateway = started.gateway;
    const response = await requestRaw({ address: started.address, path: '/v1/models' });
    const body = JSON.parse(response.body);

    expect(response.status).toBe(200);
    expect(body.object).toBe('list');
    expect(body.data.map((model) => model.id)).toEqual(['mock-chat', 'mock-tools', 'mock-stream']);
    expect(JSON.stringify(body)).not.toContain('API_KEY');
  });
});
