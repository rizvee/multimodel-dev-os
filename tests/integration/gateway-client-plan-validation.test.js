import { describe, expect, it } from 'vitest';
import { generateGatewayClientConfig, validateGatewayClientCompatibility, getGatewayClientProfile, normalizeGatewayEndpointConfig } from '../../src/gateway/index.js';

describe('gateway client plan validation integration', () => {
  it('rejects unknown mock models as non-executable', () => {
    const compatibility = validateGatewayClientCompatibility({
      client: getGatewayClientProfile('generic-openai'),
      endpoint: normalizeGatewayEndpointConfig(),
      model: 'external-model',
    });

    expect(compatibility.compatible).toBe(false);
    expect(compatibility.unsupported_features).toContain('model');
  });

  it('keeps generated plans preview-only', () => {
    const plan = generateGatewayClientConfig({ clientId: 'cursor' });

    expect(plan.mode).toBe('preview');
    expect(plan.writes_performed).toBe(false);
    expect(plan.files[0].action).toBe('preview');
  });
});
