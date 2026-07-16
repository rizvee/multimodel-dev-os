import { describe, expect, it } from 'vitest';
import { generateGatewayClientConfig } from '../../src/gateway/index.js';

describe('gateway client config generator', () => {
  it('creates deterministic preview-only plans', () => {
    const first = generateGatewayClientConfig({ clientId: 'generic-openai' });
    const second = generateGatewayClientConfig({ clientId: 'generic-openai' });

    expect(first).toEqual(second);
    expect(first.mode).toBe('preview');
    expect(first.writes_performed).toBe(false);
    expect(first.files[0].relative_path).toBe('.ai/gateway-clients/generic-openai.json');
    expect(first.files[0].contains_secrets).toBe(false);
  });

  it('uses placeholders and never raw bearer tokens', () => {
    const plan = generateGatewayClientConfig({
      clientId: 'generic-openai',
      auth: { mode: 'bearer-token', token_env: 'MMDO_GATEWAY_TOKEN' },
    });

    expect(plan.environment.variables.MMDO_GATEWAY_TOKEN).toBe('${MMDO_GATEWAY_TOKEN}');
    expect(plan.files[0].content).toContain('${MMDO_GATEWAY_TOKEN}');
    expect(plan.files[0].content).not.toContain('secret');
  });
});
