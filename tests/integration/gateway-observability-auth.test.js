import { afterEach, describe, expect, it } from 'vitest';
import { createGatewayObservabilityCollector } from '../../src/gateway/index.js';
import { requestRaw, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway observability auth integration', () => {
  it('redacts authorization failures', async () => {
    const collector = createGatewayObservabilityCollector();
    const started = await startTestGateway({ auth_mode: 'bearer-token', auth_token: 'test-token' }, { observability: collector });
    gateway = started.gateway;
    const response = await requestRaw({ address: started.address, path: '/health', headers: { authorization: 'Bearer wrong-token' } });

    expect(response.status).toBe(401);
    expect(collector.getEvents({ type: 'auth-failed' })).toHaveLength(1);
    expect(JSON.stringify(collector.snapshot())).not.toContain('wrong-token');
    expect(JSON.stringify(collector.snapshot())).not.toContain('test-token');
  });
});
