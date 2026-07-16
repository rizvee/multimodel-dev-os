import { describe, expect, it } from 'vitest';
import { requestRaw, startTestGateway } from '../fixtures/gateway-runtime/client.js';

describe('gateway runtime shutdown integration', () => {
  it('stops cleanly after serving local requests', async () => {
    const { gateway, address } = await startTestGateway();
    const response = await requestRaw({ address, path: '/health' });

    expect(response.status).toBe(200);
    await expect(gateway.stop()).resolves.toEqual({ stopped: true });
    expect(gateway.state()).toBe('stopped');
  });
});
