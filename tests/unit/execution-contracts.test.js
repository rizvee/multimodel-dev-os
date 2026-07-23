import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
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
  CREDENTIAL_SOURCES,
  EXECUTION_CONTRACT_VERSION,
  EXECUTION_DEFAULTS,
  EXECUTION_ERROR_CATEGORIES,
  EXECUTION_PROTOCOLS,
  EXECUTION_STATES,
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

    it('creates credential ref with environment source default and contract_version', () => {
      const ref = createCredentialRef({ env_var: 'MY_API_KEY' });
      expect(ref.contract_version).toBe(EXECUTION_CONTRACT_VERSION);
      expect(ref.source).toBe('environment');
      expect(ref.env_var).toBe('MY_API_KEY');
      expect(ref.required).toBe(true);
      expect(validateCredentialRef(ref).success).toBe(true);
    });

    it('forces environment source even if caller passes override', () => {
      const ref = createCredentialRef({ env_var: 'MY_API_KEY', source: 'vault' });
      expect(ref.source).toBe('environment');
    });

    it('rejects strict env_var policy violations (lowercase, special chars)', () => {
      for (const badName of ['my_key', 'MY-KEY', 'MY.KEY', 'MY KEY', 'KEY=val', '$KEY', '{KEY}', '`KEY`']) {
        const result = validateCredentialRef({
          contract_version: EXECUTION_CONTRACT_VERSION,
          source: 'environment',
          env_var: badName,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects prototype-sensitive env_var names', () => {
      for (const protoName of ['__proto__', 'constructor', 'prototype', '__PROTO__', 'PROTOTYPE']) {
        const result = validateCredentialRef({
          contract_version: EXECUTION_CONTRACT_VERSION,
          source: 'environment',
          env_var: protoName,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects extra unknown keys', () => {
      const result = validateCredentialRef({
        contract_version: EXECUTION_CONTRACT_VERSION,
        source: 'environment',
        env_var: 'MY_KEY',
        token: 'secret-value',
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ code: 'policy_denied' }));
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
      expect(endpoint.contract_version).toBe(EXECUTION_CONTRACT_VERSION);
      expect(endpoint.protocol).toBe('https');
      expect(endpoint.follow_redirects).toBe(false);
      expect(endpoint.ssrf_check_required).toBe(true);
      expect(endpoint.headers_allowlist).toEqual(ALLOWED_TRANSPORT_HEADERS);
      expect(validateProviderEndpoint(endpoint).success).toBe(true);
    });

    it('forces secure defaults even if caller passes overrides', () => {
      const endpoint = createProviderEndpoint({
        url: 'https://api.example.com/v1',
        follow_redirects: true,
        ssrf_check_required: false,
        protocol: 'http',
      });
      expect(endpoint.protocol).toBe('https');
      expect(endpoint.follow_redirects).toBe(false);
      expect(endpoint.ssrf_check_required).toBe(true);
    });

    it('rejects unknown/forbidden keys', () => {
      const result = validateProviderEndpoint({
        contract_version: EXECUTION_CONTRACT_VERSION,
        url: 'https://api.example.com/v1',
        protocol: 'https',
        follow_redirects: false,
        ssrf_check_required: true,
        secret: '123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('execution policy', () => {
    it('validates bundled execution policy fixture', () => {
      const policy = readJson('valid-execution-policy.json');
      const result = validateExecutionPolicy(policy);
      expect(result.success).toBe(true);
    });

    it('creates policy with secure defaults', () => {
      const policy = createExecutionPolicy();
      expect(policy.contract_version).toBe(EXECUTION_CONTRACT_VERSION);
      expect(policy.enabled).toBe(false);
      expect(policy.require_https).toBe(true);
      expect(policy.allow_private_networks).toBe(false);
      expect(policy.follow_redirects).toBe(false);
      expect(policy.max_attempts).toBe(1);
      expect(policy.retry_enabled).toBe(false);
      expect(policy.fallback_enabled).toBe(false);
      expect(validateExecutionPolicy(policy).success).toBe(true);
    });

    it('forces secure defaults in policy factory', () => {
      const policy = createExecutionPolicy({
        require_https: false,
        allow_private_networks: true,
        follow_redirects: true,
        max_attempts: 5,
        retry_enabled: true,
        fallback_enabled: true,
      });
      expect(policy.require_https).toBe(true);
      expect(policy.allow_private_networks).toBe(false);
      expect(policy.follow_redirects).toBe(false);
      expect(policy.max_attempts).toBe(1);
      expect(policy.retry_enabled).toBe(false);
      expect(policy.fallback_enabled).toBe(false);
    });

    it('rejects invalid execution policy fixture', () => {
      const policy = readJson('invalid-execution-policy.json');
      const result = validateExecutionPolicy(policy);
      expect(result.success).toBe(false);
    });
  });

  describe('provider execution capability', () => {
    it('validates bundled capability fixture', () => {
      const cap = readJson('valid-provider-capability.json');
      const result = validateProviderExecutionCapability(cap);
      expect(result.success).toBe(true);
    });

    it('creates capability with contract_version', () => {
      const cap = createProviderExecutionCapability();
      expect(cap.contract_version).toBe(EXECUTION_CONTRACT_VERSION);
      expect(cap.chat_completions).toBe(true);
      expect(validateProviderExecutionCapability(cap).success).toBe(true);
    });

    it('rejects invalid capability fixture', () => {
      const cap = readJson('invalid-provider-capability.json');
      const result = validateProviderExecutionCapability(cap);
      expect(result.success).toBe(false);
    });
  });

  describe('normalized execution error', () => {
    it('validates bundled error fixture', () => {
      const err = readJson('valid-execution-error.json');
      const result = validateExecutionError(err);
      expect(result.success).toBe(true);
    });

    it('creates execution error with redacted: true forced', () => {
      const err = createExecutionError({ redacted: false, code: 'timeout', message: 'Timeout' });
      expect(err.contract_version).toBe(EXECUTION_CONTRACT_VERSION);
      expect(err.redacted).toBe(true);
    });

    it('rejects invalid error fixture with redacted: false or stack trace', () => {
      const err = readJson('invalid-execution-error.json');
      const result = validateExecutionError(err);
      expect(result.success).toBe(false);
    });
  });

  describe('execution request', () => {
    it('validates bundled execution request fixture', () => {
      const request = readJson('valid-execution-request.json');
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(true);
    });

    it('creates request with safe option defaults', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
      });
      expect(request.contract_version).toBe(EXECUTION_CONTRACT_VERSION);
      expect(request.options.follow_redirects).toBe(false);
    });

    it('forces options.follow_redirects false in factory', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        options: { follow_redirects: true },
      });
      expect(request.options.follow_redirects).toBe(false);
    });

    it('rejects model_id mismatch with gateway_request.model', () => {
      const request = createExecutionRequest({
        contract_version: EXECUTION_CONTRACT_VERSION,
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: 'hi' }] },
      });
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'model_id' }));
    });
  });

  describe('execution result', () => {
    it('validates bundled execution result fixture', () => {
      const resultObj = readJson('valid-execution-result.json');
      const result = validateExecutionResult(resultObj);
      expect(result.success).toBe(true);
    });

    it('factory forces redacted: true even when caller passes redacted: false', () => {
      const res = createExecutionResult({
        request_id: 'r1',
        provider_id: 'p1',
        model_id: 'm1',
        redacted: false,
      });
      expect(res.redacted).toBe(true);
    });

    it('validator rejects manually constructed result with redacted: false', () => {
      const res = {
        contract_version: EXECUTION_CONTRACT_VERSION,
        request_id: 'r1',
        provider_id: 'p1',
        model_id: 'm1',
        state: 'pending',
        redacted: false,
      };
      const result = validateExecutionResult(res);
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'redacted' }));
    });
  });
});
