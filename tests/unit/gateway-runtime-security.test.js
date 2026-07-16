import { describe, expect, it } from 'vitest';
import { createRequestContext } from '../../src/gateway/index.js';

describe('gateway runtime security helpers', () => {
  it('does not include authorization values in request context', () => {
    const context = createRequestContext({
      method: 'GET',
      url: '/health',
      headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
      socket: { remoteAddress: '::ffff:127.0.0.1', localAddress: '127.0.0.1' },
    }, { requestIdFactory: () => 'req' });

    expect(context.request_id).toBe('req');
    expect(JSON.stringify(context)).not.toContain('secret');
    expect(context.remote_address).toBe('127.0.0.1');
  });
});
