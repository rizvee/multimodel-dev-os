import { afterEach, describe, expect, it } from 'vitest';
import { createGatewayObservabilityCollector } from '../../src/gateway/index.js';
import { requestJson, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway observability runtime integration', () => {
  it('records successful request traces, usage, metrics, and provider health without content', async () => {
    const collector = createGatewayObservabilityCollector();
    const started = await startTestGateway({}, { observability: collector });
    gateway = started.gateway;
    const response = await requestJson({
      address: started.address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'mock-chat', messages: [{ role: 'user', content: 'private prompt' }] },
    });

    expect(response.status).toBe(200);
    expect(collector.getTraces()).toHaveLength(1);
    expect(collector.getUsage()[0].total_tokens).toBe(4);
    expect(collector.getMetrics().requests_success).toBe(1);
    expect(collector.getHealth().mock.status).toBe('healthy');
    expect(JSON.stringify(collector.snapshot())).not.toContain('private prompt');
  });
});
