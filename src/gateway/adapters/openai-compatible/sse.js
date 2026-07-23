import { createChatCompletionChunk, createUsage } from '../../protocol/normalize.js';
import { normalizeOpenAIError } from './error.js';

export function createOpenAISSEParser(options = {}) {
  const maxBufferSize = options.max_buffer_size || 1048576; // 1MB
  const maxEventSize = options.max_event_size || 524288;   // 512KB
  const context = options.context || {};

  let buffer = '';
  let eventLines = [];

  function reset() {
    buffer = '';
    eventLines = [];
  }

  function parseEventData(dataString) {
    const trimmed = dataString.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed === '[DONE]') {
      return [{ type: 'done' }];
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      const errorObj = normalizeOpenAIError('Malformed SSE JSON payload', {
        ...context,
        code: 'stream_error',
      });
      return [{ type: 'error', error: errorObj }];
    }

    if (!parsed || typeof parsed !== 'object') {
      return [];
    }

    const events = [];

    if (Array.isArray(parsed.choices) && parsed.choices.length > 0) {
      const primaryChoice = parsed.choices[0];
      const delta = primaryChoice?.delta || {};
      const finish_reason = primaryChoice?.finish_reason ?? null;

      const normalizedDelta = {
        role: typeof delta.role === 'string' ? delta.role : undefined,
        content: delta.content ?? undefined,
      };

      if (Array.isArray(delta.tool_calls) && delta.tool_calls.length > 0) {
        normalizedDelta.tool_calls = delta.tool_calls.map((tc) => ({
          index: typeof tc.index === 'number' ? tc.index : undefined,
          id: tc.id || undefined,
          type: tc.type || 'function',
          function: {
            name: tc.function?.name || undefined,
            arguments: tc.function?.arguments || undefined,
          },
        }));
      }

      const chunk = createChatCompletionChunk({
        id: typeof parsed.id === 'string' ? parsed.id : 'chatcmpl-stream',
        request_id: context.request_id || null,
        provider_id: context.provider_id || null,
        model_id: typeof parsed.model === 'string' ? parsed.model : (context.model_id || 'unknown'),
        delta: normalizedDelta,
        finish_reason,
        created: typeof parsed.created === 'number' ? parsed.created : Math.floor(Date.now() / 1000),
      });

      if (parsed.choices.length > 1) {
        chunk.choices = parsed.choices.map((ch, idx) => ({
          index: typeof ch.index === 'number' ? ch.index : idx,
          delta: ch.delta || {},
          finish_reason: ch.finish_reason ?? null,
        }));
      }

      events.push({ type: 'chunk', data: chunk });
    }

    if (parsed.usage && typeof parsed.usage === 'object') {
      const rawUsage = parsed.usage;
      const usageObj = createUsage({
        input_tokens: Number.isInteger(rawUsage.prompt_tokens) ? rawUsage.prompt_tokens : null,
        output_tokens: Number.isInteger(rawUsage.completion_tokens) ? rawUsage.completion_tokens : null,
        total_tokens: Number.isInteger(rawUsage.total_tokens) ? rawUsage.total_tokens : null,
        provider_reported: true,
        estimated: false,
      });
      events.push({ type: 'usage', data: usageObj });
    }

    return events;
  }

  function processEventLines() {
    if (eventLines.length === 0) {
      return [];
    }

    let dataContent = '';
    for (const line of eventLines) {
      if (line.startsWith('data:')) {
        let content = line.slice(5);
        if (content.startsWith(' ')) {
          content = content.slice(1);
        }
        dataContent += content;
      }
    }
    eventLines = [];

    if (dataContent.length > maxEventSize) {
      const errorObj = normalizeOpenAIError('Oversized SSE event payload', {
        ...context,
        code: 'stream_error',
      });
      return [{ type: 'error', error: errorObj }];
    }

    return parseEventData(dataContent);
  }

  function feed(chunkInput) {
    if (!chunkInput) {
      return [];
    }

    const chunkStr = typeof chunkInput === 'string' ? chunkInput : chunkInput.toString('utf8');
    buffer += chunkStr;

    if (buffer.length > maxBufferSize) {
      reset();
      const errorObj = normalizeOpenAIError('SSE buffer capacity exceeded limit', {
        ...context,
        code: 'stream_error',
      });
      return [{ type: 'error', error: errorObj }];
    }

    const events = [];
    let lineStart = 0;

    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === '\n') {
        let lineEnd = i;
        if (lineEnd > lineStart && buffer[lineEnd - 1] === '\r') {
          lineEnd--;
        }
        const line = buffer.slice(lineStart, lineEnd);
        lineStart = i + 1;

        if (line.length === 0) {
          const emitted = processEventLines();
          events.push(...emitted);
        } else if (line.startsWith(':')) {
          // Ignore SSE comment line
        } else {
          eventLines.push(line);
        }
      }
    }

    buffer = buffer.slice(lineStart);
    return events;
  }

  function flush() {
    const events = [];
    if (buffer.length > 0) {
      let line = buffer;
      if (line.endsWith('\r')) {
        line = line.slice(0, -1);
      }
      if (line.length > 0 && !line.startsWith(':')) {
        eventLines.push(line);
      }
      buffer = '';
    }

    if (eventLines.length > 0) {
      const emitted = processEventLines();
      events.push(...emitted);
    }

    reset();
    return events;
  }

  return {
    feed,
    flush,
    reset,
  };
}
