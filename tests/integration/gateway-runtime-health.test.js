import { afterEach, describe, expect, it } from 'vitest';
import { requestRaw, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway runtime health integration', () => {
  it('serves health on loopback ephemeral port', async () => {
    const started = await startTestGateway();
    gateway = started.gateway;
    const response = await requestRaw({ address: started.address, path: '/health' });
    const body = JSON.parse(response.body);

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-test');
    expect(body.status).toBe('ok');
    expect(body.runtime).toBe('mock-local');
    expect(body.provider).toBe('mock');
  });
});
