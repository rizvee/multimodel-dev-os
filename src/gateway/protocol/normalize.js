import { GATEWAY_PROTOCOL_VERSION } from './constants.js';
import { DEFAULT_GATEWAY_CONFIG } from '../contracts/config.js';
import { redactSensitiveValue } from './errors.js';

export function normalizeGatewayRequest(request) {
  return {
    model: request.model,
    messages: request.messages,
    stream: request.stream === true,
    temperature: request.temperature ?? null,
    top_p: request.top_p ?? null,
    max_tokens: request.max_tokens ?? null,
    stop: request.stop ?? null,
    tools: request.tools ?? null,
    tool_choice: request.tool_choice ?? null,
    user: request.user ?? null,
    extensions: {
      metadata: request.metadata ?? {},
    },
  };
}

export function createRedactedRequestDiagnostic(request, { includeMessageCount = true } = {}) {
  return {
    model: request && request.model ? request.model : null,
    stream: request && request.stream === true,
    message_count: includeMessageCount && Array.isArray(request?.messages) ? request.messages.length : null,
    roles: Array.isArray(request?.messages) ? request.messages.map((message) => message.role) : [],
    has_tools: Array.isArray(request?.tools) && request.tools.length > 0,
    user: request?.user || null,
    metadata: request?.metadata ? redactSensitiveValue(request.metadata) : {},
    redacted: true,
  };
}

export function createUsage(overrides = {}) {
  return {
    input_tokens: null,
    output_tokens: null,
    total_tokens: null,
    cached_input_tokens: null,
    reasoning_tokens: null,
    estimated: true,
    cost: null,
    currency: null,
    provider_reported: false,
    tokenizer: null,
    metadata: {},
    ...overrides,
  };
}

export function createGatewayConfig(overrides = {}) {
  const { auth, ...rest } = overrides;
  return {
    ...DEFAULT_GATEWAY_CONFIG,
    ...rest,
    auth: {
      ...DEFAULT_GATEWAY_CONFIG.auth,
      ...(auth || {}),
    },
  };
}

export function createChatCompletionResponse({
  id,
  request_id,
  provider_id,
  model_id,
  message,
  usage = createUsage(),
  routing = null,
  finish_reason = 'stop',
  created = Math.floor(Date.now() / 1000),
}) {
  return {
    id,
    object: 'chat.completion',
    created,
    gateway_version: GATEWAY_PROTOCOL_VERSION,
    request_id,
    provider_id,
    model: model_id,
    choices: [
      {
        index: 0,
        message,
        finish_reason,
      },
    ],
    usage,
    routing,
  };
}

export function createChatCompletionChunk({
  id,
  request_id,
  provider_id,
  model_id,
  delta,
  finish_reason = null,
  created = Math.floor(Date.now() / 1000),
}) {
  return {
    id,
    object: 'chat.completion.chunk',
    created,
    gateway_version: GATEWAY_PROTOCOL_VERSION,
    request_id,
    provider_id,
    model: model_id,
    choices: [
      {
        index: 0,
        delta,
        finish_reason,
      },
    ],
  };
}
