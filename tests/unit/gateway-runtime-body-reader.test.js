import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { readJsonBody } from '../../src/gateway/index.js';

function request(body, headers = { 'content-type': 'application/json' }) {
  const stream = new PassThrough();
  stream.headers = headers;
  stream.setEncoding = PassThrough.prototype.setEncoding.bind(stream);
  queueMicrotask(() => {
    if (body !== null) stream.end(body);
  });
  return stream;
}

describe('gateway runtime body reader', () => {
  it('reads bounded JSON bodies', async () => {
    const body = await readJsonBody(request('{"ok":true}'), { request_id: 'req' }, { request_size_limit_bytes: 100, request_timeout_ms: 1000 });

    expect(body.ok).toBe(true);
  });

  it('rejects malformed, empty, oversized, and unsupported bodies', async () => {
    await expect(readJsonBody(request('{"'), { request_id: 'req' }, { request_size_limit_bytes: 100, request_timeout_ms: 1000 })).rejects.toThrow();
    await expect(readJsonBody(request(''), { request_id: 'req' }, { request_size_limit_bytes: 100, request_timeout_ms: 1000 })).rejects.toThrow();
    await expect(readJsonBody(request('{"too":"large"}'), { request_id: 'req' }, { request_size_limit_bytes: 2, request_timeout_ms: 1000 })).rejects.toThrow();
    await expect(readJsonBody(request('x', { 'content-type': 'text/plain' }), { request_id: 'req' }, { request_size_limit_bytes: 100, request_timeout_ms: 1000 })).rejects.toThrow();
  });

  it('rejects malformed content-length headers before reading', async () => {
    const config = { request_size_limit_bytes: 100, request_timeout_ms: 1000 };

    await expect(readJsonBody(request('{"ok":true}', { 'content-type': 'application/json', 'content-length': '-1' }), { request_id: 'req' }, config)).rejects.toThrow();
    await expect(readJsonBody(request('{"ok":true}', { 'content-type': 'application/json', 'content-length': '1.5' }), { request_id: 'req' }, config)).rejects.toThrow();
    await expect(readJsonBody(request('{"ok":true}', { 'content-type': 'application/json', 'content-length': '12x' }), { request_id: 'req' }, config)).rejects.toThrow();
  });
});
