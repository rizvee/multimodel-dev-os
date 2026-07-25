import { describe, expect, it } from 'vitest';
import {
  createCredentialRef,
  createExecutionError,
  createExecutionPolicy,
  createExecutionRequest,
  createExecutionResult,
  createProviderEndpoint,
  createProviderExecutionCapability,
  validateCredentialRef,
  validateExecutionError,
  validateExecutionPolicy,
  validateExecutionRequest,
  validateExecutionResult,
  validateProviderEndpoint,
  validateProviderExecutionCapability,
  ALLOWED_TRANSPORT_HEADERS,
  EXECUTION_CONTRACT_VERSION,
  EXECUTION_DEFAULTS,
} from '../../src/gateway/index.js';

describe('execution security contracts', () => {
  describe('credential reference security', () => {
    it('never stores actual credential values in the ref', () => {
      const ref = createCredentialRef({ env_var: 'OPENAI_API_KEY' });
      const serialized = JSON.stringify(ref);
      expect(serialized).not.toContain('sk-');
      expect(serialized).not.toContain('Bearer');
      expect(ref.env_var).toBe('OPENAI_API_KEY');
    });

    it('rejects env_var that looks like an actual secret value', () => {
      const longSecretLikeVar = 'api_key_' + 'x'.repeat(60);
      const result = validateCredentialRef({
        contract_version: EXECUTION_CONTRACT_VERSION,
        source: 'environment',
        env_var: longSecretLikeVar,
        required: true,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'policy_denied',
        message: expect.stringContaining('actual secret'),
      }));
    });

    it('only supports environment as credential source', () => {
      for (const badSource of ['file', 'vault', 'config', 'stdin', 'inline']) {
        const result = validateCredentialRef({
          contract_version: EXECUTION_CONTRACT_VERSION,
          source: badSource,
          env_var: 'KEY',
          required: true,
        });
        expect(result.success).toBe(false);
      }
    });
  });

  describe('provider endpoint security', () => {
    it('rejects all non-HTTPS protocols', () => {
      for (const url of [
        'http://api.example.com/v1',
        'ftp://api.example.com/v1',
        'ws://api.example.com/v1',
        'file:///etc/passwd',
      ]) {
        const result = validateProviderEndpoint({
          contract_version: EXECUTION_CONTRACT_VERSION,
          url,
          protocol: 'https',
          follow_redirects: false,
          ssrf_check_required: true,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects all private and loopback IP ranges', () => {
      const privateIps = [
        'https://127.0.0.1/v1',
        'https://10.0.0.1/v1',
        'https://172.16.0.1/v1',
        'https://192.168.1.1/v1',
        'https://169.254.1.1/v1',
        'https://0.0.0.0/v1',
        'https://localhost/v1',
      ];
      for (const url of privateIps) {
        const result = validateProviderEndpoint({
          contract_version: EXECUTION_CONTRACT_VERSION,
          url,
          protocol: 'https',
          follow_redirects: false,
          ssrf_check_required: true,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects embedded URL credentials', () => {
      const result = validateProviderEndpoint({
        contract_version: EXECUTION_CONTRACT_VERSION,
        url: 'https://admin:secret@api.example.com/v1',
        protocol: 'https',
        follow_redirects: false,
        ssrf_check_required: true,
      });
      expect(result.success).toBe(false);
    });

    it('follow_redirects cannot be enabled', () => {
      const endpoint = createProviderEndpoint({ url: 'https://api.example.com/v1' });
      expect(endpoint.follow_redirects).toBe(false);

      const result = validateProviderEndpoint({ ...endpoint, follow_redirects: true });
      expect(result.success).toBe(false);
    });

    it('ssrf_check_required cannot be disabled', () => {
      const endpoint = createProviderEndpoint({ url: 'https://api.example.com/v1' });
      expect(endpoint.ssrf_check_required).toBe(true);

      const result = validateProviderEndpoint({ ...endpoint, ssrf_check_required: false });
      expect(result.success).toBe(false);
    });

    it('headers allowlist is bounded to approved set', () => {
      expect(ALLOWED_TRANSPORT_HEADERS).toHaveLength(4);
      expect(ALLOWED_TRANSPORT_HEADERS).toContain('authorization');
      expect(ALLOWED_TRANSPORT_HEADERS).toContain('content-type');
      expect(ALLOWED_TRANSPORT_HEADERS).not.toContain('cookie');
      expect(ALLOWED_TRANSPORT_HEADERS).not.toContain('x-forwarded-for');
    });
  });

  describe('execution result security', () => {
    it('redacted flag is always true on factory-created results', () => {
      const result = createExecutionResult({
        request_id: 'req-sec',
        provider_id: 'test',
        model_id: 'test-model',
      });
      expect(result.redacted).toBe(true);
    });

    it('validation rejects redacted=false', () => {
      const result = validateExecutionResult({
        contract_version: EXECUTION_CONTRACT_VERSION,
        request_id: 'req-sec',
        provider_id: 'test',
        model_id: 'test-model',
        state: 'pending',
        attempt_count: 0,
        redacted: false,
        metadata: {},
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        path: 'redacted',
        code: 'policy_denied',
      }));
    });

    it('validation rejects missing redacted flag', () => {
      const result = validateExecutionResult({
        contract_version: EXECUTION_CONTRACT_VERSION,
        request_id: 'req-sec',
        provider_id: 'test',
        model_id: 'test-model',
        state: 'pending',
        attempt_count: 0,
        metadata: {},
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        path: 'redacted',
      }));
    });
  });

  describe('recursive sensitive-field and metadata security', () => {
    it('passes safe nested metadata', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
        metadata: {
          source: 'gateway',
          operation: 'chat-completion',
          trace_id: 'trace-001',
          nested: {
            tags: ['test', 'unit'],
            count: 5,
          },
        },
      });
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(true);
    });

    it('rejects secret-bearing keys in metadata recursively', () => {
      const secretKeys = [
        'api_key',
        'apiKey',
        'authorization',
        'token',
        'access_token',
        'refresh_token',
        'secret',
        'credential',
        'password',
        'cookie',
        'set-cookie',
        'private_key',
        'client_secret',
      ];
      for (const secretKey of secretKeys) {
        const request = createExecutionRequest({
          request_id: 'req-001',
          provider_id: 'openai',
          model_id: 'gpt-4o',
          gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
          metadata: {
            nested: {
              [secretKey]: 'sk-secret-1234',
            },
          },
        });
        const result = validateExecutionRequest(request);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({
          code: 'policy_denied',
          path: expect.stringContaining(secretKey),
        }));
      }
    });

    it('rejects prototype keys at any nesting depth in metadata', () => {
      for (const protoKey of ['__proto__', 'constructor', 'prototype']) {
        const request = createExecutionRequest({
          request_id: 'req-001',
          provider_id: 'openai',
          model_id: 'gpt-4o',
          gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
          metadata: {
            deep: {
              layer2: {
                [protoKey]: 'malicious',
              },
            },
          },
        });
        const result = validateExecutionRequest(request);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({
          code: 'policy_denied',
        }));
      }
    });

    it('rejects secret-bearing fields in execution error details recursively', () => {
      const err = createExecutionError({
        code: 'timeout',
        message: 'Timeout',
        details: {
          upstream_error: {
            raw_response: '{"token": "secret-value"}',
            stack_trace: 'Error stack trace',
          },
        },
      });
      const result = validateExecutionError(err);
      expect(result.success).toBe(false);
    });

    it('rejects absolute local file paths in metadata values', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
        metadata: {
          config_file: '/etc/passwd',
        },
      });
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(false);
    });
  });

  describe('execution defaults security', () => {
    it('defaults enforce no-redirect policy', () => {
      expect(EXECUTION_DEFAULTS.follow_redirects).toBe(false);
    });

    it('defaults enforce SSRF check', () => {
      expect(EXECUTION_DEFAULTS.ssrf_check_required).toBe(true);
    });

    it('defaults enforce bounded timeouts', () => {
      expect(EXECUTION_DEFAULTS.timeout_ms).toBeLessThanOrEqual(120000);
      expect(EXECUTION_DEFAULTS.timeout_ms).toBeGreaterThan(0);
    });

    it('defaults enforce bounded response size', () => {
      expect(EXECUTION_DEFAULTS.max_response_bytes).toBeLessThanOrEqual(52428800);
      expect(EXECUTION_DEFAULTS.max_response_bytes).toBeGreaterThan(0);
    });
  });

  describe('stream executor E2.1 contract hardening', () => {
    it('maps validator errors to EXECUTION_ERROR_CATEGORIES and passes validateExecutionError', async () => {
      const { executeGovernedStream } = await import('../../src/gateway/execution/stream-executor.js');
      const badReq = {
        contract_version: EXECUTION_CONTRACT_VERSION,
        request_id: 'req-bad',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { stream: true },
        options: {},
        policy: { enabled: true },
        capability: { sse_streaming: true },
        extra_unsupported: 'bad',
      };

      const res = await executeGovernedStream({ execution_request: badReq });
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(validateExecutionError(res.error).success).toBe(true);
      expect(res.error.code).toBe('request_invalid');
      expect(res.error.category).toBe('request_invalid');
    });

    it('returns a safe frozen summary with deterministic state and safe_error', async () => {
      const { executeGovernedStream } = await import('../../src/gateway/execution/stream-executor.js');
      async function* mockStream() {
        yield 'data: [DONE]\n\n';
      }

      const validPolicy = createExecutionPolicy({
        enabled: true,
        allowed_provider_ids: ['openai'],
      });

      const validReq = createExecutionRequest({
        request_id: 'req-sum-1',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        policy: validPolicy,
        gateway_request: { stream: true, model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
        endpoint: createProviderEndpoint({ url: 'https://api.openai.com/v1/chat/completions' }),
        capability: createProviderExecutionCapability({ sse_streaming: true, chat_completions: true }),
        credential_ref: createCredentialRef({ env_var: 'OPENAI_API_KEY' }),
      });

      const mockTransport = {
        stream: async () => ({ status: 200, headers: {}, body: mockStream() }),
      };

      const mockAdapter = {
        id: 'openai',
        name: 'OpenAI Provider',
        type: 'openai-compatible',
        version: '1.0.0',
        capabilities: ['chat', 'streaming'],
        credential_env: 'OPENAI_API_KEY',
        base_url: 'https://api.openai.com/v1',
        models: ['gpt-4o'],
        validateConfig: () => ({ success: true }),
        listModels: () => [],
        normalizeRequest: () => ({ success: true }),
        invoke: () => ({ success: true }),
        normalizeResponse: () => ({ success: true }),
        stream: () => ({ success: true }),
        classifyError: () => ({ code: 'upstream_server_error' }),
        health: () => ({ success: true }),
        redact: (v) => v,
      };

      const res = await executeGovernedStream({
        execution_request: validReq,
        provider_adapter: mockAdapter,
        transport: mockTransport,
        environment: { OPENAI_API_KEY: 'sk-test-key' },
      });

      if (!res.success) console.error('Gate error:', res.error);

      expect(res.success).toBe(true);
      for await (const chunk of res.session.event_stream) {}

      const summary1 = res.session.getSummary();
      const summary2 = res.session.getSummary();

      expect(summary1).toBe(summary2);
      expect(Object.isFrozen(summary1)).toBe(true);
      expect(Object.isFrozen(summary1.timing)).toBe(true);
      expect(summary1.state).toBe('completed');
      expect(summary1.safe_error).toBeNull();
    });

    it('notifies subscribeFinalization listeners and allows unsubscribing', async () => {
      const { executeGovernedStream } = await import('../../src/gateway/execution/stream-executor.js');
      async function* mockStream() {
        yield 'data: [DONE]\n\n';
      }

      const validPolicy = createExecutionPolicy({
        enabled: true,
        allowed_provider_ids: ['openai'],
      });

      const validReq = createExecutionRequest({
        request_id: 'req-sub-1',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        policy: validPolicy,
        gateway_request: { stream: true, model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
        endpoint: createProviderEndpoint({ url: 'https://api.openai.com/v1/chat/completions' }),
        capability: createProviderExecutionCapability({ sse_streaming: true, chat_completions: true }),
        credential_ref: createCredentialRef({ env_var: 'OPENAI_API_KEY' }),
      });

      const mockTransport = {
        stream: async () => ({ status: 200, headers: {}, body: mockStream() }),
      };

      const mockAdapter = {
        id: 'openai',
        name: 'OpenAI Provider',
        type: 'openai-compatible',
        version: '1.0.0',
        capabilities: ['chat', 'streaming'],
        credential_env: 'OPENAI_API_KEY',
        base_url: 'https://api.openai.com/v1',
        models: ['gpt-4o'],
        validateConfig: () => ({ success: true }),
        listModels: () => [],
        normalizeRequest: () => ({ success: true }),
        invoke: () => ({ success: true }),
        normalizeResponse: () => ({ success: true }),
        stream: () => ({ success: true }),
        classifyError: () => ({ code: 'upstream_server_error' }),
        health: () => ({ success: true }),
        redact: (v) => v,
      };

      const res = await executeGovernedStream({
        execution_request: validReq,
        provider_adapter: mockAdapter,
        transport: mockTransport,
        environment: { OPENAI_API_KEY: 'sk-test-key' },
      });

      expect(res.success).toBe(true);

      let notifiedSummary = null;
      const unsub = res.session.subscribeFinalization((sum) => {
        notifiedSummary = sum;
      });

      for await (const chunk of res.session.event_stream) {}

      expect(notifiedSummary).not.toBeNull();
      expect(notifiedSummary.state).toBe('completed');
    });
  });
});
