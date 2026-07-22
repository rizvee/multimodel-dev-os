import { describe, expect, it } from 'vitest';
import {
  createCredentialRef,
  createExecutionResult,
  createProviderEndpoint,
  validateCredentialRef,
  validateExecutionResult,
  validateProviderEndpoint,
  ALLOWED_TRANSPORT_HEADERS,
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
        source: 'environment',
        env_var: longSecretLikeVar,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'policy_denied',
        message: expect.stringContaining('actual secret'),
      }));
    });

    it('only supports environment as credential source', () => {
      for (const badSource of ['file', 'vault', 'config', 'stdin', 'inline']) {
        const result = validateCredentialRef({ source: badSource, env_var: 'KEY' });
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
          url,
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
          url,
          follow_redirects: false,
          ssrf_check_required: true,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects embedded URL credentials', () => {
      const result = validateProviderEndpoint({
        url: 'https://admin:secret@api.example.com/v1',
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
        request_id: 'req-sec',
        provider_id: 'test',
        model_id: 'test-model',
        state: 'pending',
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
        request_id: 'req-sec',
        provider_id: 'test',
        model_id: 'test-model',
        state: 'pending',
        metadata: {},
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        path: 'redacted',
      }));
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
