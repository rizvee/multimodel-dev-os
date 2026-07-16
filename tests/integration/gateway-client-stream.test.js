import { describe, expect, it } from 'vitest';
import { generateGatewayClientConfig, testGatewayClientPlan } from '../../src/gateway/index.js';

describe('gateway client stream integration', () => {
  it('validates generated stream plan against local mock stream', async () => {
    const plan = generateGatewayClientConfig({ clientId: 'generic-openai', model: 'mock-stream', options: { requested_features: { streaming: true } } });
    const result = await testGatewayClientPlan({ clientPlan: plan });

    expect(result.results.find((entry) => entry.name === 'stream').passed).toBe(true);
  });
});
