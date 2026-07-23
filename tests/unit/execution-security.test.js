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
});
