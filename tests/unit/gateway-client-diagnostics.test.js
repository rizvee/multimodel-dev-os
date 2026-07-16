import { describe, expect, it } from 'vitest';
import { createGatewayClientDiagnostics } from '../../src/gateway/index.js';

describe('gateway client diagnostics', () => {
  it('redacts embedded endpoint credentials', () => {
    const diagnostics = createGatewayClientDiagnostics({
      client: { id: 'generic-openai' },
      endpoint: { base_url: 'http://token@example.invalid:8787/v1', auth_mode: 'bearer-token', token_env: 'MMDO_GATEWAY_TOKEN' },
      model: 'mock-chat',
      compatibility: { level: 'unsupported', warnings: [] },
      files: [{ relative_path: '.ai/gateway-clients/generic-openai.json' }],
    });

    expect(diagnostics.base_url).not.toContain('token@');
    expect(diagnostics.token_present).toBe(true);
  });
});
