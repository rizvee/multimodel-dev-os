import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { writeJson } from '../../src/gateway/index.js';

describe('gateway runtime response writer', () => {
  it('writes stable JSON headers and request IDs', () => {
    const response = new PassThrough();
    response.headers = null;
    response.status = null;
    response.writeHead = (status, headers) => {
      response.status = status;
      response.headers = headers;
    };
    response.end = (payload) => {
      response.payload = payload;
      PassThrough.prototype.end.call(response);
    };

    writeJson(response, 200, { ok: true }, { request_id: 'req' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(response.headers['x-request-id']).toBe('req');
    expect(JSON.parse(response.payload).ok).toBe(true);
  });
});
