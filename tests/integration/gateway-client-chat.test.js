import { describe, expect, it } from 'vitest';
import { generateGatewayClientConfig, testGatewayClientPlan } from '../../src/gateway/index.js';

describe('gateway client chat integration', () => {
  it('validates generated chat plan against local mock chat', async () => {
    const plan = generateGatewayClientConfig({ clientId: 'node-client', model: 'mock-chat' });
    const result = await testGatewayClientPlan({ clientPlan: plan });

    expect(result.passed).toBe(true);
    expect(result.results.find((entry) => entry.name === 'chat').passed).toBe(true);
  });
});
