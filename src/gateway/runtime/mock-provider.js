import {
  createChatCompletionChunk,
  createChatCompletionResponse,
  createUsage,
} from '../protocol/normalize.js';
import { createGatewayError } from '../protocol/errors.js';
import { validateGatewayRequest } from '../protocol/validation.js';

export const MOCK_PROVIDER_ID = 'mock';

const MODELS = Object.freeze([
  { id: 'mock-chat', object: 'model', created: 1800000000, owned_by: 'mock', capabilities: ['chat'] },
  { id: 'mock-tools', object: 'model', created: 1800000000, owned_by: 'mock', capabilities: ['chat', 'tools'] },
  { id: 'mock-stream', object: 'model', created: 1800000000, owned_by: 'mock', capabilities: ['chat', 'streaming'] },
]);

function hasModel(id) {
  return MODELS.some((model) => model.id === id);
}

function modelSupports(model, capability) {
  return MODELS.find((entry) => entry.id === model)?.capabilities.includes(capability) === true;
}

export function createMockGatewayProvider({ delayMs = 0 } = {}) {
  return {
    id: MOCK_PROVIDER_ID,
    name: 'Mock Gateway Provider',
    type: 'mock',
    version: '1.0.0',
    capabilities: ['chat', 'streaming', 'tools', 'local'],
    credential_env: null,
    base_url: 'mock://local',

    listModels() {
      return MODELS.map((model) => ({ ...model }));
    },

    validateRequest(request) {
      const result = validateGatewayRequest(request);
      if (!result.success) return result;
      if (!hasModel(request.model)) {
        return {
          success: false,
          errors: [{ code: 'model_not_found', path: 'model', message: `Mock model not found: ${request.model}` }],
          warnings: [],
        };
      }
      if (request.stream === true && !modelSupports(request.model, 'streaming') && request.model !== 'mock-chat') {
        return {
          success: false,
          errors: [{ code: 'unsupported_capability', path: 'stream', message: `${request.model} does not support mock streaming` }],
          warnings: [],
        };
      }
      if (Array.isArray(request.tools) && request.tools.length > 0 && !modelSupports(request.model, 'tools')) {
        return {
          success: false,
          errors: [{ code: 'unsupported_capability', path: 'tools', message: `${request.model} does not support mock tools` }],
          warnings: [],
        };
      }
      return { success: true, errors: [], warnings: [], value: request };
    },

    invoke(request, context = {}) {
      if (request.metadata?.mode === 'error') {
        return createGatewayError({
          code: 'upstream_error',
          message: 'Mock provider failure requested by metadata',
          provider: MOCK_PROVIDER_ID,
          model: request.model,
          request_id: context.request_id,
          details: { mode: 'error' },
          cause: 'mock_error_mode',
        });
      }
      const toolMessage = Array.isArray(request.tools) && request.tools.length > 0
        ? { role: 'assistant', content: null, tool_calls: [{ id: 'call_mock_1', type: 'function', function: { name: 'mock_tool', arguments: '{}' } }] }
        : { role: 'assistant', content: 'mock response' };
      return createChatCompletionResponse({
        id: `chatcmpl-${context.request_id || 'mock'}`,
        request_id: context.request_id || 'req-mock',
        provider_id: MOCK_PROVIDER_ID,
        model_id: request.model,
        message: toolMessage,
        usage: createUsage({ input_tokens: 2, output_tokens: 2, total_tokens: 4 }),
        routing: {
          selected_provider: MOCK_PROVIDER_ID,
          selected_model: request.model,
          planning_only: false,
          fallback_executed: false,
        },
        created: 1800000000,
      });
    },

    stream(request, context = {}) {
      return [
        createChatCompletionChunk({
          id: `chatcmpl-${context.request_id || 'mock'}`,
          request_id: context.request_id || 'req-mock',
          provider_id: MOCK_PROVIDER_ID,
          model_id: request.model,
          delta: { role: 'assistant', content: 'mock' },
          created: 1800000000,
        }),
        createChatCompletionChunk({
          id: `chatcmpl-${context.request_id || 'mock'}`,
          request_id: context.request_id || 'req-mock',
          provider_id: MOCK_PROVIDER_ID,
          model_id: request.model,
          delta: { content: ' response' },
          finish_reason: 'stop',
          created: 1800000000,
        }),
      ];
    },

    health() {
      return { ok: true, provider: MOCK_PROVIDER_ID, checked_at: 1800000000 };
    },

    delayMs,
  };
}
