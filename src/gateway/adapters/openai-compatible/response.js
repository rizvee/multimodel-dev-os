import { createChatCompletionResponse, createUsage } from '../../protocol/normalize.js';

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

export function normalizeOpenAIResponse(upstreamResponse, context = {}) {
  if (!upstreamResponse || typeof upstreamResponse !== 'object') {
    return {
      success: false,
      errors: [
        {
          code: 'upstream_protocol_error',
          path: '$',
          message: 'upstream response must be a non-null object',
        },
      ],
    };
  }

  if (!Array.isArray(upstreamResponse.choices) || upstreamResponse.choices.length === 0) {
    return {
      success: false,
      errors: [
        {
          code: 'upstream_protocol_error',
          path: 'choices',
          message: 'upstream response choices must be a non-empty array',
        },
      ],
    };
  }

  for (let idx = 0; idx < upstreamResponse.choices.length; idx++) {
    const choice = upstreamResponse.choices[idx];
    if (!choice || typeof choice !== 'object' || !choice.message || typeof choice.message !== 'object') {
      return {
        success: false,
        errors: [
          {
            code: 'upstream_protocol_error',
            path: `choices[${idx}].message`,
            message: `upstream choice at index ${idx} must contain a valid message object`,
          },
        ],
      };
    }

    const rawMessage = choice.message;
    const hasToolCalls = Array.isArray(rawMessage.tool_calls) && rawMessage.tool_calls.length > 0;

    if (hasToolCalls && context.capability && typeof context.capability === 'object' && context.capability.tool_calls !== true) {
      return {
        success: false,
        errors: [
          {
            code: 'unsupported_capability',
            path: `choices[${idx}].message.tool_calls`,
            message: `tool calls present in choice at index ${idx} but provider capability tool_calls is false`,
          },
        ],
      };
    }
  }

  const normalizedChoices = upstreamResponse.choices.map((ch, idx) => {
    const rawMessage = ch.message;
    const role = typeof rawMessage.role === 'string' && ALLOWED_ROLES.includes(rawMessage.role)
      ? rawMessage.role
      : 'assistant';

    let content = null;
    if (typeof rawMessage.content === 'string') {
      content = rawMessage.content;
    } else if (rawMessage.content !== null && rawMessage.content !== undefined && typeof rawMessage.content === 'object') {
      content = deepCloneJSON(rawMessage.content);
    }

    const cleanMessage = {
      role,
      content,
    };

    if (Array.isArray(rawMessage.tool_calls) && rawMessage.tool_calls.length > 0) {
      cleanMessage.tool_calls = rawMessage.tool_calls.map((tc) => {
        const item = {
          id: typeof tc.id === 'string' ? tc.id : undefined,
          type: tc.type || 'function',
          function: {
            name: typeof tc.function?.name === 'string' ? tc.function.name : undefined,
          },
        };
        if (tc.function?.arguments !== undefined && tc.function?.arguments !== null) {
          item.function.arguments = deepCloneJSON(tc.function.arguments);
        }
        return item;
      });
    }

    let finish_reason = 'stop';
    if (typeof ch.finish_reason === 'string') {
      finish_reason = ALLOWED_FINISH_REASONS.includes(ch.finish_reason) ? ch.finish_reason : 'stop';
    } else if (ch.finish_reason === null) {
      finish_reason = null;
    }

    const index = typeof ch.index === 'number' && Number.isInteger(ch.index) ? ch.index : idx;

    return {
      index,
      message: cleanMessage,
      finish_reason,
    };
  });

  const primaryChoice = normalizedChoices[0];

  let usage = createUsage({ provider_reported: false });
  if (upstreamResponse.usage && typeof upstreamResponse.usage === 'object') {
    const rawUsage = upstreamResponse.usage;
    usage = createUsage({
      input_tokens: Number.isInteger(rawUsage.prompt_tokens) ? rawUsage.prompt_tokens : null,
      output_tokens: Number.isInteger(rawUsage.completion_tokens) ? rawUsage.completion_tokens : null,
      total_tokens: Number.isInteger(rawUsage.total_tokens) ? rawUsage.total_tokens : null,
      provider_reported: true,
      estimated: false,
    });
  }

  const id = typeof upstreamResponse.id === 'string' ? upstreamResponse.id : 'chatcmpl-unknown';
  const created = resolveTimestamp(upstreamResponse.created, context.created);
  const model_id = typeof upstreamResponse.model === 'string' ? upstreamResponse.model : (context.model_id || 'unknown');

  const gatewayResponse = createChatCompletionResponse({
    id,
    request_id: context.request_id || null,
    provider_id: context.provider_id || null,
    model_id,
    message: primaryChoice.message,
    usage,
    finish_reason: primaryChoice.finish_reason,
    created,
  });

  if (normalizedChoices.length > 1) {
    gatewayResponse.choices = normalizedChoices;
  }

  return {
    success: true,
    gateway_response: gatewayResponse,
  };
}
