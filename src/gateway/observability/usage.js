function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function countText(value) {
  if (typeof value !== 'string') return 0;
  return value.length;
}

function countWhitespaceTokens(value) {
  if (typeof value !== 'string') return 0;
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function messageText(messages = []) {
  return Array.isArray(messages)
    ? messages.map((message) => (typeof message?.content === 'string' ? message.content : '')).join('\n')
    : '';
}

function normalizeToken(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

export function normalizeGatewayUsageRecord({
  usage = {},
  provider_id = null,
  model_id = null,
  request_id = null,
  trace_id = null,
  timestamp = null,
  metadata = {},
} = {}) {
  const input = normalizeToken(usage.input_tokens);
  const output = normalizeToken(usage.output_tokens);
  const total = normalizeToken(usage.total_tokens) ?? (input !== null && output !== null ? input + output : null);
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: total,
    cached_input_tokens: normalizeToken(usage.cached_input_tokens),
    reasoning_tokens: normalizeToken(usage.reasoning_tokens),
    provider_reported: usage.provider_reported === true,
    estimated: usage.estimated !== false,
    tokenizer: typeof usage.tokenizer === 'string' ? usage.tokenizer : null,
    model_id,
    provider_id,
    request_id,
    trace_id,
    timestamp,
    cost_estimate: usage.cost_estimate || null,
    metadata: isObject(metadata) ? { ...metadata } : {},
  };
}

export function estimateGatewayTokens({ messages = [], response = null, strategy = 'unavailable' } = {}) {
  if (strategy === 'provider-reported' && isObject(response?.usage)) {
    return normalizeGatewayUsageRecord({ usage: { ...response.usage, estimated: false, provider_reported: true } });
  }
  if (strategy === 'character-estimate') {
    const input = Math.ceil(messageText(messages).length / 4);
    const output = Math.ceil(countText(response) / 4);
    return normalizeGatewayUsageRecord({
      usage: { input_tokens: input, output_tokens: output, total_tokens: input + output, estimated: true, tokenizer: 'character-estimate' },
    });
  }
  if (strategy === 'whitespace-estimate') {
    const input = countWhitespaceTokens(messageText(messages));
    const output = countWhitespaceTokens(response);
    return normalizeGatewayUsageRecord({
      usage: { input_tokens: input, output_tokens: output, total_tokens: input + output, estimated: true, tokenizer: 'whitespace-estimate' },
    });
  }
  return normalizeGatewayUsageRecord({
    usage: { input_tokens: null, output_tokens: null, total_tokens: null, estimated: true, tokenizer: 'unavailable' },
  });
}
