import {
  createChatCompletionChunk,
  createChatCompletionResponse,
  createGatewayError,
  createUsage,
  normalizeGatewayRequest,
  validateGatewayRequest,
} from '../../../src/gateway/index.js';

export const mockProvider = {
  id: 'mock-provider',
  name: 'Mock Provider',
  type: 'mock',
  version: '1.0.0',
  capabilities: ['chat', 'streaming', 'tools', 'local'],
  credential_env: null,
  base_url: 'mock://local',
  models: [
    {
      id: 'mock-chat',
      name: 'Mock Chat',
      context_window: 4096,
      capabilities: ['chat', 'streaming'],
    },
  ],

  validateConfig(config = {}) {
    return {
      success: !config.fail,
      errors: config.fail ? ['mock config failure'] : [],
    };
  },

  listModels() {
    return this.models.map((model) => ({ ...model }));
  },

  normalizeRequest(request) {
    const result = validateGatewayRequest(request);
    if (!result.success) {
      return result;
    }
    return {
      success: true,
      value: normalizeGatewayRequest(request),
      errors: [],
    };
  },

  invoke(request, context = {}) {
    if (request.metadata?.mode === 'error') {
      return createGatewayError({
        code: 'provider_unavailable',
        message: 'Mock provider unavailable',
        provider: this.id,
        model: request.model,
        request_id: context.request_id || 'req-mock',
      });
    }
    return createChatCompletionResponse({
      id: 'chatcmpl-mock',
      request_id: context.request_id || 'req-mock',
      provider_id: this.id,
      model_id: request.model || 'mock-chat',
      message: {
        role: 'assistant',
        content: 'mock response',
      },
      usage: createUsage({
        input_tokens: 2,
        output_tokens: 2,
        total_tokens: 4,
      }),
      routing: {
        strategy: 'explicit',
      },
      created: 1800000000,
    });
  },

  normalizeResponse(response) {
    return {
      ...response,
      normalized: true,
    };
  },

  stream(request, context = {}) {
    return [
      createChatCompletionChunk({
        id: 'chatcmpl-mock',
        request_id: context.request_id || 'req-mock',
        provider_id: this.id,
        model_id: request.model || 'mock-chat',
        delta: {
          role: 'assistant',
          content: 'mock',
        },
        created: 1800000000,
      }),
      createChatCompletionChunk({
        id: 'chatcmpl-mock',
        request_id: context.request_id || 'req-mock',
        provider_id: this.id,
        model_id: request.model || 'mock-chat',
        delta: {
          content: ' response',
        },
        finish_reason: 'stop',
        created: 1800000000,
      }),
    ];
  },

  classifyError(error) {
    return createGatewayError({
      code: error?.code || 'upstream_error',
      message: error?.message || 'Mock provider error',
      provider: this.id,
      details: error?.details || {},
    });
  },

  health() {
    return {
      ok: true,
      provider: this.id,
      checked_at: 1800000000,
    };
  },

  redact(value) {
    if (typeof value === 'string') {
      return value.replace(/[A-Za-z0-9_-]{8,}/g, '[REDACTED]');
    }
    return '[REDACTED]';
  },
};
