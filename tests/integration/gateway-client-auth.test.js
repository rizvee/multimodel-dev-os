import { request } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createGatewayServer, generateGatewayClientConfig } from '../../src/gateway/index.js';

let gateway;

function rawRequest(address, token = null) {
  return new Promise((resolve, reject) => {
    const req = request({
      host: '127.0.0.1',
      port: address.port,
      path: '/health',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end();
  });
}

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway client auth integration', () => {
  it('keeps token values out of plans while bearer auth works locally', async () => {
    const plan = generateGatewayClientConfig({
      clientId: 'generic-openai',
      auth: { mode: 'bearer-token', token_env: 'MMDO_GATEWAY_TOKEN' },
    });
    gateway = createGatewayServer({ config: { auth_mode: 'bearer-token', auth_token: 'test-token', port: 0 } });
    const address = await gateway.start();

    expect(plan.files[0].content).toContain('${MMDO_GATEWAY_TOKEN}');
    expect(plan.files[0].content).not.toContain('test-token');
    expect(await rawRequest(address)).toBe(401);
    expect(await rawRequest(address, 'bad-token')).toBe(401);
    expect(await rawRequest(address, 'test-token')).toBe(200);
  });
});
