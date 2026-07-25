import { createChatCompletionChunk, createUsage } from '../../protocol/normalize.js';
import { normalizeOpenAIError } from './error.js';

const ALLOWED_ROLES = ['system', 'user', 'assistant', 'tool', 'developer'];
const ALLOWED_FINISH_REASONS = ['stop', 'length', 'tool_calls', 'content_filter', 'error'];

function deepCloneJSON(val) {
  if (val === null || val === undefined || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => deepCloneJSON(item));
  }
  const copy = {};
  for (const key of Object.keys(val)) {
    const v = val[key];
    if (v !== undefined) {
      copy[key] = deepCloneJSON(v);
    }
  }
  return copy;
}

function resolveTimestamp(upstreamCreated, contextCreated) {
  if (typeof upstreamCreated === 'number' && Number.isFinite(upstreamCreated) && upstreamCreated > 0) {
    return Math.floor(upstreamCreated);
  }
  if (typeof contextCreated === 'number' && Number.isFinite(contextCreated) && contextCreated > 0) {
    return Math.floor(contextCreated);
  }
  return 0;
}

export function createOpenAISSEParser(options = {}) {
  const maxBufferSize = options.max_buffer_size ?? 1048576; // 1MB default
  const maxEventSize = options.max_event_size ?? 524288;   // 512KB default

  if (!Number.isInteger(maxBufferSize) || maxBufferSize <= 0 || maxBufferSize > 16777216) {
    throw new TypeError('max_buffer_size must be a positive integer <= 16MB');
  }
  if (!Number.isInteger(maxEventSize) || maxEventSize <= 0 || maxEventSize > 8388608) {
    throw new TypeError('max_event_size must be a positive integer <= 8MB');
  }

  const context = options.context || {};

  let decoder = new TextDecoder('utf-8', { fatal: false });
  let buffer = '';
  let eventLines = [];
  let eventByteCount = 0;
  let isDone = false;

  function reset() {
    decoder = new TextDecoder('utf-8', { fatal: false });
    buffer = '';
    eventLines = [];
    eventByteCount = 0;
    isDone = false;
  }

  function parseEventData(dataString) {
    const trimmed = dataString.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed === '[DONE]') {
      isDone = true;
      return [{ type: 'done' }];
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (_) {
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
      for (let idx = 0; idx < parsed.choices.length; idx++) {
        const ch = parsed.choices[idx];
        if (!ch || typeof ch !== 'object' || Array.isArray(ch)) {
          const errorObj = normalizeOpenAIError('Malformed choice object in SSE choices payload', {
            ...context,
            code: 'stream_error',
          });
          return [{ type: 'error', error: errorObj }];
        }
        const delta = ch.delta || {};
        if (Array.isArray(delta.tool_calls) && delta.tool_calls.length > 0) {
          if (context.capability && typeof context.capability === 'object' && context.capability.tool_calls !== true) {
            const errorObj = normalizeOpenAIError('tool calls present in stream delta but provider capability tool_calls is false', {
              ...context,
              code: 'unsupported_capability',
            });
            return [{ type: 'error', error: errorObj }];
          }
        }
      }

      const normalizedChoices = parsed.choices.map((ch, idx) => {
        const delta = ch.delta || {};
        const role = typeof delta.role === 'string' && ALLOWED_ROLES.includes(delta.role) ? delta.role : undefined;

        let content;
        if (typeof delta.content === 'string') {
          content = delta.content;
        } else if (delta.content !== null && delta.content !== undefined && typeof delta.content === 'object') {
          content = deepCloneJSON(delta.content);
        }

        const cleanDelta = {
          role,
          content,
        };

        if (Array.isArray(delta.tool_calls) && delta.tool_calls.length > 0) {
          cleanDelta.tool_calls = delta.tool_calls.map((tc) => ({
            index: typeof tc.index === 'number' && Number.isInteger(tc.index) ? tc.index : undefined,
            id: typeof tc.id === 'string' ? tc.id : undefined,
            type: tc.type || 'function',
            function: {
              name: typeof tc.function?.name === 'string' ? tc.function.name : undefined,
              arguments: tc.function?.arguments !== undefined ? deepCloneJSON(tc.function.arguments) : undefined,
            },
          }));
        }

        let finish_reason = null;
        if (typeof ch.finish_reason === 'string') {
          finish_reason = ALLOWED_FINISH_REASONS.includes(ch.finish_reason) ? ch.finish_reason : 'stop';
        }

        const index = typeof ch.index === 'number' && Number.isInteger(ch.index) ? ch.index : idx;

        return {
          index,
          delta: cleanDelta,
          finish_reason,
        };
      });

      const primaryChoice = normalizedChoices[0];
      const created = resolveTimestamp(parsed.created, context.created);

      const chunk = createChatCompletionChunk({
        id: typeof parsed.id === 'string' ? parsed.id : 'chatcmpl-stream',
        request_id: context.request_id || null,
        provider_id: context.provider_id || null,
        model_id: typeof parsed.model === 'string' ? parsed.model : (context.model_id || 'unknown'),
        delta: primaryChoice.delta,
        finish_reason: primaryChoice.finish_reason,
        created,
      });

      if (normalizedChoices.length > 1) {
        chunk.choices = normalizedChoices;
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
        dataContent += (dataContent.length > 0 ? '\n' : '') + content;
      }
    }
    eventLines = [];
    eventByteCount = 0;

    const dataByteLen = Buffer.byteLength(dataContent, 'utf-8');
    if (dataByteLen > maxEventSize) {
      reset();
      const errorObj = normalizeOpenAIError('Oversized SSE event payload', {
        ...context,
        code: 'stream_error',
      });
      return [{ type: 'error', error: errorObj }];
    }

    return parseEventData(dataContent);
  }

  function feed(chunkInput) {
    if (chunkInput === undefined || chunkInput === null) {
      return [];
    }

    let chunkStr = '';
    if (typeof chunkInput === 'string') {
      chunkStr = chunkInput;
    } else if (Buffer.isBuffer(chunkInput) || chunkInput instanceof Uint8Array) {
      chunkStr = decoder.decode(chunkInput, { stream: true });
    } else {
      const errorObj = normalizeOpenAIError('Invalid SSE chunk input type', {
        ...context,
        code: 'stream_error',
      });
      return [{ type: 'error', error: errorObj }];
    }

    if (!chunkStr) {
      return [];
    }

    if (isDone) {
      if (chunkStr.trim().length > 0) {
        const errorObj = normalizeOpenAIError('Received stream payload after terminal [DONE]', {
          ...context,
          code: 'stream_error',
        });
        return [{ type: 'error', error: errorObj }];
      }
      return [];
    }

    buffer += chunkStr;

    if (Buffer.byteLength(buffer, 'utf-8') > maxBufferSize) {
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
          if (isDone) {
            const trailingContent = buffer.slice(lineStart).trim();
            buffer = '';
            if (trailingContent.length > 0) {
              const errorObj = normalizeOpenAIError('Received trailing SSE payload after terminal [DONE]', {
                ...context,
                code: 'stream_error',
              });
              events.push({ type: 'error', error: errorObj });
            }
            return events;
          }
        } else if (line.startsWith(':')) {
          // Comment line ignored
        } else {
          const lineBytes = Buffer.byteLength(line, 'utf-8');
          eventByteCount += lineBytes;
          if (eventByteCount > maxEventSize) {
            reset();
            const errorObj = normalizeOpenAIError('Oversized SSE event payload', {
              ...context,
              code: 'stream_error',
            });
            return [{ type: 'error', error: errorObj }];
          }
          eventLines.push(line);
        }
      }
    }

    buffer = buffer.slice(lineStart);
    return events;
  }

  function flush() {
    if (isDone) {
      const trailingContent = buffer.trim() || (eventLines.length > 0 ? eventLines.join('') : '');
      reset();
      if (trailingContent.length > 0) {
        const errorObj = normalizeOpenAIError('Received trailing SSE payload after terminal [DONE]', {
          ...context,
          code: 'stream_error',
        });
        return [{ type: 'error', error: errorObj }];
      }
      return [];
    }

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
