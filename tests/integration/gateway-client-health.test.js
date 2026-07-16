import { describe, expect, it } from 'vitest';
import { generateGatewayClientConfig, testGatewayClientPlan } from '../../src/gateway/index.js';

describe('gateway client health integration', () => {
  it('validates generated generic plan against local mock health', async () => {
    const plan = generateGatewayClientConfig({ clientId: 'generic-openai' });
    const result = await testGatewayClientPlan({ clientPlan: plan });

    expect(result.executed_external_client).toBe(false);
    expect(result.external_provider_called).toBe(false);
    expect(result.results.find((entry) => entry.name === 'health').passed).toBe(true);
  });
});
