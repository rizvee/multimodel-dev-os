import { describe, expect, it } from 'vitest';
import { normalizeGatewayEndpointConfig, validateGatewayEndpointConfig } from '../../src/gateway/index.js';

describe('gateway client endpoint config', () => {
  it('defaults to loopback OpenAI-compatible endpoint', () => {
    const endpoint = normalizeGatewayEndpointConfig();

    expect(endpoint.base_url).toBe('http://127.0.0.1:8787/v1');
    expect(endpoint.health_url).toBe('http://127.0.0.1:8787/health');
    expect(endpoint.executable_models).toContain('mock-chat');
  });

  it('rejects unsafe endpoints and embedded credentials', () => {
    expect(validateGatewayEndpointConfig({ base_url: 'http://192.168.1.5:8787/v1' }).success).toBe(false);
    const embedded = validateGatewayEndpointConfig({ base_url: 'http://token@example.invalid:8787/v1' });
    expect(embedded.success).toBe(false);
    expect(embedded.errors.map((error) => error.code)).toContain('embedded_credentials');
  });
});
