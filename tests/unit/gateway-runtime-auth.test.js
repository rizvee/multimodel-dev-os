import { describe, expect, it } from 'vitest';
import { authenticateRequest } from '../../src/gateway/index.js';

describe('gateway runtime auth', () => {
  it('accepts localhost-only requests from loopback', () => {
    const result = authenticateRequest({ headers: {} }, { request_id: 'req', remote_address: '127.0.0.1' }, { auth_mode: 'none-localhost-only' });

    expect(result.authenticated).toBe(true);
  });

  it('rejects spoofed non-loopback requests in localhost-only mode', () => {
    expect(() => authenticateRequest({ headers: { 'x-forwarded-for': '127.0.0.1' } }, { request_id: 'req', remote_address: '203.0.113.5' }, { auth_mode: 'none-localhost-only' })).toThrow();
  });

  it('requires and validates bearer tokens', () => {
    expect(() => authenticateRequest({ headers: {} }, { request_id: 'req', remote_address: '127.0.0.1' }, { auth_mode: 'bearer-token', auth_token: 'secret' })).toThrow();
    expect(() => authenticateRequest({ headers: { authorization: 'Bearer wrong' } }, { request_id: 'req', remote_address: '127.0.0.1' }, { auth_mode: 'bearer-token', auth_token: 'secret' })).toThrow();
    expect(authenticateRequest({ headers: { authorization: 'Bearer secret' } }, { request_id: 'req', remote_address: '127.0.0.1' }, { auth_mode: 'bearer-token', auth_token: 'secret' }).authenticated).toBe(true);
  });
});
