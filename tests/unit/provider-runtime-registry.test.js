import { describe, expect, it } from 'vitest';
import { join } from 'path';
import {
  buildGatewayRegistrySnapshot,
  getProvider,
  hasProvider,
  listProviders,
} from '../../src/gateway/index.js';

const fixtureRoot = join(process.cwd(), 'tests/fixtures/gateway-registry/valid');

describe('runtime provider registry', () => {
  it('normalizes providers correctly', () => {
    const result = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });
    const provider = getProvider(result.value, 'fixture-openai');

    expect(result.success).toBe(true);
    expect(provider).toMatchObject({
      id: 'fixture-openai',
      type: 'openai-compatible',
      enabled: true,
      base_url: 'https://api.fixture.example/v1',
      credential_env: 'FIXTURE_API_KEY',
      local: false,
    });
  });

  it('supports provider lookup and filters', () => {
    const { value } = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });

    expect(hasProvider(value, 'fixture-openai')).toBe(true);
    expect(hasProvider(value, 'missing')).toBe(false);
    expect(getProvider(value, 'missing')).toBeNull();
    expect(listProviders(value, { provider_type: 'local' }).map((provider) => provider.id)).toEqual(['fixture-local']);
    expect(listProviders(value, { local: false }).map((provider) => provider.id)).toEqual(['fixture-openai']);
  });

  it('fails duplicate providers', () => {
    const result = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/duplicate-provider'),
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'duplicate_provider',
    }));
  });

  it('fails unsafe remote URLs and credential-bearing URLs', () => {
    const unsafe = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/unsafe-url'),
    });
    const credentialUrl = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/credential-url'),
    });

    expect(unsafe.success).toBe(false);
    expect(unsafe.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'unsafe_url',
    }));
    expect(credentialUrl.success).toBe(false);
    expect(credentialUrl.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'unsafe_url',
    }));
  });

  it('fails invalid credential environment names and secret-like metadata', () => {
    const invalidEnv = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/invalid-credential-env'),
    });
    const secret = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/secret-value'),
    });

    expect(invalidEnv.success).toBe(false);
    expect(invalidEnv.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'invalid_credential_env',
    }));
    expect(secret.success).toBe(false);
    expect(secret.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'secret_value',
    }));
  });

  it('fails non-local providers using localhost', () => {
    const result = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/remote-localhost'),
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'unsafe_url',
    }));
  });
});
