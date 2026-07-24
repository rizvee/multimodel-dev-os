import { describe, test, expect } from 'vitest';
import {
  evaluateExecutionGate,
  validateTransport,
  executeGovernedRequest,
  resolveEnvironmentCredential,
  createExecutionRequest,
  createExecutionPolicy,
  createProviderEndpoint,
  createProviderExecutionCapability,
  createCredentialRef,
  validateExecutionResult,
  validateExecutionError,
  validateEndpointBinding,
  EXECUTION_CONTRACT_VERSION,
} from '../../src/gateway/index.js';

describe('Gateway Governed Execution & Gate (Sprint D Hardened)', () => {
  const validAdapter = {
    id: 'openai',
    name: 'OpenAI Provider',
    type: 'openai-compatible',
    version: '1.0.0',
    capabilities: ['chat', 'streaming', 'tools'],
    credential_env: 'OPENAI_API_KEY',
    base_url: 'https://api.openai.com/v1',
    models: ['gpt-4o'],
    validateConfig: () => ({ success: true }),
    listModels: () => [],
    normalizeRequest: () => ({ success: true }),
    invoke: () => ({ success: true }),
    normalizeResponse: () => ({ success: true }),
    stream: () => ({ success: true }),
    classifyError: () => ({ success: true }),
    health: () => ({ success: true }),
    redact: (v) => v,
  };

  const validPolicy = createExecutionPolicy({
    enabled: true,
    allowed_provider_ids: ['openai'],
    require_https: true,
    allow_private_networks: false,
    follow_redirects: false,
    max_attempts: 1,
    request_timeout_ms: 30000,
    response_timeout_ms: 30000,
    max_request_bytes: 1048576,
    max_response_bytes: 5242880,
    retry_enabled: false,
    fallback_enabled: false,
  });

  const validEndpoint = createProviderEndpoint({
    url: 'https://api.openai.com/v1/chat/completions',
    protocol: 'https',
    follow_redirects: false,
    ssrf_check_required: true,
  });

  const validCapability = createProviderExecutionCapability({
    chat_completions: true,
    non_streaming: true,
    sse_streaming: true,
    tool_calls: true,
  });

  const validReq = createExecutionRequest({
    request_id: 'req-exec-test-1',
    provider_id: 'openai',
    model_id: 'gpt-4o',
    gateway_request: {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
    },
    policy: validPolicy,
    endpoint: validEndpoint,
    capability: validCapability,
    credential_ref: createCredentialRef({ env_var: 'OPENAI_API_KEY' }),
  });

  describe('Trusted Endpoint Binding Safety', () => {
    test('accepts exact base_url or true path-segment descendant', () => {
      expect(validateEndpointBinding({ endpoint: { url: 'https://api.openai.com/v1/chat/completions' }, base_url: 'https://api.openai.com/v1' }).success).toBe(true);
      expect(validateEndpointBinding({ endpoint: { url: 'https://api.openai.com/v1' }, base_url: 'https://api.openai.com/v1' }).success).toBe(true);
    });

    test('rejects origin mismatch', () => {
      const res = validateEndpointBinding({ endpoint: { url: 'https://evil.openai.com/v1/chat/completions' }, base_url: 'https://api.openai.com/v1' });
      expect(res.success).toBe(false);
      expect(res.code).toBe('endpoint_forbidden');
    });

    test('rejects port mismatch', () => {
      const res = validateEndpointBinding({ endpoint: { url: 'https://api.openai.com:8443/v1/chat/completions' }, base_url: 'https://api.openai.com/v1' });
      expect(res.success).toBe(false);
      expect(res.code).toBe('endpoint_forbidden');
    });

    test('rejects URL with embedded userinfo', () => {
      const res = validateEndpointBinding({ endpoint: { url: 'https://user:pass@api.openai.com/v1/chat/completions' }, base_url: 'https://api.openai.com/v1' });
      expect(res.success).toBe(false);
      expect(res.code).toBe('endpoint_forbidden');
    });

    test('rejects path-prefix tricks (e.g. /v10 matching /v1)', () => {
      const res = validateEndpointBinding({ endpoint: { url: 'https://api.openai.com/v10/chat' }, base_url: 'https://api.openai.com/v1' });
      expect(res.success).toBe(false);
      expect(res.code).toBe('endpoint_forbidden');
    });

    test('rejects encoded path traversal (%2e, /..)', () => {
      const res1 = validateEndpointBinding({ endpoint: { url: 'https://api.openai.com/v1/..%2fadmin' }, base_url: 'https://api.openai.com/v1' });
      expect(res1.success).toBe(false);

      const res2 = validateEndpointBinding({ endpoint: { url: 'https://api.openai.com/v1/../secret' }, base_url: 'https://api.openai.com/v1' });
      expect(res2.success).toBe(false);
    });
  });

  describe('Execution Gate Preflight & Capabilities', () => {
    test('denies execution when policy is disabled by default', () => {
      const disabledPolicy = createExecutionPolicy({ enabled: false });
      const gate = evaluateExecutionGate({
        policy: disabledPolicy,
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: validReq,
        endpoint: validEndpoint,
        capability: validCapability,
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('execution_disabled');
    });

    test('denies unsupported adapter type (e.g. native, mock)', () => {
      const gate = evaluateExecutionGate({
        policy: validPolicy,
        provider_id: 'openai',
        provider_adapter: { ...validAdapter, type: 'native' },
        request: validReq,
        endpoint: validEndpoint,
        capability: validCapability,
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('provider_not_enabled');
    });

    test('denies when chat_completions capability is false', () => {
      const gate = evaluateExecutionGate({
        policy: validPolicy,
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: validReq,
        endpoint: validEndpoint,
        capability: { ...validCapability, chat_completions: false },
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('unsupported_capability');
    });

    test('denies non-streaming request when non_streaming capability is false', () => {
      const gate = evaluateExecutionGate({
        policy: validPolicy,
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: validReq,
        endpoint: validEndpoint,
        capability: { ...validCapability, non_streaming: false },
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('unsupported_capability');
    });

    test('denies tool_choice request when tool_calls capability is false', () => {
      const toolChoiceReq = createExecutionRequest({
        ...validReq,
        gateway_request: { ...validReq.gateway_request, tool_choice: 'auto' },
      });
      const gate = evaluateExecutionGate({
        policy: validPolicy,
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: toolChoiceReq,
        endpoint: validEndpoint,
        capability: { ...validCapability, tool_calls: false },
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('unsupported_capability');
    });
  });

  describe('Governed Single-Attempt Executor Lifecycle & Budgets', () => {
    test('disabled execution does NOT require transport and returns attempt_count: 0', async () => {
      let transportCalled = false;
      const fakeTransport = {
        execute: async () => {
          transportCalled = true;
          return {};
        },
      };
      const disabledReq = { ...validReq, policy: createExecutionPolicy({ enabled: false }) };

      const result = await executeGovernedRequest({
        execution_request: disabledReq,
        provider_adapter: validAdapter,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-test-secret' },
        clock: () => 1800000000,
      });

      expect(transportCalled).toBe(false);
      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(0);
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('preflight failure returns attempt_count: 0 without transport', async () => {
      const badReq = { ...validReq, provider_id: 'unallowed-provider' };
      const result = await executeGovernedRequest({
        execution_request: badReq,
        provider_adapter: validAdapter,
        transport: null,
      });

      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(0);
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('transport validation failure returns attempt_count: 0', async () => {
      const result = await executeGovernedRequest({
        execution_request: validReq,
        provider_adapter: validAdapter,
        transport: null,
        environment: { OPENAI_API_KEY: 'sk-test-secret' },
      });

      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(0);
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('pre-aborted signal returns state cancelled and attempt_count: 0', async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await executeGovernedRequest({
        execution_request: validReq,
        provider_adapter: validAdapter,
        transport: { execute: async () => ({}) },
        environment: { OPENAI_API_KEY: 'sk-test-secret' },
        signal: controller.signal,
      });

      expect(result.state).toBe('cancelled');
      expect(result.attempt_count).toBe(0);
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('oversized request blocks transport invocation and returns attempt_count: 0', async () => {
      let transportCalled = false;
      const fakeTransport = { execute: async () => { transportCalled = true; return {}; } };
      const tinyReqPolicy = createExecutionPolicy({ ...validPolicy, max_request_bytes: 10 });
      const tinyReq = { ...validReq, policy: tinyReqPolicy };

      const result = await executeGovernedRequest({
        execution_request: tinyReq,
        provider_adapter: validAdapter,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-test-secret' },
      });

      expect(transportCalled).toBe(false);
      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(0);
      expect(result.error.code).toBe('request_too_large');
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('executes transport exactly ONCE when allowed and validates completed result with IDs & timing', async () => {
      let calls = 0;
      let capturedCred = null;

      const fakeTransport = {
        execute: async ({ credential }) => {
          calls++;
          capturedCred = credential;
          return {
            id: 'chatcmpl-exec-1',
            object: 'chat.completion',
            created: 1800000000,
            model: 'gpt-4o',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Hello back' },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
          };
        },
      };

      const result = await executeGovernedRequest({
        execution_request: validReq,
        provider_adapter: validAdapter,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-test-valid-key' },
        clock: () => 1800000000,
      });

      expect(calls).toBe(1);
      expect(result.state).toBe('completed');
      expect(result.attempt_count).toBe(1);
      expect(result.request_id).toBe('req-exec-test-1');
      expect(result.provider_id).toBe('openai');
      expect(result.model_id).toBe('gpt-4o');
      expect(result.timing.started_at).toBe(1800000000);
      expect(result.timing.completed_at).toBe(1800000000);
      expect(result.timing.duration_ms).toBe(0);
      expect(result.redacted).toBe(true);

      expect(validateExecutionResult(result).success).toBe(true);
      expect(capturedCred.destroyed).toBe(true);
    });

    test('oversized response payload returns response_too_large and attempt_count: 1', async () => {
      const hugeTransport = {
        execute: async () => ({
          payload: 'x'.repeat(1000),
        }),
      };
      const tinyRespPolicy = createExecutionPolicy({ ...validPolicy, max_response_bytes: 50 });
      const tinyRespReq = { ...validReq, policy: tinyRespPolicy };

      const result = await executeGovernedRequest({
        execution_request: tinyRespReq,
        provider_adapter: validAdapter,
        transport: hugeTransport,
        environment: { OPENAI_API_KEY: 'sk-test-secret' },
      });

      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(1);
      expect(result.error.code).toBe('response_too_large');
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('circular response payload returns upstream_protocol_error and attempt_count: 1', async () => {
      const circularObj = {};
      circularObj.self = circularObj;

      const circularTransport = {
        execute: async () => circularObj,
      };

      const result = await executeGovernedRequest({
        execution_request: validReq,
        provider_adapter: validAdapter,
        transport: circularTransport,
        environment: { OPENAI_API_KEY: 'sk-test-secret' },
      });

      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(1);
      expect(result.error.code).toBe('upstream_protocol_error');
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('timeout/cancellation after transport invocation returns attempt_count: 1', async () => {
      const timeoutTransport = {
        execute: async () => {
          const err = new Error('Transport operation timed out');
          err.code = 'timeout';
          throw err;
        },
      };

      const result = await executeGovernedRequest({
        execution_request: validReq,
        provider_adapter: validAdapter,
        transport: timeoutTransport,
        environment: { OPENAI_API_KEY: 'sk-test-secret' },
      });

      expect(result.state).toBe('timed_out');
      expect(result.attempt_count).toBe(1);
      expect(result.error.code).toBe('timeout');
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('arbitrary secret string in thrown transport error is redacted BEFORE credential destruction', async () => {
      let capturedCred = null;
      const failingTransport = {
        execute: async ({ credential }) => {
          capturedCred = credential;
          let rawSecret;
          credential.withSecret((secret) => { rawSecret = secret; });
          throw new Error(`Custom transport crash bearing secret ${rawSecret}`);
        },
      };

      const result = await executeGovernedRequest({
        execution_request: validReq,
        provider_adapter: validAdapter,
        transport: failingTransport,
        environment: { OPENAI_API_KEY: 'sk-ultra-custom-dummy-token-777' },
      });

      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(1);
      expect(capturedCred.destroyed).toBe(true);
      expect(result.error.message).not.includes('sk-ultra-custom-dummy-token-777');
      expect(result.error.message).includes('[REDACTED]');
      expect(validateExecutionResult(result).success).toBe(true);
    });
  });
});
