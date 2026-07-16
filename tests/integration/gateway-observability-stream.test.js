import { afterEach, describe, expect, it } from 'vitest';
import { createGatewayObservabilityCollector } from '../../src/gateway/index.js';
import { requestSse, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway observability stream integration', () => {
  it('records stream metadata without chunk content', async () => {
    const collector = createGatewayObservabilityCollector();
    const started = await startTestGateway({}, { observability: collector });
    gateway = started.gateway;
    const response = await requestSse({
      address: started.address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'mock-stream', stream: true, messages: [{ role: 'user', content: 'stream secret' }] },
    });

    expect(response.status).toBe(200);
    expect(collector.getTraces()[0].streamed).toBe(true);
    expect(collector.getEvents({ type: 'stream-chunk' })).toHaveLength(2);
    expect(JSON.stringify(collector.snapshot())).not.toContain('stream secret');
    expect(JSON.stringify(collector.snapshot())).not.toContain('mock response');
  });
});
