import { describe, expect, it } from 'vitest';
import {
  getGatewayClientProfile,
  normalizeGatewayEndpointConfig,
  validateGatewayClientCompatibility,
} from '../../src/gateway/index.js';

describe('gateway client compatibility validation', () => {
  it('marks generic clients as locally validated against mock models', () => {
    const result = validateGatewayClientCompatibility({
      client: getGatewayClientProfile('generic-openai'),
      endpoint: normalizeGatewayEndpointConfig(),
      model: 'mock-chat',
    });

    expect(result.compatible).toBe(true);
    expect(result.level).toBe('validated-local');
  });

  it('reports unsupported features without executing clients', () => {
    const result = validateGatewayClientCompatibility({
      client: getGatewayClientProfile('aider'),
      endpoint: normalizeGatewayEndpointConfig(),
      model: 'mock-tools',
      requestedFeatures: { tools: true },
    });

    expect(result.compatible).toBe(false);
    expect(result.unsupported_features).toContain('tools');
  });
});
