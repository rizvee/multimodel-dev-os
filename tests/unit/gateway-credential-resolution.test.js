import { describe, it, expect } from 'vitest';
import {
  resolveEnvironmentCredential,
  createResolvedCredential,
  redactSensitiveValue,
  validateProviderAdapter,
  validateExecutionError,
} from '../../src/gateway/index.js';

describe('v4.3 Sprint C Governed Credential Resolution & Redaction', () => {
  const createMockAdapter = (overrides = {}) => ({
    id: 'mock-provider',
    name: 'Mock Provider',
    type: 'openai-compatible',
    version: '1.0.0',
    capabilities: ['chat'],
    credential_env: 'MOCK_API_KEY',
    base_url: 'https://api.mock.com',
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
  });

  it('resolves environment credential from pre-authorized env var', () => {
    const adapter = createMockAdapter();
    const env = { MOCK_API_KEY: 'sk-mock-test-key-12345' };

    const result = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: env,
    });

    expect(result.success).toBe(true);
    expect(result.credential).not.toBeNull();
    expect(result.metadata.resolved).toBe(true);
    expect(result.metadata.env_var).toBe('MOCK_API_KEY');

    result.credential.withSecret((secret) => {
      expect(secret).toBe('sk-mock-test-key-12345');
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
        getOwnPropertyDescriptor(target, prop) {
          if (prop === 'APPROVED_KEY') {
            return Object.getOwnPropertyDescriptor(target, prop);
          }
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
      provider_id: 'mismatched-provider',
      provider_adapter: adapter,
      environment: env,
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('credential_reference_invalid');
    expect(accessed).toBe(false);
  });

  it('rejects env_var mismatch in credential_ref', () => {
    const adapter = createMockAdapter({ credential_env: 'ALLOWED_KEY' });

    const result = resolveEnvironmentCredential({
      credential_ref: {
        contract_version: '2026-07-15.sprint-a',
        source: 'environment',
        env_var: 'WRONG_KEY',
        required: true,
      },
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: { ALLOWED_KEY: 'secret', WRONG_KEY: 'secret2' },
    });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('credential_reference_invalid');
  });

  it('handles adapters with null credential_env cleanly', () => {
    const adapter = createMockAdapter({ credential_env: null });

    const result = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: {},
    });

    expect(result.success).toBe(true);
    expect(result.credential).toBeNull();
    expect(result.metadata.resolved).toBe(true);
    expect(result.metadata.env_var).toBeNull();
  });

  it('rejects missing required environment variables', () => {
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

  it('allows missing optional environment variables', () => {
    const adapter = createMockAdapter();

    const result = resolveEnvironmentCredential({
      credential_ref: {
        contract_version: '2026-07-15.sprint-a',
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

  it('hardens validateProviderAdapter against illegal credential_env formats', () => {
    const badAdapter1 = createMockAdapter({ credential_env: 'lowercase_var' });
    const badAdapter2 = createMockAdapter({ credential_env: '__proto__' });
    const badAdapter3 = createMockAdapter({ credential_env: 'ENV-WITH-DASH' });

    expect(validateProviderAdapter(badAdapter1).success).toBe(false);
    expect(validateProviderAdapter(badAdapter2).success).toBe(false);
    expect(validateProviderAdapter(badAdapter3).success).toBe(false);
  });

  it('Opaque Credential Container redacts raw secret in string, JSON, inspect, and spread', () => {
    const cred = createResolvedCredential({
      provider_id: 'mock-provider',
      env_var: 'MOCK_API_KEY',
      secret: 'sk-ultra-secret-value-999',
    });

    expect(String(cred)).not.includes('sk-ultra-secret-value-999');
    expect(String(cred)).includes('redacted');

    const json = JSON.stringify(cred);
    expect(json).not.includes('sk-ultra-secret-value-999');
    expect(json).includes('[REDACTED]');

    const spread = { ...cred };
    expect(spread.value).toBeUndefined();
    expect(Object.keys(spread)).not.includes('secret');

    cred.destroy();
    expect(cred.destroyed).toBe(true);

    expect(() => {
      cred.withSecret(() => {});
    }).toThrow();
  });

  it('secret-aware redaction cleans strings, objects, errors, and circular structures', () => {
    const cred = createResolvedCredential({
      provider_id: 'mock-provider',
      env_var: 'MOCK_API_KEY',
      secret: 'sk-secret-token-to-clean',
    });

    const targetObj = {
      message: 'Failed with token sk-secret-token-to-clean',
      nested: {
        path: 'F:/multimodel-dev-os/secret/file.js',
      },
    };
    targetObj.circular = targetObj;

    const redacted = redactSensitiveValue(targetObj, [cred]);

    expect(redacted.message).toBe('Failed with token [REDACTED]');
    expect(redacted.nested.path).toBe('[REDACTED_PATH]');
  });

  it('sanitizes withSecret callback error message and stack trace', () => {
    const cred = createResolvedCredential({
      provider_id: 'mock-provider',
      env_var: 'MOCK_API_KEY',
      secret: 'sk-callback-secret-456',
    });

    expect(() => {
      cred.withSecret((secret) => {
        throw new Error(`Execution error bearing ${secret}`);
      });
    }).toThrow();

    try {
      cred.withSecret((secret) => {
        throw new Error(`Execution error bearing ${secret}`);
      });
    } catch (err) {
      expect(err.message).not.includes('sk-callback-secret-456');
      expect(err.stack).not.includes('sk-callback-secret-456');
    }
  });

  it('rejects control characters, whitespace-only, and oversized credential values', () => {
    const adapter = createMockAdapter();

    const resControl = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: { MOCK_API_KEY: 'secret\r\nwith-newline' },
    });
    expect(resControl.success).toBe(false);

    const resWhitespace = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: { MOCK_API_KEY: '   ' },
    });
    expect(resWhitespace.success).toBe(false);

    const resOversized = resolveEnvironmentCredential({
      provider_id: 'mock-provider',
      provider_adapter: adapter,
      environment: { MOCK_API_KEY: 'x'.repeat(20000) },
    });
    expect(resOversized.success).toBe(false);
  });
});
