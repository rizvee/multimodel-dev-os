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
const schemaDir = join(process.cwd(), '.ai/schema');

function readJson(fileName) {
  return JSON.parse(readFileSync(join(fixtureDir, fileName), 'utf8'));
}

function readSchema(fileName) {
  return JSON.parse(readFileSync(join(schemaDir, fileName), 'utf8'));
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

    it('requires all schema-required fields', () => {
      for (const field of ['contract_version', 'source', 'env_var', 'required']) {
        const ref = createCredentialRef({ env_var: 'MY_KEY' });
        delete ref[field];
        const result = validateCredentialRef(ref);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ path: field }));
      }
    });

    it('rejects strict env_var policy violations (lowercase, special chars)', () => {
      for (const badName of ['my_key', 'MY-KEY', 'MY.KEY', 'MY KEY', 'KEY=val', '$KEY', '{KEY}', '`KEY`']) {
        const result = validateCredentialRef({
          contract_version: EXECUTION_CONTRACT_VERSION,
          source: 'environment',
          env_var: badName,
          required: true,
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
          required: true,
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects extra unknown keys', () => {
      const result = validateCredentialRef({
        contract_version: EXECUTION_CONTRACT_VERSION,
        source: 'environment',
        env_var: 'MY_KEY',
        required: true,
        token: 'secret-value',
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ code: 'policy_denied' }));
    });

    it('rejects non-object credential reference', () => {
      const result = validateCredentialRef('not-an-object');
      expect(result.success).toBe(false);
    });

    it('rejects empty env_var', () => {
      const result = validateCredentialRef({
        contract_version: EXECUTION_CONTRACT_VERSION,
        source: 'environment',
        env_var: '',
        required: true,
      });
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

    it('requires all schema-required fields', () => {
      for (const field of ['contract_version', 'url', 'protocol', 'follow_redirects', 'ssrf_check_required']) {
        const endpoint = createProviderEndpoint({ url: 'https://api.example.com/v1' });
        delete endpoint[field];
        const result = validateProviderEndpoint(endpoint);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ path: field }));
      }
    });

    it('rejects invalid url format', () => {
      const result = validateProviderEndpoint({
        contract_version: EXECUTION_CONTRACT_VERSION,
        url: 'not-a-url',
        protocol: 'https',
        follow_redirects: false,
        ssrf_check_required: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects http protocol in endpoint', () => {
      const result = validateProviderEndpoint({
        contract_version: EXECUTION_CONTRACT_VERSION,
        url: 'http://insecure.example.com',
        protocol: 'https',
        follow_redirects: false,
        ssrf_check_required: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects follow_redirects=true in endpoint', () => {
      const result = validateProviderEndpoint({
        contract_version: EXECUTION_CONTRACT_VERSION,
        url: 'https://api.example.com/v1',
        protocol: 'https',
        follow_redirects: true,
        ssrf_check_required: true,
      });
      expect(result.success).toBe(false);
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

    it('requires all schema-required policy fields', () => {
      const requiredFields = [
        'contract_version',
        'enabled',
        'allowed_provider_ids',
        'require_https',
        'allow_private_networks',
        'follow_redirects',
        'max_attempts',
        'request_timeout_ms',
        'response_timeout_ms',
        'max_request_bytes',
        'max_response_bytes',
        'retry_enabled',
        'fallback_enabled',
      ];
      for (const field of requiredFields) {
        const policy = createExecutionPolicy();
        delete policy[field];
        const result = validateExecutionPolicy(policy);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ path: field }));
      }
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

    it('requires all schema-required capability fields', () => {
      const requiredFields = [
        'contract_version',
        'chat_completions',
        'non_streaming',
        'sse_streaming',
        'usage_reporting',
        'tool_calls',
        'structured_output',
        'system_messages',
        'custom_endpoint_support',
        'supported_auth_schemes',
      ];
      for (const field of requiredFields) {
        const cap = createProviderExecutionCapability();
        delete cap[field];
        const result = validateProviderExecutionCapability(cap);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ path: field }));
      }
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

    it('requires all schema-required error fields', () => {
      for (const field of ['contract_version', 'code', 'category', 'message', 'retryable', 'redacted']) {
        const err = createExecutionError({ code: 'timeout', message: 'Timeout' });
        delete err[field];
        const result = validateExecutionError(err);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ path: field }));
      }
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

    it('requires all schema-required request fields', () => {
      const requiredFields = [
        'contract_version',
        'request_id',
        'provider_id',
        'model_id',
        'gateway_request',
        'options',
        'policy',
        'capability',
      ];
      for (const field of requiredFields) {
        const request = createExecutionRequest({
          request_id: 'req-001',
          provider_id: 'openai',
          model_id: 'gpt-4o',
          gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
        });
        delete request[field];
        const result = validateExecutionRequest(request);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ path: field }));
      }
    });

    it('policy disabled permits nullable credential_ref and endpoint', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
        policy: createExecutionPolicy({ enabled: false }),
        credential_ref: null,
        endpoint: null,
      });
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(true);
    });

    it('policy enabled requires credential_ref and endpoint', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
        policy: createExecutionPolicy({ enabled: true }),
        credential_ref: null,
        endpoint: null,
      });
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'endpoint' }));
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'credential_ref' }));
    });

    it('streaming request requires sse_streaming capability', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }], stream: true },
        capability: createProviderExecutionCapability({ sse_streaming: false }),
      });
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ code: 'unsupported_capability' }));
    });

    it('rejects unknown option keys in request.options', () => {
      const request = createExecutionRequest({
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        gateway_request: { model: 'gpt-4o', messages: [{ role: 'user', content: 'hi' }] },
        options: { unknown_opt: true },
      });
      const result = validateExecutionRequest(request);
      expect(result.success).toBe(false);
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

    it('rejects non-object execution request', () => {
      const result = validateExecutionRequest('not-an-object');
      expect(result.success).toBe(false);
    });
  });

  describe('execution result', () => {
    it('validates bundled execution result fixture', () => {
      const resultObj = readJson('valid-execution-result.json');
      const result = validateExecutionResult(resultObj);
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

    it('requires all schema-required result fields', () => {
      const requiredFields = [
        'contract_version',
        'request_id',
        'provider_id',
        'model_id',
        'state',
        'attempt_count',
        'redacted',
      ];
      for (const field of requiredFields) {
        const res = createExecutionResult({
          request_id: 'r1',
          provider_id: 'p1',
          model_id: 'm1',
        });
        delete res[field];
        const result = validateExecutionResult(res);
        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ path: field }));
      }
    });

    it('pending state permits attempt_count 0 or 1', () => {
      const res0 = createExecutionResult({ request_id: 'r1', provider_id: 'p1', model_id: 'm1', state: 'pending', attempt_count: 0 });
      expect(validateExecutionResult(res0).success).toBe(true);

      const res1 = createExecutionResult({ request_id: 'r1', provider_id: 'p1', model_id: 'm1', state: 'pending', attempt_count: 1 });
      expect(validateExecutionResult(res1).success).toBe(true);

      const res2 = createExecutionResult({ request_id: 'r1', provider_id: 'p1', model_id: 'm1', state: 'pending', attempt_count: 2 });
      expect(validateExecutionResult(res2).success).toBe(false);
    });

    it('requires gateway_response and error=null when state is completed', () => {
      const resCompleted = createExecutionResult({
        request_id: 'r1',
        provider_id: 'p1',
        model_id: 'm1',
        state: 'completed',
        gateway_response: null,
      });
      const result = validateExecutionResult(resCompleted);
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'gateway_response' }));
    });

    it('requires error and gateway_response=null when state is failed', () => {
      const resFailed = createExecutionResult({
        request_id: 'r1',
        provider_id: 'p1',
        model_id: 'm1',
        state: 'failed',
        error: null,
      });
      const result = validateExecutionResult(resFailed);
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'error' }));
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
        attempt_count: 0,
        redacted: false,
      };
      const result = validateExecutionResult(res);
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'redacted' }));
    });

    it('rejects unknown execution states', () => {
      const result = validateExecutionResult({
        contract_version: EXECUTION_CONTRACT_VERSION,
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        state: 'running',
        attempt_count: 1,
        redacted: true,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(expect.objectContaining({ path: 'state' }));
    });

    it('rejects negative timing values', () => {
      const result = validateExecutionResult({
        contract_version: EXECUTION_CONTRACT_VERSION,
        request_id: 'req-001',
        provider_id: 'openai',
        model_id: 'gpt-4o',
        state: 'pending',
        attempt_count: 0,
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
          attempt_count: state === 'pending' ? 0 : 1,
        });
        if (state === 'completed') {
          executionResult.gateway_response = {
            id: 'c1',
            model: 'gpt-4o',
            choices: [{ index: 0, message: { role: 'assistant', content: 'hi' } }],
          };
        }
        if (state === 'failed') {
          executionResult.error = createExecutionError({ code: 'timeout', message: 'Timeout' });
        }
        const result = validateExecutionResult(executionResult);
        expect(result.errors.filter((e) => e.path === 'state')).toHaveLength(0);
      }
    });
  });

  describe('schema composition parity', () => {
    it('all formal schema $ref targets exist locally in .ai/schema/', () => {
      const schemaFiles = [
        'gateway-execution-request.schema.json',
        'gateway-execution-result.schema.json',
        'gateway-credential-reference.schema.json',
        'gateway-provider-endpoint.schema.json',
        'gateway-execution-policy.schema.json',
        'gateway-provider-capability.schema.json',
        'gateway-execution-error.schema.json',
      ];
      for (const file of schemaFiles) {
        const schema = readSchema(file);
        expect(schema.$id).toBeDefined();
        const str = JSON.stringify(schema);
        const refs = str.match(/"\$ref":\s*"([^"]+)"/g) || [];
        for (const refMatch of refs) {
          const target = refMatch.split('"')[3];
          expect(target).not.toMatch(/^https?:\/\//);
          expect(target).toMatch(/\.schema\.json$/);
        }
      }
    });

    it('no schema uses unrestricted additionalProperties: true in contract objects', () => {
      const securitySchemas = [
        'gateway-execution-request.schema.json',
        'gateway-execution-result.schema.json',
        'gateway-credential-reference.schema.json',
        'gateway-provider-endpoint.schema.json',
        'gateway-execution-policy.schema.json',
        'gateway-provider-capability.schema.json',
        'gateway-execution-error.schema.json',
      ];
      for (const file of securitySchemas) {
        const schema = readSchema(file);
        expect(schema.additionalProperties).toBe(false);
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
