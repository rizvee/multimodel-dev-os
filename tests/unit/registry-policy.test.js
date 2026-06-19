import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadRegistryPolicy } from '../../src/core/policy.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Registry Policy Engine', () => {
  const tempDir = join(process.cwd(), 'temp-policy-test');
  const policySubdir = join(tempDir, '.ai', 'policies');
  const policyFile = join(policySubdir, 'registry-policy.yaml');

  beforeAll(() => {
    mkdirSync(policySubdir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should load default policy fields if no file is found', () => {
    const policy = loadRegistryPolicy('non-existent-directory-random-path');
    expect(policy.allow_remote_registries).toBe(false);
    expect(policy.allow_http_localhost).toBe(false);
    expect(policy.require_checksum).toBe(true);
    expect(policy.allowed_write_roots).toEqual(['.ai/', 'adapters/']);
    expect(policy.allow_unsigned_local).toBe(true);
    expect(policy.allow_unsigned_bundled).toBe(true);
    expect(policy.allow_unsigned_remote).toBe(false);
    expect(policy.require_trusted_publisher).toBe(false);
    expect(policy.provenance_required).toBe(true);
    expect(policy.allowed_signature_algorithms).toEqual(['ed25519', 'hmac-sha256']);
  });

  it('should override default fields with written policy configurations', () => {
    const yamlConfig = `
allow_remote_registries: true
allow_http_localhost: true
require_checksum: false
max_plugin_files: 50
    `;
    writeFileSync(policyFile, yamlConfig, 'utf8');

    const policy = loadRegistryPolicy(tempDir);
    expect(policy.allow_remote_registries).toBe(true);
    expect(policy.allow_http_localhost).toBe(true);
    expect(policy.require_checksum).toBe(false);
    expect(policy.max_plugin_files).toBe(50);
    // Unspecified fields should keep defaults
    expect(policy.max_registry_cache_size_kb).toBe(512);
  });
});
