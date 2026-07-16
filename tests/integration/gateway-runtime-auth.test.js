import { afterEach, describe, expect, it } from 'vitest';
import { requestRaw, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway runtime auth integration', () => {
  it('rejects missing and invalid bearer token and accepts valid token', async () => {
    const started = await startTestGateway({ auth_mode: 'bearer-token', auth_token: 'test-token' });
    gateway = started.gateway;
    const missing = await requestRaw({ address: started.address, path: '/health' });
    const invalid = await requestRaw({ address: started.address, path: '/health', headers: { authorization: 'Bearer wrong' } });
    const valid = await requestRaw({ address: started.address, path: '/health', headers: { authorization: 'Bearer test-token' } });

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(valid.status).toBe(200);
    expect(missing.body).not.toContain('test-token');
  });
});
