import { request } from 'node:http';
import { createGatewayServer } from '../runtime/server.js';

function httpRequest({ address, method = 'GET', path = '/', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body === null ? null : Buffer.from(JSON.stringify(body));
    const req = request({
      host: '127.0.0.1',
      port: address.port,
      method,
      path,
      headers: {
        ...(payload ? { 'content-type': 'application/json', 'content-length': payload.length } : {}),
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export async function testGatewayClientPlan({ clientPlan, serverFactory = createGatewayServer } = {}) {
  const gateway = serverFactory({
    config: {
      host: '127.0.0.1',
      port: 0,
      request_id_factory: () => 'req-client-harness',
    },
  });
  const results = [];
  try {
    const address = await gateway.start();
    const health = await httpRequest({ address, path: '/health' });
    const models = await httpRequest({ address, path: '/v1/models' });
    const chat = await httpRequest({
      address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: clientPlan?.model || 'mock-chat', messages: [{ role: 'user', content: 'client harness' }] },
    });
    const stream = await httpRequest({
      address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'mock-stream', stream: true, messages: [{ role: 'user', content: 'client harness stream' }] },
    });
    results.push({ name: 'health', passed: health.status === 200 });
    results.push({ name: 'models', passed: models.status === 200 && models.body.includes('mock-chat') });
    results.push({ name: 'chat', passed: chat.status === 200 && chat.body.includes('mock') });
    results.push({ name: 'stream', passed: stream.status === 200 && stream.body.includes('[DONE]') });
  } finally {
    await gateway.stop();
  }
  return {
    mode: 'local-mock-validation',
    executed_external_client: false,
    external_provider_called: false,
    passed: results.every((result) => result.passed),
    results,
  };
}
