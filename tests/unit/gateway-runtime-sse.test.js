import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { writeSseStream } from '../../src/gateway/index.js';

function createFakeResponse() {
  const response = new EventEmitter();
  let payload = '';
  response.writableEnded = false;
  response.destroyed = false;
  response.headers = null;
  response.writeHead = (status, headers) => {
    response.status = status;
    response.headers = headers;
  };
  response.write = (chunk) => {
    payload += chunk;
    return true;
  };
  response.end = () => {
    response.writableEnded = true;
    response.emit('close');
  };
  response.payload = () => payload;
  return response;
}

describe('gateway runtime sse writer', () => {
  it('writes ordered chunks and done marker', async () => {
    const response = createFakeResponse();

    await writeSseStream(response, [{ one: 1 }, { two: 2 }], { request_id: 'req' }, { stream_idle_timeout_ms: 1000, stream_total_timeout_ms: 1000, mock_delay_ms: 0 });

    expect(response.headers['content-type']).toBe('text/event-stream; charset=utf-8');
    expect(response.payload()).toContain('data: {"one":1}');
    expect(response.payload()).toContain('data: [DONE]');
  });

  it('enforces stream idle timeout without writing after close', async () => {
    const response = createFakeResponse();

    await expect(writeSseStream(
      response,
      [{ one: 1 }, { two: 2 }],
      { request_id: 'req' },
      { stream_idle_timeout_ms: 5, stream_total_timeout_ms: 1000, mock_delay_ms: 25 },
    )).rejects.toThrow('Mock stream idle timeout');

    expect(response.writableEnded).toBe(true);
  });
});
