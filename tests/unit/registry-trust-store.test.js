import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadTrustedKeys } from '../../src/registry/trust-store.js';
import { verifySignatureBlock } from '../../src/registry/signing.js';

const tempDir = join(process.cwd(), 'temp-trust-store-test');

describe('Registry Trust Store — loadTrustedKeys', () => {
  beforeAll(() => {
    mkdirSync(join(tempDir, '.ai', 'registries'), { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('returns empty array when no trusted-keys.yaml exists', () => {
    const noKeysDir = join(tempDir, 'no-keys-dir');
    mkdirSync(noKeysDir, { recursive: true });
    const result = loadTrustedKeys(noKeysDir);
    expect(result).toEqual([]);
  });

  it('returns parsed trusted keys list when trusted-keys.yaml exists', () => {
    const yamlContent = `
trusted_publishers:
  - key_id: official-key
    name: Official Maintainer
    algorithm: ed25519
    public_key: "-----BEGIN PUBLIC KEY-----\\n..."
    scopes:
      - registry
    status: active
`;
    writeFileSync(join(tempDir, '.ai', 'registries', 'trusted-keys.yaml'), yamlContent, 'utf8');
    const result = loadTrustedKeys(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0].key_id).toBe('official-key');
    expect(result[0].name).toBe('Official Maintainer');
  });
});

describe('Registry Trust Store — Status & Scope Validation', () => {
  const trustedKeys = [
    {
      key_id: 'active-key',
      name: 'Active Key',
      algorithm: 'ed25519',
      public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=',
      scopes: ['registry'],
      status: 'active'
    },
    {
      key_id: 'disabled-key',
      name: 'Disabled Key',
      algorithm: 'ed25519',
      public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=',
      scopes: ['registry'],
      status: 'disabled'
    },
    {
      key_id: 'revoked-key',
      name: 'Revoked Key',
      algorithm: 'ed25519',
      public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=',
      scopes: ['registry'],
      status: 'revoked'
    },
    {
      key_id: 'wrong-scope-key',
      name: 'Wrong Scope Key',
      algorithm: 'ed25519',
      public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=',
      scopes: ['other'],
      status: 'active'
    }
  ];

  const manifestTemplate = {
    registry_name: 'test-registry',
    publisher: 'Test Publisher',
    version: '1.0.0',
    catalog_hash: 'sha256:abc',
    signature: {
      algorithm: 'ed25519',
      key_id: 'active-key',
      signature: 'sig',
      signed_fields: ['registry_name', 'version', 'catalog_hash']
    }
  };

  it('fails verification if key is disabled', () => {
    const manifest = {
      ...manifestTemplate,
      signature: {
        ...manifestTemplate.signature,
        key_id: 'disabled-key'
      }
    };
    const res = verifySignatureBlock({ manifest, trustedKeys });
    expect(res.verified).toBe(false);
    expect(res.errors[0]).toContain('must be active');
  });

  it('fails verification if key is revoked', () => {
    const manifest = {
      ...manifestTemplate,
      signature: {
        ...manifestTemplate.signature,
        key_id: 'revoked-key'
      }
    };
    const res = verifySignatureBlock({ manifest, trustedKeys });
    expect(res.verified).toBe(false);
    expect(res.errors[0]).toContain('must be active');
  });

  it('fails verification if scope does not include registry or catalog', () => {
    const manifest = {
      ...manifestTemplate,
      signature: {
        ...manifestTemplate.signature,
        key_id: 'wrong-scope-key'
      }
    };
    const res = verifySignatureBlock({ manifest, trustedKeys });
    expect(res.verified).toBe(false);
    expect(res.errors[0]).toContain('does not have required scope');
  });
});
