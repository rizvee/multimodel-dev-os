import { afterEach, describe, expect, it } from 'vitest';
import { requestJson, requestRaw, startTestGateway } from '../fixtures/gateway-runtime/client.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway runtime errors integration', () => {
  it('normalizes malformed, empty, unsupported, and oversized bodies', async () => {
    const started = await startTestGateway({ request_size_limit_bytes: 32 });
    gateway = started.gateway;
    const malformed = await requestRaw({ address: started.address, method: 'POST', path: '/v1/chat/completions', body: '{"', headers: { 'content-type': 'application/json' } });
    const empty = await requestRaw({ address: started.address, method: 'POST', path: '/v1/chat/completions', body: '', headers: { 'content-type': 'application/json' } });
    const unsupported = await requestRaw({ address: started.address, method: 'POST', path: '/v1/chat/completions', body: 'x', headers: { 'content-type': 'text/plain' } });
    const oversized = await requestRaw({ address: started.address, method: 'POST', path: '/v1/chat/completions', body: JSON.stringify({ model: 'mock-chat', messages: [{ role: 'user', content: 'this is too large for the limit' }] }), headers: { 'content-type': 'application/json' } });

    expect(malformed.status).toBe(400);
    expect(empty.status).toBe(400);
    expect(unsupported.status).toBe(415);
    expect(oversized.status).toBe(413);
  });

  it('normalizes wrong method, unknown route, unknown model, and mock provider error', async () => {
    const started = await startTestGateway();
    gateway = started.gateway;
    const wrongMethod = await requestRaw({ address: started.address, method: 'GET', path: '/v1/chat/completions' });
    const unknownRoute = await requestRaw({ address: started.address, method: 'GET', path: '/missing' });
    const unknownModel = await requestJson({ address: started.address, method: 'POST', path: '/v1/chat/completions', body: { model: 'external-model', messages: [{ role: 'user', content: 'x' }] } });
    const mockError = await requestJson({ address: started.address, method: 'POST', path: '/v1/chat/completions', body: { model: 'mock-chat', messages: [{ role: 'user', content: 'x' }], metadata: { mode: 'error' } } });

    expect(wrongMethod.status).toBe(405);
    expect(unknownRoute.status).toBe(404);
    expect(unknownModel.status).toBe(404);
    expect(mockError.status).toBe(502);
    expect(JSON.stringify(mockError.json)).not.toContain('content');
  });
});
