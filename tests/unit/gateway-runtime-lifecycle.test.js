import { describe, expect, it } from 'vitest';
import { createGatewayServer } from '../../src/gateway/index.js';

describe('gateway runtime lifecycle', () => {
  it('imports without starting and starts/stops cleanly', async () => {
    const gateway = createGatewayServer({ config: { request_id_factory: () => 'req-life' } });

    expect(gateway.state()).toBe('created');
    const address = await gateway.start();
    expect(address.port).toBeGreaterThan(0);
    expect(gateway.state()).toBe('running');
    await expect(gateway.start()).rejects.toThrow();
    await expect(gateway.stop()).resolves.toEqual({ stopped: true });
    await expect(gateway.stop()).resolves.toEqual({ stopped: true });
    expect(gateway.state()).toBe('stopped');
  });

  it('rejects unsafe bind before listen', async () => {
    const gateway = createGatewayServer({ config: { host: '0.0.0.0', port: 0 } });

    await expect(gateway.start()).rejects.toThrow();
    expect(gateway.state()).toBe('failed');
  });
});
