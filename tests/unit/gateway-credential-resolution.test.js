import { describe, expect, it } from 'vitest';
import {
  resolveEnvironmentCredential,
  ResolvedCredential,
  createResolvedCredential,
  redactSensitiveValue,
  EXECUTION_CONTRACT_VERSION,
} from '../../src/gateway/index.js';

function createMockAdapter(overrides = {}) {
  return {
    id: 'mock-provider',
    name: 'Mock Provider',
    type: 'openai-compatible',
    version: '1.0.0',
    capabilities: ['chat'],
    credential_env: 'MOCK_API_KEY',
    base_url: 'https://api.mockprovider.com/v1',
    models: ['mock-model'],
    validateConfig: () => ({ success: true }),
    listModels: () => [],
    normalizeRequest: () => ({ success: true }),
    invoke: () => ({ success: true }),
    normalizeResponse: () => ({ success: true }),
    stream: () => ({ success: true }),
    classifyError: () => ({ success: true }),
    health: () => ({ success: true }),
    redact: (v) => v,
    ...overrides,
  };
}

describe('v4.3 Sprint C Governed Credential Resolution & Redaction', () => {
  it('resolves valid credential from injected environment', () => {
    const adapter = createMockAdapter();
    const env = { MOCK_API_KEY: 'sk-dummy-mock-secret-9999' };

    const result = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: env,
    });

    expect(result.success).toBe(true);
    expect(result.credential).toBeInstanceOf(ResolvedCredential);
    expect(result.metadata).toEqual({
      contract_version: EXECUTION_CONTRACT_VERSION,
      resolved: true,
      provider_id: 'mock-provider',
      env_var: 'MOCK_API_KEY',
      source: 'environment',
    });

    // Controlled secret access
    result.credential.withSecret((secret) => {
      expect(secret).toBe('sk-dummy-mock-secret-9999');
    });
  });

  it('accesses ONLY the approved env var without environment enumeration', () => {
    const adapter = createMockAdapter({ credential_env: 'APPROVED_KEY' });
    let enumerated = false;

    const envProxy = new Proxy(
      { APPROVED_KEY: 'sk-approved-secret-1234' },
      {
        get(target, prop) {
          if (prop === 'APPROVED_KEY') return target[prop];
          return undefined;
        },
        ownKeys() {
          enumerated = true;
          return [];
        },
        getOwnPropertyDescriptor() {
          enumerated = true;
          return undefined;
        },
      }
    );

    const result = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: envProxy,
    });

    expect(result.success).toBe(true);
    expect(enumerated).toBe(false);
  });

  it('rejects provider_id mismatch before accessing environment', () => {
    const adapter = createMockAdapter({ id: 'real-provider' });
    let accessed = false;

    const env = new Proxy(
      { MOCK_API_KEY: 'secret' },
      {
        get() {
          accessed = true;
          return 'secret';
        },
      }
    );

    const result = resolveEnvironmentCredential({
      provider_id: 'wrong-provider',
      provider_adapter: adapter,
      environment: env,
    });

    expect(result.success).toBe(false);
    expect(accessed).toBe(false);
    expect(result.error.category).toBe('credential_reference_invalid');
  });

  it('rejects env_var mismatch between credential_ref and provider_adapter before access', () => {
    const adapter = createMockAdapter({ credential_env: 'APPROVED_KEY' });
    let accessed = false;

    const env = new Proxy(
      {},
      {
        get() {
          accessed = true;
          return 'secret';
        },
      }
    );

    const result = resolveEnvironmentCredential({
      credential_ref: {
        contract_version: EXECUTION_CONTRACT_VERSION,
        source: 'environment',
        env_var: 'UNAUTHORIZED_KEY',
        required: true,
      },
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: env,
    });

    expect(result.success).toBe(false);
    expect(accessed).toBe(false);
    expect(result.error.category).toBe('credential_reference_invalid');
  });

  it('handles adapter with null credential_env cleanly', () => {
    const adapter = createMockAdapter({ credential_env: null });

    const result = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: {},
    });

    expect(result.success).toBe(true);
    expect(result.credential).toBeNull();
    expect(result.metadata.env_var).toBeNull();
  });

  it('fails missing required credential with credential_unavailable', () => {
    const adapter = createMockAdapter();

    const result = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: {},
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('credential_unavailable');
    expect(result.error.category).toBe('credential_unavailable');
  });

  it('allows missing optional credential when required: false', () => {
    const adapter = createMockAdapter();

    const result = resolveEnvironmentCredential({
      credential_ref: {
        contract_version: EXECUTION_CONTRACT_VERSION,
        source: 'environment',
        env_var: 'MOCK_API_KEY',
        required: false,
      },
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: {},
    });

    expect(result.success).toBe(true);
    expect(result.credential).toBeNull();
  });

  it('rejects malformed, lowercase, or prototype-sensitive env_var names', () => {
    for (const badEnv of ['lowercase_key', '__proto__', 'KEY WITH SPACE', 'KEY;SELECT']) {
      const adapter = createMockAdapter({ credential_env: badEnv });
      const result = resolveEnvironmentCredential({
        provider_id: 'mock-provider',
        provider_adapter: adapter,
        environment: {},
      });

      expect(result.success).toBe(false);
      expect(result.error.category).toBe('credential_reference_invalid');
    }
  });

  it('rejects non-string, whitespace, CR/LF/NUL, or oversized credential values', () => {
    const adapter = createMockAdapter();

    const invalidValues = [
      12345,
      true,
      '   ',
      'secret\nwith-newline',
      'secret\rwith-cr',
      'secret\0with-nul',
      'x'.repeat(16385),
    ];

    for (const val of invalidValues) {
      const result = resolveEnvironmentCredential({
        provider_id: 'mock-provider',
        provider_adapter: adapter,
        environment: { MOCK_API_KEY: val },
      });

      expect(result.success).toBe(false);
      expect(['credential_unavailable', 'credential_reference_invalid']).toContain(result.error.category);
    }
  });

  it('harden Opaque Credential Container redaction (JSON, String, inspect, spread)', () => {
    const credential = createResolvedCredential({
      provider_id: 'mock-provider',
      env_var: 'MOCK_API_KEY',
      secret: 'sk-secret-dummy-val-777',
    });

    // 1. JSON.stringify redaction
    const jsonStr = JSON.stringify(credential);
    expect(jsonStr).not.toContain('sk-secret-dummy-val-777');
    expect(jsonStr).toContain('[REDACTED]');

    // 2. String() conversion
    const strVal = String(credential);
    expect(strVal).not.toContain('sk-secret-dummy-val-777');
    expect(strVal).toContain('(redacted)');

    // 3. Object spread
    const spreadObj = { ...credential };
    expect(Object.keys(spreadObj)).not.toContain('#secret');
    expect(Object.keys(spreadObj)).not.toContain('secret');
    expect(Object.keys(spreadObj)).not.toContain('value');
    expect(spreadObj.provider_id).toBe('mock-provider');
  });

  it('enforces destroy() behavior and prevents secret leakage on callback throw', () => {
    const credential = createResolvedCredential({
      provider_id: 'mock-provider',
      env_var: 'MOCK_API_KEY',
      secret: 'sk-super-secret-key-000',
    });

    // 1. Throwing callback error message is sanitized
    expect(() => {
      credential.withSecret((sec) => {
        throw new Error(`Failed with key: ${sec}`);
      });
    }).toThrowError(/Failed with key: \[REDACTED\]/);

    // 2. Destroy container
    expect(credential.destroy()).toBe(true);
    expect(credential.destroyed).toBe(true);

    // 3. Post-destroy access fails cleanly
    expect(() => {
      credential.withSecret(() => {});
    }).toThrowError(/destroyed/i);
  });

  it('performs secret-aware redaction on nested objects, circular refs, and throwing getters', () => {
    const dummySecret = 'sk-sensitive-token-555';
    const circularObj = { name: 'test', key: dummySecret };
    circularObj.self = circularObj;

    const throwingGetterObj = {
      safe: 'ok',
      get thrower() {
        throw new Error('Getter error with ' + dummySecret);
      },
    };

    const target = {
      nested: {
        authorization: 'Bearer ' + dummySecret,
        secret_field: dummySecret,
      },
      circular: circularObj,
      getter: throwingGetterObj,
    };

    const redacted = redactSensitiveValue(target, [dummySecret]);

    const strResult = JSON.stringify(redacted);
    expect(strResult).not.toContain(dummySecret);
    expect(strResult).toContain('[REDACTED]');
  });
});
