import { createChatCompletionResponse, createUsage } from '../../protocol/normalize.js';

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

  const primaryChoice = upstreamResponse.choices[0];
  if (!primaryChoice || typeof primaryChoice !== 'object' || !primaryChoice.message) {
    return {
      success: false,
      errors: [
        {
          code: 'upstream_protocol_error',
          path: 'choices[0].message',
          message: 'upstream primary choice must contain a message object',
        },
      ],
    };
  }

  const rawMessage = primaryChoice.message;
  const message = {
    role: typeof rawMessage.role === 'string' ? rawMessage.role : 'assistant',
    content: rawMessage.content ?? null,
  };

  if (Array.isArray(rawMessage.tool_calls) && rawMessage.tool_calls.length > 0) {
    message.tool_calls = rawMessage.tool_calls.map((tc) => ({
      id: tc.id,
      type: tc.type || 'function',
      function: {
        name: tc.function?.name,
        arguments: tc.function?.arguments,
      },
    }));
  }

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

  const finish_reason = typeof primaryChoice.finish_reason === 'string' ? primaryChoice.finish_reason : 'stop';
  const id = typeof upstreamResponse.id === 'string' ? upstreamResponse.id : 'chatcmpl-unknown';
  const created = typeof upstreamResponse.created === 'number' ? upstreamResponse.created : Math.floor(Date.now() / 1000);
  const model_id = typeof upstreamResponse.model === 'string' ? upstreamResponse.model : (context.model_id || 'unknown');

  const gatewayResponse = createChatCompletionResponse({
    id,
    request_id: context.request_id || null,
    provider_id: context.provider_id || null,
    model_id,
    message,
    usage,
    finish_reason,
    created,
  });

  if (upstreamResponse.choices.length > 1) {
    gatewayResponse.choices = upstreamResponse.choices.map((ch, idx) => ({
      index: typeof ch.index === 'number' ? ch.index : idx,
      message: {
        role: typeof ch.message?.role === 'string' ? ch.message.role : 'assistant',
        content: ch.message?.content ?? null,
        ...(Array.isArray(ch.message?.tool_calls)
          ? {
              tool_calls: ch.message.tool_calls.map((tc) => ({
                id: tc.id,
                type: tc.type || 'function',
                function: { name: tc.function?.name, arguments: tc.function?.arguments },
              })),
            }
          : {}),
      },
      finish_reason: typeof ch.finish_reason === 'string' ? ch.finish_reason : 'stop',
    }));
  }

  return {
    success: true,
    gateway_response: gatewayResponse,
  };
}
