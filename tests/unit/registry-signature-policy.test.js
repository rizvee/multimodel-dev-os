import { describe, it, expect } from 'vitest';
import { verifySignatureBlock } from '../../src/registry/signing.js';

describe('Registry Signature Policy — Unsigned Registries', () => {
  const manifest = {
    registry_name: 'test-registry',
    publisher: 'Test Publisher',
    version: '1.0.0',
    catalog_hash: 'sha256:abc'
  };

  it('allows unsigned bundled registry by default', () => {
    const policy = {
      allow_unsigned_bundled: true,
      allow_unsigned_local: true,
      allow_unsigned_remote: false,
      require_signature: false
    };
    const source = { name: 'bundled', type: 'local' };
    const res = verifySignatureBlock({ manifest, policy, source });
    expect(res.verified).toBe(true);
    expect(res.status).toBe('unsigned');
  });

  it('allows unsigned local registry by default', () => {
    const policy = {
      allow_unsigned_bundled: true,
      allow_unsigned_local: true,
      allow_unsigned_remote: false,
      require_signature: false
    };
    const source = { name: 'my-local-registry', type: 'local' };
    const res = verifySignatureBlock({ manifest, policy, source });
    expect(res.verified).toBe(true);
    expect(res.status).toBe('unsigned');
  });

  it('blocks unsigned remote registry by default if allow_unsigned_remote is false', () => {
    const policy = {
      allow_unsigned_bundled: true,
      allow_unsigned_local: true,
      allow_unsigned_remote: false,
      require_signature: false
    };
    const source = { name: 'official', type: 'remote' };
    const res = verifySignatureBlock({ manifest, policy, source });
    expect(res.verified).toBe(false);
    expect(res.error).toContain('Unsigned remote registries are not allowed');
  });

  it('allows unsigned remote registry if explicitly permitted by policy', () => {
    const policy = {
      allow_unsigned_bundled: true,
      allow_unsigned_local: true,
      allow_unsigned_remote: true,
      require_signature: false
    };
    const source = { name: 'official', type: 'remote' };
    const res = verifySignatureBlock({ manifest, policy, source });
    expect(res.verified).toBe(true);
    expect(res.status).toBe('unsigned');
  });

  it('blocks unsigned registry if require_signature is true', () => {
    const policy = {
      allow_unsigned_bundled: true,
      allow_unsigned_local: true,
      allow_unsigned_remote: true,
      require_signature: true
    };
    const source = { name: 'bundled', type: 'local' };
    const res = verifySignatureBlock({ manifest, policy, source });
    expect(res.verified).toBe(false);
    expect(res.error).toContain('Signature is required by policy but missing');
  });
});

describe('Registry Signature Policy — Allowed Algorithms', () => {
  const manifest = {
    registry_name: 'test-registry',
    publisher: 'Test Publisher',
    version: '1.0.0',
    catalog_hash: 'sha256:abc',
    signature: {
      algorithm: 'rsa-sha256', // Unsupported / not allowed algorithm
      key_id: 'active-key',
      signature: 'sig',
      signed_fields: ['registry_name', 'version']
    }
  };

  it('fails verification if algorithm is not allowed', () => {
    const policy = {
      allowed_signature_algorithms: ['ed25519', 'hmac-sha256']
    };
    const res = verifySignatureBlock({ manifest, policy });
    expect(res.verified).toBe(false);
    expect(res.errors[0]).toContain('not allowed by policy');
  });
});
