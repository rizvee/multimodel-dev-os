import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  loadRegistryLockfile,
  saveRegistryLockfile,
  updateLockfileEntry,
  getLockfilePath
} from '../../src/registry/provenance.js';

const tempDir = join(process.cwd(), 'temp-provenance-test');

describe('Registry Provenance — loadRegistryLockfile', () => {
  beforeAll(() => {
    mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('returns an empty well-formed structure when no lockfile exists', () => {
    const result = loadRegistryLockfile(tempDir);
    expect(result).toEqual({
      lockfile_version: '1',
      generated_at: '',
      entries: {}
    });
  });

  it('returns empty structure if lockfile JSON is malformed', () => {
    const aiDir = join(tempDir, '.ai');
    mkdirSync(aiDir, { recursive: true });
    writeFileSync(join(aiDir, 'registry-lock.json'), 'NOT VALID JSON', 'utf8');
    const result = loadRegistryLockfile(tempDir);
    expect(result.entries).toEqual({});
  });

  it('returns empty structure if lockfile JSON has no entries field', () => {
    const aiDir = join(tempDir, '.ai');
    mkdirSync(aiDir, { recursive: true });
    writeFileSync(join(aiDir, 'registry-lock.json'), JSON.stringify({ lockfile_version: '1' }), 'utf8');
    const result = loadRegistryLockfile(tempDir);
    expect(result.entries).toEqual({});
  });
});


describe('Registry Provenance — updateLockfileEntry', () => {
  it('upserts a new entry into an empty lockfile', () => {
    const lockfile = { lockfile_version: '1', generated_at: '', entries: {} };
    const entry = {
      url: 'https://example.com/catalog.yaml',
      synced_at: '2026-01-01T00:00:00.000Z',
      catalog_sha256: 'abc123',
      manifest_sha256: null,
      signature: null,
      signature_alg: 'hmac-sha256'
    };
    updateLockfileEntry(lockfile, 'official', entry);
    expect(lockfile.entries['official']).toBeDefined();
    expect(lockfile.entries['official'].url).toBe('https://example.com/catalog.yaml');
    expect(lockfile.entries['official'].catalog_sha256).toBe('abc123');
    expect(lockfile.entries['official'].signature).toBeNull();
  });

  it('overwrites an existing entry for the same registry name', () => {
    const lockfile = {
      lockfile_version: '1',
      generated_at: '',
      entries: {
        official: {
          url: 'https://old.example.com/catalog.yaml',
          synced_at: '2025-01-01T00:00:00.000Z',
          catalog_sha256: 'oldhash',
          manifest_sha256: null,
          signature: null,
          signature_alg: 'hmac-sha256'
        }
      }
    };
    updateLockfileEntry(lockfile, 'official', {
      url: 'https://new.example.com/catalog.yaml',
      synced_at: '2026-06-01T00:00:00.000Z',
      catalog_sha256: 'newhash',
      manifest_sha256: 'mhash',
      signature: 'sig123',
      signature_alg: 'hmac-sha256'
    });
    expect(lockfile.entries['official'].catalog_sha256).toBe('newhash');
    expect(lockfile.entries['official'].signature).toBe('sig123');
    expect(lockfile.entries['official'].url).toBe('https://new.example.com/catalog.yaml');
  });

  it('stores null for optional fields when not provided', () => {
    const lockfile = { lockfile_version: '1', generated_at: '', entries: {} };
    updateLockfileEntry(lockfile, 'test', {
      url: 'https://example.com/catalog.yaml',
      catalog_sha256: 'hash1'
    });
    expect(lockfile.entries['test'].manifest_sha256).toBeNull();
    expect(lockfile.entries['test'].signature).toBeNull();
    expect(lockfile.entries['test'].signature_alg).toBe('hmac-sha256');
  });

  it('initialises entries object if missing from lockfile', () => {
    const lockfile = { lockfile_version: '1', generated_at: '' };
    updateLockfileEntry(lockfile, 'test', {
      url: 'https://example.com/catalog.yaml',
      catalog_sha256: 'hash1'
    });
    expect(lockfile.entries).toBeDefined();
    expect(lockfile.entries['test']).toBeDefined();
  });
});

describe('Registry Provenance — saveRegistryLockfile + round-trip', () => {
  const roundTripDir = join(process.cwd(), 'temp-provenance-roundtrip');

  beforeEach(() => {
    mkdirSync(roundTripDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(roundTripDir)) {
      rmSync(roundTripDir, { recursive: true, force: true });
    }
  });

  it('writes and re-reads the lockfile with correct content', () => {
    const lockfile = { lockfile_version: '1', generated_at: '', entries: {} };
    updateLockfileEntry(lockfile, 'alpha', {
      url: 'https://alpha.example.com/catalog.yaml',
      synced_at: '2026-06-01T10:00:00.000Z',
      catalog_sha256: 'deadbeef',
      manifest_sha256: 'cafe1234',
      signature: 'sig_hex_abc',
      signature_alg: 'hmac-sha256'
    });
    saveRegistryLockfile(roundTripDir, lockfile);

    const reloaded = loadRegistryLockfile(roundTripDir);
    expect(reloaded.lockfile_version).toBe('1');
    expect(reloaded.generated_at).toBeTruthy();
    expect(reloaded.entries['alpha'].catalog_sha256).toBe('deadbeef');
    expect(reloaded.entries['alpha'].signature).toBe('sig_hex_abc');
    expect(reloaded.entries['alpha'].manifest_sha256).toBe('cafe1234');
  });

  it('getLockfilePath returns the expected path', () => {
    const expectedPath = join(roundTripDir, '.ai', 'registry-lock.json');
    expect(getLockfilePath(roundTripDir)).toBe(expectedPath);
  });

  it('round-trip is idempotent for multiple saves', () => {
    const lockfile1 = { lockfile_version: '1', generated_at: '', entries: {} };
    updateLockfileEntry(lockfile1, 'beta', {
      url: 'https://beta.example.com/catalog.yaml',
      catalog_sha256: 'hash_beta'
    });
    saveRegistryLockfile(roundTripDir, lockfile1);

    const lockfile2 = loadRegistryLockfile(roundTripDir);
    updateLockfileEntry(lockfile2, 'gamma', {
      url: 'https://gamma.example.com/catalog.yaml',
      catalog_sha256: 'hash_gamma'
    });
    saveRegistryLockfile(roundTripDir, lockfile2);

    const reloaded = loadRegistryLockfile(roundTripDir);
    expect(reloaded.entries['beta'].catalog_sha256).toBe('hash_beta');
    expect(reloaded.entries['gamma'].catalog_sha256).toBe('hash_gamma');
  });
});
