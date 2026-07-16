import { afterEach, describe, expect, it } from 'vitest';
import { createGatewayObservabilityCollector } from '../../src/gateway/index.js';
import { requestJson, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway observability error integration', () => {
  it('records failed request traces without crashing runtime', async () => {
    const collector = createGatewayObservabilityCollector();
    const started = await startTestGateway({}, { observability: collector });
    gateway = started.gateway;
    const response = await requestJson({
      address: started.address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'missing-model', messages: [{ role: 'user', content: 'secret' }] },
    });

    expect(response.status).toBe(404);
    expect(collector.getTraces()[0].success).toBe(false);
    expect(collector.getEvents({ type: 'request-failed' })).toHaveLength(1);
    expect(JSON.stringify(collector.snapshot())).not.toContain('secret');
  });
});
