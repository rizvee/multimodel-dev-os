import { describe, expect, it } from 'vitest';
import { DEFAULT_GATEWAY_RUNTIME_CONFIG, normalizeGatewayRuntimeConfig, validateGatewayRuntimeConfig } from '../../src/gateway/index.js';

describe('gateway runtime config', () => {
  it('defaults to loopback and ephemeral test port', () => {
    const config = normalizeGatewayRuntimeConfig();

    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(0);
    expect(config.auth_mode).toBe('none-localhost-only');
    expect(DEFAULT_GATEWAY_RUNTIME_CONFIG.fallback_enabled).toBe(false);
  });

  it('rejects unsafe bind by default and remote binding without auth', () => {
    expect(validateGatewayRuntimeConfig({ host: '0.0.0.0' }).success).toBe(false);
    expect(validateGatewayRuntimeConfig({ host: '192.168.1.5', allow_remote_binding: true, auth_mode: 'none-localhost-only' }).success).toBe(false);
  });

  it('allows explicit bearer-token remote configuration only with token', () => {
    expect(validateGatewayRuntimeConfig({ host: '192.168.1.5', allow_remote_binding: true, auth_mode: 'bearer-token' }).success).toBe(false);
    expect(validateGatewayRuntimeConfig({ host: '192.168.1.5', allow_remote_binding: true, auth_mode: 'bearer-token', auth_token: 'test-token' }).success).toBe(true);
  });
});
