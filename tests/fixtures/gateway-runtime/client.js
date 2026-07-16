import { request } from 'node:http';
import { createGatewayServer } from '../../../src/gateway/index.js';

export async function startTestGateway(config = {}, options = {}) {
  const gateway = createGatewayServer({
    config: {
      host: '127.0.0.1',
      port: 0,
      request_id_factory: () => 'req-test',
      ...config,
    },
    observability: options.observability || null,
  });
  const address = await gateway.start();
  return { gateway, address };
}

export function requestRaw({ address, method = 'GET', path = '/', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body === null ? null : Buffer.from(body);
    const req = request({
      host: '127.0.0.1',
      port: address.port,
      method,
      path,
      headers: {
        ...(payload ? { 'content-length': payload.length } : {}),
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export async function requestJson(options) {
  const response = await requestRaw({
    ...options,
    body: options.body === undefined ? null : JSON.stringify(options.body),
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return {
    ...response,
    json: response.body ? JSON.parse(response.body) : null,
  };
}

export async function requestSse(options) {
  const response = await requestRaw({
    ...options,
    body: JSON.stringify(options.body),
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const events = response.body
    .split('\n\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^data:\s*/, ''));
  return { ...response, events };
}
