import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  createGatewayConfig,
  DEFAULT_GATEWAY_CONFIG,
  validateGatewayConfig,
} from '../../src/gateway/index.js';

describe('gateway configuration contract', () => {
  it('validates safe local-only defaults', () => {
    const result = validateGatewayConfig(DEFAULT_GATEWAY_CONFIG);

    expect(result.success).toBe(true);
    expect(DEFAULT_GATEWAY_CONFIG.host).toBe('127.0.0.1');
    expect(DEFAULT_GATEWAY_CONFIG.redact_prompts).toBe(true);
  });

  it('preserves nested auth defaults when creating config overrides', () => {
    const config = createGatewayConfig({ port: 4242 });

    expect(config.auth.mode).toBe('local-only');
    expect(config.auth.required_for_remote).toBe(true);
    expect(config.port).toBe(4242);
  });

  it('fails unsafe remote binding without non-anonymous auth', () => {
    const config = createGatewayConfig({
      host: '0.0.0.0',
      allow_remote_binding: true,
      auth: {
        mode: 'none',
      },
    });
    const result = validateGatewayConfig(config);

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'policy_denied',
      path: 'auth.mode',
    }));
  });

  it('fails unsafe private provider host config', () => {
    const config = createGatewayConfig({
      allowed_provider_hosts: ['http://127.0.0.1:9999'],
    });
    const result = validateGatewayConfig(config);

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'policy_denied',
      path: 'allowed_provider_hosts[0]',
    }));
  });

  it('parses gateway schema files', () => {
    const schemaDir = join(process.cwd(), '.ai/schema');
    const schemaFiles = readdirSync(schemaDir).filter((file) => file.startsWith('gateway-') || [
      'provider-adapter.schema.json',
      'routing-request.schema.json',
      'route-decision.schema.json',
    ].includes(file));

    expect(schemaFiles.length).toBeGreaterThanOrEqual(8);
    for (const file of schemaFiles) {
      expect(() => JSON.parse(readFileSync(join(schemaDir, file), 'utf8'))).not.toThrow();
    }
  });
});
