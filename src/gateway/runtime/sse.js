import { createRuntimeError } from './errors.js';
import { createRuntimeTimer, clearRuntimeTimer } from './timeouts.js';

function writeEvent(response, chunk) {
  if (response.writableEnded || response.destroyed) return false;
  response.write(`data: ${JSON.stringify(chunk)}\n\n`);
  return true;
}

export function writeSseStream(response, chunks, context, config, observer = {}) {
  return new Promise((resolve, reject) => {
    let closed = false;
    let idleTimer = null;
    let totalTimer = null;
    let delayTimer = null;

    function cleanup() {
      closed = true;
      clearRuntimeTimer(idleTimer);
      clearRuntimeTimer(totalTimer);
      clearRuntimeTimer(delayTimer);
    }

    function fail(code, message, cause) {
      cleanup();
      if (!response.writableEnded && !response.destroyed) response.end();
      reject(createRuntimeError({ code, message, request_id: context.request_id, cause }));
    }

    response.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'x-request-id': context.request_id,
    });
    observer.onStart?.();

    response.on('close', () => {
      if (closed) return;
      cleanup();
      resolve({ disconnected: true });
    });

    totalTimer = createRuntimeTimer(() => fail('timeout', 'Mock stream timed out', 'stream_total_timeout'), config.stream_total_timeout_ms);

    let index = 0;
    const delay = Math.max(0, config.mock_delay_ms || 0);

    function writeNext() {
      if (closed) return;
      clearRuntimeTimer(idleTimer);
      idleTimer = createRuntimeTimer(() => fail('timeout', 'Mock stream idle timeout', 'stream_idle_timeout'), config.stream_idle_timeout_ms);
      if (index >= chunks.length) {
        if (!response.writableEnded && !response.destroyed) response.write('data: [DONE]\n\n');
        cleanup();
        observer.onComplete?.({ chunk_count: chunks.length, disconnected: false });
        if (!response.writableEnded && !response.destroyed) response.end();
        resolve({ disconnected: false });
        return;
      }
      const ok = writeEvent(response, chunks[index]);
      observer.onChunk?.(chunks[index], index);
      index += 1;
      if (!ok) {
        cleanup();
        resolve({ disconnected: true });
        return;
      }
      if (delay > 0) {
        delayTimer = createRuntimeTimer(writeNext, delay);
      } else {
        queueMicrotask(writeNext);
      }
    }

    writeNext();
  });
}
