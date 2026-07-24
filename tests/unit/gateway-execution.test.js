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
  EXECUTION_CONTRACT_VERSION,
} from '../../src/gateway/index.js';

describe('Gateway Governed Execution & Gate (Sprint D)', () => {
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

  describe('Execution Gate Preflight', () => {
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

    test('denies execution when provider is not allowlisted', () => {
      const gate = evaluateExecutionGate({
        policy: { ...validPolicy, allowed_provider_ids: ['anthropic'] },
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: validReq,
        endpoint: validEndpoint,
        capability: validCapability,
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('provider_not_enabled');
    });

    test('denies execution on provider ID mismatch', () => {
      const gate = evaluateExecutionGate({
        policy: validPolicy,
        provider_id: 'openai',
        provider_adapter: { ...validAdapter, id: 'anthropic' },
        request: validReq,
        endpoint: validEndpoint,
        capability: validCapability,
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('provider_not_enabled');
    });

    test('denies execution on non-HTTPS or invalid endpoint', () => {
      const gate = evaluateExecutionGate({
        policy: validPolicy,
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: validReq,
        endpoint: { ...validEndpoint, url: 'http://api.openai.com/v1/chat/completions' },
        capability: validCapability,
      });
      expect(gate.allowed).toBe(false);
      expect(['endpoint_forbidden', 'endpoint_invalid'].includes(gate.code)).toBe(true);
    });

    test('denies execution on private/loopback network endpoint when private networks disabled', () => {
      const gate = evaluateExecutionGate({
        policy: { ...validPolicy, allow_private_networks: false },
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: validReq,
        endpoint: { ...validEndpoint, url: 'https://localhost:8443/v1/chat/completions' },
        capability: validCapability,
      });
      expect(gate.allowed).toBe(false);
      expect(['endpoint_forbidden', 'endpoint_invalid'].includes(gate.code)).toBe(true);
    });

    test('denies execution when streaming requested but sse_streaming capability is false', () => {
      const streamReq = createExecutionRequest({
        ...validReq,
        gateway_request: { ...validReq.gateway_request, stream: true },
      });
      const noStreamCap = createProviderExecutionCapability({
        chat_completions: true,
        sse_streaming: false,
      });
      const gate = evaluateExecutionGate({
        policy: validPolicy,
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: streamReq,
        endpoint: validEndpoint,
        capability: noStreamCap,
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('unsupported_capability');
    });

    test('denies execution when tools requested but tool_calls capability is false', () => {
      const toolReq = createExecutionRequest({
        ...validReq,
        gateway_request: {
          ...validReq.gateway_request,
          tools: [{ type: 'function', function: { name: 'calc' } }],
        },
      });
      const noToolCap = createProviderExecutionCapability({
        chat_completions: true,
        tool_calls: false,
      });
      const gate = evaluateExecutionGate({
        policy: validPolicy,
        provider_id: 'openai',
        provider_adapter: validAdapter,
        request: toolReq,
        endpoint: validEndpoint,
        capability: noToolCap,
      });
      expect(gate.allowed).toBe(false);
      expect(gate.code).toBe('unsupported_capability');
    });
  });

  describe('Transport Contract Validation', () => {
    test('rejects missing or non-object transport', () => {
      expect(validateTransport(null).success).toBe(false);
      expect(validateTransport({}).success).toBe(false);
      expect(validateTransport({ execute: 'not-a-fn' }).success).toBe(false);
    });

    test('accepts valid transport exposing execute()', () => {
      const valid = { execute: async () => ({}) };
      expect(validateTransport(valid).success).toBe(true);
    });
  });

  describe('Governed Single-Attempt Executor', () => {
    test('denied gate does NOT invoke transport or environment access', async () => {
      let transportCalled = false;
      const fakeTransport = {
        execute: async () => {
          transportCalled = true;
          return {};
        },
      };
      const disabledPolicy = createExecutionPolicy({ enabled: false });
      const disabledReq = { ...validReq, policy: disabledPolicy };

      const result = await executeGovernedRequest({
        execution_request: disabledReq,
        provider_adapter: validAdapter,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-test-secret' },
        clock: () => 1800000000,
      });

      expect(transportCalled).toBe(false);
      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(1);
      expect(validateExecutionResult(result).success).toBe(true);
    });

    test('executes transport exactly ONCE when allowed', async () => {
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
      expect(result.redacted).toBe(true);
      expect(result.gateway_response.choices[0].message.content).toBe('Hello back');

      // Credential destroyed in finally block after execution
      expect(capturedCred.destroyed).toBe(true);
    });

    test('destroys credential container in finally block after transport failure', async () => {
      let capturedCred = null;
      const failingTransport = {
        execute: async ({ credential }) => {
          capturedCred = credential;
          throw new Error('Network connection reset');
        },
      };

      const result = await executeGovernedRequest({
        execution_request: validReq,
        provider_adapter: validAdapter,
        transport: failingTransport,
        environment: { OPENAI_API_KEY: 'sk-test-fail-key' },
        clock: () => 1800000000,
      });

      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(1);
      expect(capturedCred.destroyed).toBe(true);
      expect(result.error.message).not.includes('sk-test-fail-key');
    });

    test('normalizes provider error payload from transport', async () => {
      const errTransport = {
        execute: async () => ({
          status: 401,
          error: {
            error: {
              message: 'Incorrect API key provided: sk-proj-secret',
              type: 'invalid_request_error',
              code: 'invalid_api_key',
            },
          },
        }),
      };

      const result = await executeGovernedRequest({
        execution_request: validReq,
        provider_adapter: validAdapter,
        transport: errTransport,
        environment: { OPENAI_API_KEY: 'sk-proj-secret' },
        clock: () => 1800000000,
      });

      expect(result.state).toBe('failed');
      expect(result.attempt_count).toBe(1);
      expect(result.error.redacted).toBe(true);
      expect(result.error.message).not.includes('sk-proj-secret');
    });
  });

  describe('Sprint C Closure Edge Cases', () => {

    test('rejects invalid environment override (e.g. string or number) without process.env fallback', () => {
      const resString = resolveEnvironmentCredential({
        provider_id: 'openai',
        provider_adapter: validAdapter,
        environment: 'invalid-string-override',
      });
      expect(resString.success).toBe(false);
      expect(resString.error.code).toBe('credential_reference_invalid');
      expect(validateExecutionError(resString.error).success).toBe(true);

      const resNum = resolveEnvironmentCredential({
        provider_id: 'openai',
        provider_adapter: validAdapter,
        environment: 12345,
      });
      expect(resNum.success).toBe(false);
      expect(validateExecutionError(resNum.error).success).toBe(true);
    });

    test('reads only own data properties, rejecting inherited prototype properties', () => {
      const parentEnv = { OPENAI_API_KEY: 'inherited-secret' };
      const childEnv = Object.create(parentEnv);

      const res = resolveEnvironmentCredential({
        provider_id: 'openai',
        provider_adapter: validAdapter,
        environment: childEnv,
      });
      expect(res.success).toBe(false);
      expect(res.error.code).toBe('credential_unavailable');
    });

    test('rejects accessor/getter properties on environment override', () => {
      const getterEnv = {};
      Object.defineProperty(getterEnv, 'OPENAI_API_KEY', {
        get() {
          return 'secret-from-getter';
        },
        enumerable: true,
      });

      const res = resolveEnvironmentCredential({
        provider_id: 'openai',
        provider_adapter: validAdapter,
        environment: getterEnv,
      });
      expect(res.success).toBe(false);
      expect(res.error.code).toBe('credential_unavailable');
    });

    test('withSecret callback failure sanitizes message, stack, cause, and details', () => {
      const res = resolveEnvironmentCredential({
        provider_id: 'openai',
        provider_adapter: validAdapter,
        environment: { OPENAI_API_KEY: 'super-sensitive-secret-token' },
      });
      expect(res.success).toBe(true);

      const cred = res.credential;
      expect(() => {
        cred.withSecret((raw) => {
          const err = new Error(`Error containing ${raw}`);
          err.cause = `Cause with ${raw}`;
          err.details = { note: `Details with ${raw}` };
          throw err;
        });
      }).toThrowError();

      try {
        cred.withSecret((raw) => {
          const err = new Error(`Error containing ${raw}`);
          err.cause = `Cause with ${raw}`;
          err.details = { note: `Details with ${raw}` };
          throw err;
        });
      } catch (err) {
        expect(err.message).not.includes('super-sensitive-secret-token');
        expect(err.stack).not.includes('super-sensitive-secret-token');
        expect(err.cause).not.includes('super-sensitive-secret-token');
        expect(err.details.note).not.includes('super-sensitive-secret-token');
      }
    });

    test('optional missing credential reports semantically accurate safe metadata', () => {
      const optionalRef = createCredentialRef({ env_var: 'OPENAI_API_KEY', required: false });
      const res = resolveEnvironmentCredential({
        credential_ref: optionalRef,
        provider_id: 'openai',
        provider_adapter: validAdapter,
        environment: {},
      });
      expect(res.success).toBe(true);
      expect(res.credential).toBe(null);
      expect(res.metadata.resolved).toBe(true);
      expect(res.metadata.env_var).toBe('OPENAI_API_KEY');
    });
  });
});
