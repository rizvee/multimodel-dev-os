import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createCredentialRef,
  createExecutionRequest,
  createExecutionResult,
  createProviderEndpoint,
  validateCredentialRef,
  validateExecutionRequest,
  validateExecutionResult,
  validateProviderEndpoint,
  EXECUTION_STATES,
  EXECUTION_DEFAULTS,
  CREDENTIAL_SOURCES,
  EXECUTION_PROTOCOLS,
  ALLOWED_TRANSPORT_HEADERS,
} from '../../src/gateway/index.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/gateway');

function readJson(fileName) {
  return JSON.parse(readFileSync(join(fixtureDir, fileName), 'utf8'));
}

describe('execution contracts', () => {
  describe('credential reference', () => {
    it('validates bundled credential ref fixture', () => {
      const ref = readJson('valid-credential-ref.json');
      const result = validateCredentialRef(ref);
      expect(result.success).toBe(true);
    });

    it('creates credential ref with environment source default', () => {
      const ref = createCredentialRef({ env_var: 'MY_API_KEY' });
      expect(ref.source).toBe('environment');
      expect(ref.env_var).toBe('MY_API_KEY');
      expect(ref.required).toBe(true);
      expect(validateCredentialRef(ref).success).toBe(true);
    });

    it('rejects missing env_var', () => {
      const result = validateCredentialRef({ source: 'environment' });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'env_var' }));
    });

    it('rejects unsupported credential source', () => {
      const result = validateCredentialRef({ source: 'vault', env_var: 'KEY' });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'source' }));
    });

    it('rejects env_var with spaces or assignment operators', () => {
      const result = validateCredentialRef({ source: 'environment', env_var: 'MY KEY=value' });
      expect(result.success).toBe(false);
    });

    it('rejects non-object credential ref', () => {
      const result = validateCredentialRef('not-an-object');
      expect(result.success).toBe(false);
    });
  });

  describe('provider endpoint', () => {
    it('validates bundled provider endpoint fixture', () => {
      const endpoint = readJson('valid-provider-endpoint.json');
      const result = validateProviderEndpoint(endpoint);
      expect(result.success).toBe(true);
    });

    it('creates endpoint with secure defaults', () => {
      const endpoint = createProviderEndpoint({ url: 'https://api.example.com/v1/chat' });
      expect(endpoint.protocol).toBe('https');
      expect(endpoint.follow_redirects).toBe(false);
      expect(endpoint.ssrf_check_required).toBe(true);
      expect(endpoint.headers_allowlist).toEqual(ALLOWED_TRANSPORT_HEADERS);
      expect(validateProviderEndpoint(endpoint).success).toBe(true);
    });

    it('rejects HTTP endpoints', () => {
      const result = validateProviderEndpoint({
        url: 'http://api.example.com/v1',
        protocol: 'https',
        follow_redirects: false,
        ssrf_check_required: true,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'policy_denied',
      }));
    });

    it('rejects private IP endpoints', () => {
      const result = validateProviderEndpoint({
        url: 'https://192.168.1.1/v1/chat',
        protocol: 'https',
        follow_redirects: false,
        ssrf_check_required: true,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        message: expect.stringContaining('private or local'),
      }));
    });

    it('rejects localhost endpoints', () => {
      const result = validateProviderEndpoint({
        url: 'https://localhost/v1/chat',
        protocol: 'https',
        follow_redirects: false,
        ssrf_check_required: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects embedded credentials in URL', () => {
      const result = validateProviderEndpoint({
        url: 'https://user:pass@api.example.com/v1',
        protocol: 'https',
        follow_redirects: false,
        ssrf_check_required: true,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        message: expect.stringContaining('embedded credentials'),
      }));
    });

    it('rejects follow_redirects=true', () => {
      const result = validateProviderEndpoint({
        url: 'https://api.example.com/v1',
        follow_redirects: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects disabling ssrf_check_required', () => {
      const result = validateProviderEndpoint({
        url: 'https://api.example.com/v1',
        ssrf_check_required: false,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-allowlisted transport headers', () => {
      const result = validateProviderEndpoint({
        url: 'https://api.example.com/v1',
        headers_allowlist: ['authorization', 'x-custom-header'],
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        message: expect.stringContaining('x-custom-header'),
      }));
    });
  });

  describe('execution request', () => {
    it('validates bundled execution request fixture', () => {
      const request = readJson('valid-execution-request.json');
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(true);
    });

    it('creates execution request with safe option defaults', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [] },
      });
      expect(request.options.follow_redirects).toBe(false);
      expect(request.options.timeout_ms).toBe(EXECUTION_DEFAULTS.timeout_ms);
      expect(request.options.max_response_bytes).toBe(EXECUTION_DEFAULTS.max_response_bytes);
      expect(request.options.stream).toBe(false);
    });

    it('rejects invalid execution request fixture', () => {
      const request = readJson('invalid-execution-request.json');
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('rejects missing required fields', () => {
      const result = validateExecutionRequest({});
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'request_id' }));
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'provider_id' }));
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'model_id' }));
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'gateway_request' }));
    });

    it('propagates credential_ref validation errors', () => {
      const result = validateExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [] },
        credential_ref: { source: 'file', env_var: 'KEY' },
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        path: expect.stringContaining('credential_ref'),
      }));
    });

    it('propagates endpoint validation errors', () => {
      const result = validateExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [] },
        endpoint: { url: 'http://insecure.example.com' },
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        path: expect.stringContaining('endpoint'),
      }));
    });

    it('rejects follow_redirects=true in options', () => {
      const result = validateExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [] },
        options: { follow_redirects: true },
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-object execution request', () => {
      const result = validateExecutionRequest('not-an-object');
      expect(result.success).toBe(false);
    });
  });

  describe('execution result', () => {
    it('validates bundled execution result fixture', () => {
      const executionResult = readJson('valid-execution-result.json');
      const result = validateExecutionResult(executionResult);
      expect(result.success).toBe(true);
    });

    it('creates execution result with pending state and redacted flag', () => {
      const executionResult = createExecutionResult({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
      });
      expect(executionResult.state).toBe('pending');
      expect(executionResult.redacted).toBe(true);
      expect(executionResult.timing.started_at).toBeNull();
    });

    it('rejects unknown execution states', () => {
      const result = validateExecutionResult({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        state: 'running',
        redacted: true,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'state' }));
    });

    it('requires gateway_response when state is completed', () => {
      const result = validateExecutionResult({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        state: 'completed',
        gateway_response: null,
        redacted: true,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'gateway_response' }));
    });

    it('requires error when state is failed', () => {
      const result = validateExecutionResult({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        state: 'failed',
        error: null,
        redacted: true,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'error' }));
    });

    it('rejects redacted=false', () => {
      const result = validateExecutionResult({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        state: 'pending',
        redacted: false,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({
        path: 'redacted',
        code: 'policy_denied',
      }));
    });

    it('rejects negative timing values', () => {
      const result = validateExecutionResult({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        state: 'pending',
        redacted: true,
        timing: { started_at: -1, completed_at: null, duration_ms: null },
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'timing.started_at' }));
    });

    it('validates all execution state enum values', () => {
      for (const state of EXECUTION_STATES) {
        const executionResult = createExecutionResult({
          request_id: 'req-001',
          provider_id: 'openai',
          model_id: 'gpt-4o',
          state,
        });
        if (state === 'completed') executionResult.gateway_response = {};
        if (state === 'failed') executionResult.error = {};
        const result = validateExecutionResult(executionResult);
        expect(result.errors.filter((e) => e.path === 'state')).toHaveLength(0);
      }
    });
  });

  describe('constants', () => {
    it('exports execution state enum', () => {
      expect(EXECUTION_STATES).toContain('pending');
      expect(EXECUTION_STATES).toContain('completed');
      expect(EXECUTION_STATES).toContain('failed');
      expect(EXECUTION_STATES).toContain('timed_out');
    });

    it('limits credential sources to environment only', () => {
      expect(CREDENTIAL_SOURCES).toEqual(['environment']);
    });

    it('limits execution protocols to HTTPS only', () => {
      expect(EXECUTION_PROTOCOLS).toEqual(['https']);
    });

    it('has safe execution defaults', () => {
      expect(EXECUTION_DEFAULTS.follow_redirects).toBe(false);
      expect(EXECUTION_DEFAULTS.ssrf_check_required).toBe(true);
      expect(EXECUTION_DEFAULTS.timeout_ms).toBeGreaterThan(0);
      expect(EXECUTION_DEFAULTS.max_response_bytes).toBeGreaterThan(0);
    });
  });
});
