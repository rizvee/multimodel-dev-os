import { afterEach, describe, expect, it } from 'vitest';
import { requestSse, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway runtime stream integration', () => {
  it('serves ordered deterministic SSE chunks and done marker', async () => {
    const started = await startTestGateway();
    gateway = started.gateway;
    const response = await requestSse({
      address: started.address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'mock-stream', stream: true, messages: [{ role: 'user', content: 'stream' }] },
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/event-stream; charset=utf-8');
    expect(response.events.at(-1)).toBe('[DONE]');
    expect(JSON.parse(response.events[0]).choices[0].delta.content).toBe('mock');
    expect(JSON.parse(response.events[1]).choices[0].delta.content).toBe(' response');
  });
});
