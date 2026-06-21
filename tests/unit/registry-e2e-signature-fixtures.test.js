import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { verifySignatureBlock } from '../../src/registry/signing.js';
import { parseYaml } from '../../src/core/yaml.js';
import { createTrustVerdict } from '../../src/registry/verdict.js';

const fixturesDir = join(process.cwd(), 'tests', 'fixtures', 'signed-registries');

// Helper to load trust store from YAML fixture
function loadFixtureTrustedKeys() {
  const content = readFileSync(join(fixturesDir, 'trusted-keys.yaml'), 'utf8');
  const parsed = parseYaml(content);
  return parsed.trusted_publishers || [];
}

// Helper to load registry manifest from fixture
function loadFixtureManifest(folderName) {
  const content = readFileSync(join(fixturesDir, folderName, 'registry-manifest.yaml'), 'utf8');
  return parseYaml(content);
}

// Helper to load expected verdict
function loadExpectedVerdict(folderName) {
  const content = readFileSync(join(fixturesDir, folderName, 'expected-verdict.json'), 'utf8');
  return JSON.parse(content);
}

describe('Registry E2E Signatures — Fixtures Validation', () => {
  const trustedKeys = loadFixtureTrustedKeys();

  it('valid-signed-registry passes verification', () => {
    const manifest = loadFixtureManifest('valid-signed-registry');
    const policy = {
      allow_unsigned_remote: false,
      require_signature: true,
      allowed_signature_algorithms: ['ed25519']
    };
    const source = { name: 'official', type: 'remote' };

    const res = verifySignatureBlock({ manifest, trustedKeys, policy, source });
    expect(res.verified).toBe(true);
    expect(res.status).toBe('verified');

    // Create structured verdict
    const verdict = createTrustVerdict({
      source: source.name,
      source_type: source.type,
      manifest_hash_status: 'verified',
      catalog_hash_status: 'verified',
      lockfile_status: 'present',
      provenance_status: 'matched',
      signature_status: 'verified',
      trusted_publisher_status: 'trusted',
      errors: res.errors || [],
      warnings: [],
      final_status: 'trusted'
    });

    const expected = loadExpectedVerdict('valid-signed-registry');
    expect(verdict.final_status).toBe(expected.final_status);
    expect(verdict.signature_status).toBe(expected.signature_status);
    expect(verdict.trusted_publisher_status).toBe(expected.trusted_publisher_status);
  });

  it('tampered-manifest fails verification', () => {
    const manifest = loadFixtureManifest('tampered-manifest');
    const policy = {
      allow_unsigned_remote: false,
      allowed_signature_algorithms: ['ed25519']
    };
    const source = { name: 'official', type: 'remote' };

    const res = verifySignatureBlock({ manifest, trustedKeys, policy, source });
    expect(res.verified).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.errors[0]).toContain('Invalid Ed25519 signature');

    const expected = loadExpectedVerdict('tampered-manifest');
    expect(res.errors[0]).toContain(expected.errors[0]);
  });

  it('changed catalog hash fails verification', () => {
    const manifest = loadFixtureManifest('valid-signed-registry');
    // Modify catalog_hash after signing
    manifest.catalog_hash = 'sha256:1111111111111111111111111111111111111111111111111111111111111111';
    
    const policy = {
      allow_unsigned_remote: false,
      allowed_signature_algorithms: ['ed25519']
    };
    const source = { name: 'official', type: 'remote' };

    const res = verifySignatureBlock({ manifest, trustedKeys, policy, source });
    expect(res.verified).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.errors[0]).toContain('Invalid Ed25519 signature');
  });

  it('wrong trusted key fails verification', () => {
    const manifest = loadFixtureManifest('wrong-key');
    const policy = {
      allow_unsigned_remote: false,
      allowed_signature_algorithms: ['ed25519']
    };
    const source = { name: 'official', type: 'remote' };

    const res = verifySignatureBlock({ manifest, trustedKeys, policy, source });
    expect(res.verified).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.errors[0]).toContain('not found in trust store');

    const expected = loadExpectedVerdict('wrong-key');
    expect(res.errors[0]).toContain(expected.errors[0]);
  });

  it('revoked key fails verification', () => {
    const manifest = loadFixtureManifest('revoked-key');
    const policy = {
      allow_unsigned_remote: false,
      allowed_signature_algorithms: ['ed25519']
    };
    const source = { name: 'official', type: 'remote' };

    const res = verifySignatureBlock({ manifest, trustedKeys, policy, source });
    expect(res.verified).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.errors[0]).toContain('is revoked (must be active)');

    const expected = loadExpectedVerdict('revoked-key');
    expect(res.errors[0]).toContain(expected.errors[0]);
  });

  it('disabled key fails verification', () => {
    const manifest = loadFixtureManifest('valid-signed-registry');
    // Mutate the valid manifest key_id to test-key-disabled
    manifest.signature.key_id = 'test-key-disabled';
    
    const policy = {
      allow_unsigned_remote: false,
      allowed_signature_algorithms: ['ed25519']
    };
    const source = { name: 'official', type: 'remote' };

    const res = verifySignatureBlock({ manifest, trustedKeys, policy, source });
    expect(res.verified).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.errors[0]).toContain('is disabled (must be active)');
  });

  it('scope mismatch fails verification', () => {
    const manifest = loadFixtureManifest('valid-signed-registry');
    
    // Create a trust store where valid-key has scope mismatch (e.g. only 'plugin' scope)
    const customTrustedKeys = trustedKeys.map(k => {
      if (k.key_id === 'test-key-valid') {
        return { ...k, scopes: ['plugin'] };
      }
      return k;
    });

    const policy = {
      allow_unsigned_remote: false,
      allowed_signature_algorithms: ['ed25519']
    };
    const source = { name: 'official', type: 'remote' };

    const res = verifySignatureBlock({ manifest, trustedKeys: customTrustedKeys, policy, source });
    expect(res.verified).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.errors[0]).toContain('does not have required scope');
  });

  it('unsigned remote registry fails verification when allow_unsigned_remote is false', () => {
    const manifest = loadFixtureManifest('unsigned-remote-required');
    const policy = {
      allow_unsigned_remote: false,
      require_signature: false,
      allowed_signature_algorithms: ['ed25519']
    };
    const source = { name: 'official', type: 'remote' };

    const res = verifySignatureBlock({ manifest, trustedKeys, policy, source });
    expect(res.verified).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.error).toContain('Unsigned remote registries are not allowed');

    const expected = loadExpectedVerdict('unsigned-remote-required');
    expect(res.error).toContain(expected.errors[0]);
  });

  it('unsupported algorithm fails verification', () => {
    const manifest = loadFixtureManifest('unsupported-algorithm');
    const policy = {
      allow_unsigned_remote: false,
      allowed_signature_algorithms: ['ed25519', 'hmac-sha256']
    };
    const source = { name: 'official', type: 'remote' };
    const res = verifySignatureBlock({ manifest, trustedKeys, policy, source });
    expect(res.verified).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.errors[0]).toContain('Signature algorithm \'rsa-sha256\' is not allowed by policy');

    const expected = loadExpectedVerdict('unsupported-algorithm');
    expect(res.errors[0]).toContain(expected.errors[0]);
  });
});

describe('Registry CLI Integration E2E Tests', () => {
  const tempCliDir = join(process.cwd(), 'tests', 'fixtures', 'temp-cli-trust');
  const cliPath = join(process.cwd(), 'bin', 'multimodel-dev-os.js');

  beforeAll(() => {
    if (existsSync(tempCliDir)) {
      rmSync(tempCliDir, { recursive: true, force: true });
    }
    mkdirSync(join(tempCliDir, '.ai', 'registries'), { recursive: true });
    copyFileSync(
      join(fixturesDir, 'trusted-keys.yaml'),
      join(tempCliDir, '.ai', 'registries', 'trusted-keys.yaml')
    );
    copyFileSync(
      join(process.cwd(), 'examples', 'general-app', '.ai', 'config.yaml'),
      join(tempCliDir, '.ai', 'config.yaml')
    );
  });

  afterAll(() => {
    if (existsSync(tempCliDir)) {
      rmSync(tempCliDir, { recursive: true, force: true });
    }
  });

  const stripAnsi = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

  it('registry trust list outputs keys from trust store', () => {
    const rawOutput = execSync(`node ${cliPath} registry trust list --target ${tempCliDir}`, { encoding: 'utf8' });
    const output = stripAnsi(rawOutput);
    expect(output).toContain('test-key-valid');
    expect(output).toContain('test-key-revoked');
    expect(output).toContain('test-key-disabled');
    expect(output).toContain('Total Keys:       3');
  });

  it('registry trust show test-key-valid outputs correct key details', () => {
    const rawOutput = execSync(`node ${cliPath} registry trust show test-key-valid --target ${tempCliDir}`, { encoding: 'utf8' });
    const output = stripAnsi(rawOutput);
    expect(output).toContain('Key ID:         test-key-valid');
    expect(output).toContain('Publisher:      Mock Valid Publisher');
    expect(output).toContain('Algorithm:      ed25519');
    expect(output).toContain('Public Key:');
    expect(output).toContain('MCowBQYDK2VwAyE');
  });

  it('registry trust verify validates format of keys in trust store', () => {
    const rawOutput = execSync(`node ${cliPath} registry trust verify --target ${tempCliDir}`, { encoding: 'utf8' });
    const output = stripAnsi(rawOutput);
    expect(output).toContain("Key 'test-key-valid' public key format is valid.");
    expect(output).toContain("Key 'test-key-revoked' public key format is valid.");
    expect(output).toContain("Key 'test-key-disabled' public key format is valid.");
    expect(output).toContain('Trust store verification passed.');
  });

  it('registry verify bundled passes', () => {
    const rawOutput = execSync(`node ${cliPath} registry verify bundled --target ${tempCliDir}`, { encoding: 'utf8' });
    const output = stripAnsi(rawOutput);
    // Use text-only match — the ✓ checkmark may be garbled on Windows depending on CHCP
    expect(output).toContain('Verified (Implicit local trust)');
  });

  it('registry status displays security/signature policy', () => {
    const rawOutput = execSync(`node ${cliPath} registry status --target ${tempCliDir}`, { encoding: 'utf8' });
    const output = stripAnsi(rawOutput);
    expect(output).toContain('Policy State:');
    expect(output).toContain('require_signature:');
    expect(output).toContain('allow_unsigned_remote:');
  });

  it('registry sync fails safely without approval', () => {
    try {
      execSync(`node ${cliPath} registry sync official --target ${tempCliDir}`, { encoding: 'utf8', stdio: 'pipe' });
      throw new Error('Should have failed');
    } catch (err) {
      expect(err.message).toContain('Command failed');
    }
  });
});

