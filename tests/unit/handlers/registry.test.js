import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-registry-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-registry-handler-test')
  };
});

import {
  handleRegistryList,
  handleRegistryAdd,
  handleRegistryRemove,
  handleRegistryShow,
  handleRegistryStatus,
  handleRegistrySync,
  handleRegistryCacheClear,
  handleRegistryLock,
  handleRegistryKeygen,
  handleRegistryVerify,
  handleRegistryTrustList,
  handleRegistryTrustShow,
  handleRegistryTrustVerify,
  handleRegistryTrustAdd,
  handleRegistryTrustRemove,
  handleRegistryTrustSync
} from '../../../src/cli/handlers/registry.js';

describe('Registry Handlers Suite', () => {
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  let logOutput = [];
  let errorOutput = [];
  let warnOutput = [];
  let exitCode = null;

  beforeAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });

    // Initialize mock .ai folders inside tempDir
    mkdirSync(join(tempDir, '.ai', 'registries'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'policies'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'registry-cache'), { recursive: true });

    // Write a mock policy file
    writeFileSync(join(tempDir, '.ai', 'policies', 'registry-policy.yaml'), `
allow_remote_registries: true
require_checksum: true
require_signature: false
allow_unsigned_remote: true
max_registry_cache_size_kb: 512
trusted_keys_file: ".ai/registries/trusted-keys.yaml"
allowed_signature_algorithms: ["ed25519", "hmac-sha256"]
`, 'utf8');

    // Write an initial sources.yaml
    writeFileSync(join(tempDir, '.ai', 'registries', 'sources.yaml'), `
sources:
  - name: "bundled"
    type: "local"
    url: ".ai/plugins/catalog.yaml"
    enabled: true
    trust_level: "trusted"
    safety_policy: "sandboxed"
    signature_required: false
    checksum_required: false
`, 'utf8');
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    logOutput = [];
    errorOutput = [];
    warnOutput = [];
    exitCode = null;

    console.log = (...args) => { logOutput.push(args.join(' ')); };
    console.error = (...args) => { errorOutput.push(args.join(' ')); };
    console.warn = (...args) => { warnOutput.push(args.join(' ')); };
    process.exit = (code) => {
      exitCode = code;
      throw new Error(`process.exit: ${code}`);
    };
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    process.exit = originalExit;
  });

  it('handleRegistryList should list sources', () => {
    handleRegistryList({ target: tempDir });
    const fullLog = logOutput.join('\n');
    expect(fullLog).toContain('Registry Sources');
    expect(fullLog).toContain('bundled');
  });

  it('handleRegistryList with --json should output JSON', () => {
    handleRegistryList({ target: tempDir, json: true });
    const parsed = JSON.parse(logOutput.join('\n'));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].name).toBe('bundled');
  });

  it('handleRegistryAdd should refuse without --approved flag', () => {
    try {
      handleRegistryAdd('test-remote', 'https://example.com/catalog.yaml', { target: tempDir });
    } catch (e) {
      expect(e.message).toContain('process.exit: 1');
    }
    expect(exitCode).toBe(1);
    expect(errorOutput.join('\n')).toContain('--approved');
  });

  it('handleRegistryAdd should add source with --approved flag', () => {
    handleRegistryAdd('test-remote', 'https://example.com/catalog.yaml', { target: tempDir, approved: true });
    expect(logOutput.join('\n')).toContain('added successfully');

    // Verify it was written to sources.yaml
    const content = readFileSync(join(tempDir, '.ai', 'registries', 'sources.yaml'), 'utf8');
    expect(content).toContain('test-remote');
  });

  it('handleRegistryShow should display detailed source info', () => {
    handleRegistryShow('test-remote', { target: tempDir });
    const fullLog = logOutput.join('\n');
    expect(fullLog).toContain('Registry Source: test-remote');
    expect(fullLog).toContain('https://example.com/catalog.yaml');
  });

  it('handleRegistryStatus should show policy and key states', () => {
    handleRegistryStatus({ target: tempDir });
    const fullLog = logOutput.join('\n');
    expect(fullLog).toContain('Registry Status');
    expect(fullLog).toContain('allow_remote_registries:');
    expect(fullLog).toContain('true');
  });

  it('handleRegistryRemove should remove a source', () => {
    handleRegistryRemove('test-remote', { target: tempDir, approved: true });
    expect(logOutput.join('\n')).toContain('removed successfully');

    const content = readFileSync(join(tempDir, '.ai', 'registries', 'sources.yaml'), 'utf8');
    expect(content).not.toContain('test-remote');
  });

  it('handleRegistryRemove should refuse to remove bundled', () => {
    try {
      handleRegistryRemove('bundled', { target: tempDir, approved: true });
    } catch (e) {
      expect(e.message).toContain('process.exit: 1');
    }
    expect(exitCode).toBe(1);
  });

  it('handleRegistryKeygen should generate and save signing key', () => {
    handleRegistryKeygen({ target: tempDir, approved: true });
    expect(logOutput.join('\n')).toContain('Signing key generated successfully');
    expect(existsSync(join(tempDir, '.ai', 'registry-signing-key'))).toBe(true);
  });

  it('handleRegistryCacheClear should clear registry cache', () => {
    const mockCacheDir = join(tempDir, '.ai', 'registry-cache', 'mock-source');
    mkdirSync(mockCacheDir, { recursive: true });
    writeFileSync(join(mockCacheDir, 'catalog.yaml'), 'dummy catalog', 'utf8');

    handleRegistryCacheClear({ approved: true });
    expect(logOutput.join('\n')).toContain('Registry cache cleared');
    expect(readFileSync(join(mockCacheDir, 'catalog.yaml'), 'utf8')).toBe('');
  });

  it('handleRegistryLock should show lock status', () => {
    // Should show no lockfile message
    handleRegistryLock({ target: tempDir });
    expect(logOutput.join('\n')).toContain('No lockfile found');

    // Create a mock lockfile
    writeFileSync(join(tempDir, '.ai', 'registry-lock.json'), JSON.stringify({
      lockfile_version: '1',
      generated_at: '2026-01-01T00:00:00Z',
      entries: {
        'mock-source': {
          url: 'https://example.com/catalog.yaml',
          synced_at: '2026-01-01T00:00:00Z',
          catalog_sha256: 'sha256:abc'
        }
      }
    }), 'utf8');

    logOutput = [];
    handleRegistryLock({ target: tempDir });
    expect(logOutput.join('\n')).toContain('mock-source');
  });

  it('handleRegistryTrustList should show trust key list', () => {
    handleRegistryTrustList({ target: tempDir });
    expect(logOutput.join('\n')).toContain('Registry Trust Store');
  });

  it('handleRegistryTrustAdd/Remove should manage trust store keys', async () => {
    await handleRegistryTrustAdd(['registry', 'trust', 'add', 'example-id'], {
      target: tempDir,
      approved: true,
      name: 'Test Publisher',
      'key-id': 'example-id',
      'public-key': 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo='
    });
    expect(logOutput.join('\n')).toContain('added successfully');

    logOutput = [];
    handleRegistryTrustShow('example-id', { target: tempDir });
    expect(logOutput.join('\n')).toContain('Test Publisher');

    logOutput = [];
    handleRegistryTrustVerify({ target: tempDir });
    expect(logOutput.join('\n')).toContain('verification passed');

    logOutput = [];
    handleRegistryTrustRemove('example-id', { target: tempDir, approved: true });
    expect(logOutput.join('\n')).toContain('removed from the trust store');
  });
});
