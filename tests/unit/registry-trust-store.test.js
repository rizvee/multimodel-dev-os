import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import https from 'https';

let mockHttpsRequest = null;

vi.mock('https', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    request: (options, cb) => {
      if (mockHttpsRequest) {
        return mockHttpsRequest(options, cb);
      }
      return original.request(options, cb);
    }
  };
});
import {
  loadTrustedKeys,
  getTrustStorePath,
  serializeTrustedKeys,
  addTrustedKey,
  removeTrustedKey,
  fetchRemotePublicKey,
  syncRemoteKeys,
} from '../../src/registry/trust-store.js';
import { verifySignatureBlock } from '../../src/registry/signing.js';

const tempDir = join(process.cwd(), 'temp-trust-store-test');
const keysDir = join(tempDir, '.ai', 'registries');
const keysFile = join(keysDir, 'trusted-keys.yaml');

const EXAMPLE_KEY_1 = {
  key_id: 'official-key',
  name: 'Official Maintainer',
  algorithm: 'ed25519',
  public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=',
  scopes: ['registry', 'catalog'],
  status: 'active',
};

const EXAMPLE_KEY_2 = {
  key_id: 'secondary-key',
  name: 'Secondary Publisher',
  algorithm: 'ed25519',
  public_key: 'MCowBQYDK2VwAyEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  scopes: ['registry'],
  status: 'active',
};

// ─── loadTrustedKeys ────────────────────────────────────────────────────────

describe('Registry Trust Store — loadTrustedKeys', () => {
  beforeAll(() => {
    mkdirSync(keysDir, { recursive: true });
  });

  // Moved cleanup to file-level afterAll below

  it('returns empty array when no trusted-keys.yaml exists', () => {
    const noKeysDir = join(tempDir, 'no-keys-dir');
    mkdirSync(noKeysDir, { recursive: true });
    expect(loadTrustedKeys(noKeysDir)).toEqual([]);
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
    writeFileSync(keysFile, yamlContent, 'utf8');
    const result = loadTrustedKeys(tempDir);
    expect(result).toHaveLength(1);
    expect(result[0].key_id).toBe('official-key');
    expect(result[0].name).toBe('Official Maintainer');
  });
});

// ─── Status & Scope Validation via verifySignatureBlock ─────────────────────

describe('Registry Trust Store — Status & Scope Validation', () => {
  const trustedKeys = [
    { key_id: 'active-key',      name: 'Active',       algorithm: 'ed25519', public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=', scopes: ['registry'], status: 'active' },
    { key_id: 'disabled-key',    name: 'Disabled',     algorithm: 'ed25519', public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=', scopes: ['registry'], status: 'disabled' },
    { key_id: 'revoked-key',     name: 'Revoked',      algorithm: 'ed25519', public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=', scopes: ['registry'], status: 'revoked' },
    { key_id: 'wrong-scope-key', name: 'Wrong Scope',  algorithm: 'ed25519', public_key: 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=', scopes: ['other'],    status: 'active' },
  ];

  const makeSig = (keyId) => ({
    registry_name: 'test', publisher: 'Test', version: '1.0.0', catalog_hash: 'sha256:abc',
    signature: { algorithm: 'ed25519', key_id: keyId, signature: 'sig', signed_fields: ['registry_name', 'version', 'catalog_hash'] }
  });

  it('fails verification if key is disabled', () => {
    const res = verifySignatureBlock({ manifest: makeSig('disabled-key'), trustedKeys });
    expect(res.verified).toBe(false);
    expect(res.errors[0]).toContain('must be active');
  });

  it('fails verification if key is revoked', () => {
    const res = verifySignatureBlock({ manifest: makeSig('revoked-key'), trustedKeys });
    expect(res.verified).toBe(false);
    expect(res.errors[0]).toContain('must be active');
  });

  it('fails verification if scope does not include registry or catalog', () => {
    const res = verifySignatureBlock({ manifest: makeSig('wrong-scope-key'), trustedKeys });
    expect(res.verified).toBe(false);
    expect(res.errors[0]).toContain('does not have required scope');
  });
});

// ─── getTrustStorePath ───────────────────────────────────────────────────────

describe('Registry Trust Store — getTrustStorePath', () => {
  it('returns default path when no policy override', () => {
    const noKeyDir = join(tempDir, 'path-test');
    mkdirSync(noKeyDir, { recursive: true });
    const p = getTrustStorePath(noKeyDir);
    expect(p).toContain('trusted-keys.yaml');
    expect(p).toContain('.ai');
  });
});

// ─── serializeTrustedKeys ────────────────────────────────────────────────────

describe('Registry Trust Store — serializeTrustedKeys', () => {
  const serDir = join(tempDir, 'serialize-test');
  const serFile = join(serDir, '.ai', 'registries', 'trusted-keys.yaml');

  beforeAll(() => mkdirSync(join(serDir, '.ai', 'registries'), { recursive: true }));

  it('writes a readable YAML file with correct fields', () => {
    serializeTrustedKeys(serFile, [EXAMPLE_KEY_1]);
    const raw = readFileSync(serFile, 'utf8');
    expect(raw).toContain('trusted_publishers:');
    expect(raw).toContain('key_id: official-key');
    expect(raw).toContain('name: "Official Maintainer"');
    expect(raw).toContain('algorithm: ed25519');
    expect(raw).toContain('status: "active"');
  });

  it('round-trips — written YAML can be re-loaded by loadTrustedKeys', () => {
    serializeTrustedKeys(serFile, [EXAMPLE_KEY_1, EXAMPLE_KEY_2]);
    const loaded = loadTrustedKeys(serDir);
    expect(loaded).toHaveLength(2);
    expect(loaded[0].key_id).toBe('official-key');
    expect(loaded[1].key_id).toBe('secondary-key');
  });

  it('writes added_at and remote_source_url when present', () => {
    const keyWithMeta = { ...EXAMPLE_KEY_1, added_at: '2026-06-21T10:00:00.000Z', remote_source_url: 'https://example.com/key.pub' };
    serializeTrustedKeys(serFile, [keyWithMeta]);
    const raw = readFileSync(serFile, 'utf8');
    expect(raw).toContain('added_at: "2026-06-21T10:00:00.000Z"');
    expect(raw).toContain('remote_source_url: "https://example.com/key.pub"');
  });
});

// ─── addTrustedKey ───────────────────────────────────────────────────────────

describe('Registry Trust Store — addTrustedKey', () => {
  const addDir = join(tempDir, 'add-test');
  const addKeysDir = join(addDir, '.ai', 'registries');
  const addFile = join(addKeysDir, 'trusted-keys.yaml');

  beforeEach(() => {
    mkdirSync(addKeysDir, { recursive: true });
    if (existsSync(addFile)) rmSync(addFile);
    // Start with one key
    serializeTrustedKeys(addFile, [EXAMPLE_KEY_1]);
  });

  it('adds a new key successfully', () => {
    const result = addTrustedKey(addDir, EXAMPLE_KEY_2);
    expect(result.added).toBe(true);
    expect(result.error).toBeUndefined();
    const loaded = loadTrustedKeys(addDir);
    expect(loaded).toHaveLength(2);
    expect(loaded.find(k => k.key_id === 'secondary-key')).toBeTruthy();
  });

  it('rejects duplicate key_id', () => {
    const result = addTrustedKey(addDir, EXAMPLE_KEY_1); // same key_id
    expect(result.added).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('rejects missing required field', () => {
    const bad = { ...EXAMPLE_KEY_2, name: '' };
    const result = addTrustedKey(addDir, bad);
    expect(result.added).toBe(false);
    expect(result.error).toContain("Missing required field: 'name'");
  });

  it('rejects invalid algorithm', () => {
    const bad = { ...EXAMPLE_KEY_2, key_id: 'new-key', algorithm: 'rsa-2048' };
    const result = addTrustedKey(addDir, bad);
    expect(result.added).toBe(false);
    expect(result.error).toContain('Unsupported algorithm');
  });

  it('rejects invalid status', () => {
    const bad = { ...EXAMPLE_KEY_2, key_id: 'new-key', status: 'unknown' };
    const result = addTrustedKey(addDir, bad);
    expect(result.added).toBe(false);
    expect(result.error).toContain('Invalid status');
  });

  it('rejects key_id with unsafe characters', () => {
    const bad = { ...EXAMPLE_KEY_2, key_id: 'key with spaces!' };
    const result = addTrustedKey(addDir, bad);
    expect(result.added).toBe(false);
    expect(result.error).toContain('invalid characters');
  });

  it('rejects empty scopes array', () => {
    const bad = { ...EXAMPLE_KEY_2, key_id: 'new-key', scopes: [] };
    const result = addTrustedKey(addDir, bad);
    expect(result.added).toBe(false);
    expect(result.error).toContain("'scopes' must be a non-empty array");
  });

  it('stamps added_at automatically when not provided', () => {
    const before = Date.now();
    const result = addTrustedKey(addDir, EXAMPLE_KEY_2);
    expect(result.added).toBe(true);
    const loaded = loadTrustedKeys(addDir);
    const added = loaded.find(k => k.key_id === 'secondary-key');
    expect(added.added_at).toBeTruthy();
    const addedTs = new Date(added.added_at).getTime();
    expect(addedTs).toBeGreaterThanOrEqual(before);
  });

  it('stores remote_source_url when provided', () => {
    const keyWithSource = { ...EXAMPLE_KEY_2, remote_source_url: 'https://example.com/key.pub' };
    addTrustedKey(addDir, keyWithSource);
    const loaded = loadTrustedKeys(addDir);
    const added = loaded.find(k => k.key_id === 'secondary-key');
    expect(added.remote_source_url).toBe('https://example.com/key.pub');
  });
});

// ─── removeTrustedKey ────────────────────────────────────────────────────────

describe('Registry Trust Store — removeTrustedKey', () => {
  const removeDir = join(tempDir, 'remove-test');
  const removeKeysDir = join(removeDir, '.ai', 'registries');
  const removeFile = join(removeKeysDir, 'trusted-keys.yaml');

  beforeEach(() => {
    mkdirSync(removeKeysDir, { recursive: true });
    serializeTrustedKeys(removeFile, [EXAMPLE_KEY_1, EXAMPLE_KEY_2]);
  });

  it('removes an existing key by key_id', () => {
    const result = removeTrustedKey(removeDir, 'official-key');
    expect(result.removed).toBe(true);
    const loaded = loadTrustedKeys(removeDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].key_id).toBe('secondary-key');
  });

  it('returns error when key_id not found', () => {
    const result = removeTrustedKey(removeDir, 'nonexistent-key');
    expect(result.removed).toBe(false);
    expect(result.error).toContain("not found in the trust store");
  });

  it('returns error for empty key_id', () => {
    const result = removeTrustedKey(removeDir, '');
    expect(result.removed).toBe(false);
    expect(result.error).toContain('non-empty string');
  });

  it('leaves the remaining key intact after removal', () => {
    removeTrustedKey(removeDir, 'secondary-key');
    const loaded = loadTrustedKeys(removeDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].key_id).toBe('official-key');
    expect(loaded[0].name).toBe('Official Maintainer');
  });

  it('produces an empty trusted_publishers list when all keys are removed', () => {
    removeTrustedKey(removeDir, 'official-key');
    removeTrustedKey(removeDir, 'secondary-key');
    const loaded = loadTrustedKeys(removeDir);
    expect(loaded).toHaveLength(0);
  });
});

// ─── fetchRemotePublicKey ────────────────────────────────────────────────────

describe('Registry Trust Store — fetchRemotePublicKey (URL validation)', () => {
  it('rejects plain http:// URLs (non-localhost)', async () => {
    await expect(fetchRemotePublicKey('http://example.com/key.pub')).rejects.toThrow(/HTTPS/);
  });

  it('rejects malformed URLs', async () => {
    await expect(fetchRemotePublicKey('not-a-url')).rejects.toThrow(/Invalid URL/);
  });

  it('rejects URLs with shell-injection characters', async () => {
    await expect(fetchRemotePublicKey("https://example.com/key.pub?x=';rm -rf /")).rejects.toThrow(/unsafe characters/);
  });

  it('rejects empty string URL', async () => {
    await expect(fetchRemotePublicKey('')).rejects.toThrow(/Invalid URL/);
  });

  it('rejects ftp:// protocol', async () => {
    await expect(fetchRemotePublicKey('ftp://example.com/key.pub')).rejects.toThrow(/HTTPS/);
  });
});

describe('Registry Trust Store — syncRemoteKeys', () => {
  const syncDir = join(tempDir, 'sync-test');
  const syncKeysDir = join(syncDir, '.ai', 'registries');
  const syncFile = join(syncKeysDir, 'trusted-keys.yaml');

  beforeEach(() => {
    mkdirSync(syncKeysDir, { recursive: true });
    if (existsSync(syncFile)) rmSync(syncFile);
  });

  it('syncs keys that have remote_source_url and updates them if changed', async () => {
    const originalKey = 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=';
    const newKey = 'MCowBQYDK2VwAyEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

    const localKeys = [
      {
        key_id: 'sync-key',
        name: 'Sync Publisher',
        algorithm: 'ed25519',
        public_key: originalKey,
        scopes: ['registry'],
        status: 'active',
        remote_source_url: 'https://example.com/sync-key.pub'
      }
    ];
    serializeTrustedKeys(syncFile, localKeys);

    const mockRequest = {
      on: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };
    const mockResponse = {
      statusCode: 200,
      setEncoding: vi.fn(),
      on: (event, cb) => {
        if (event === 'data') {
          cb(Buffer.from(newKey));
        }
        if (event === 'end') {
          cb();
        }
      }
    };

    mockHttpsRequest = (options, cb) => {
      cb(mockResponse);
      return mockRequest;
    };

    try {
      const res = await syncRemoteKeys(syncDir);
      expect(res.checkedCount).toBe(1);
      expect(res.updated).toHaveLength(1);
      expect(res.updated[0].key_id).toBe('sync-key');
      expect(res.updated[0].oldKey).toBe(originalKey);
      expect(res.updated[0].newKey).toBe(newKey);

      const loaded = loadTrustedKeys(syncDir);
      expect(loaded[0].public_key).toBe(newKey);
    } finally {
      mockHttpsRequest = null;
    }
  });

  it('does not write changes to disk in dryRun mode', async () => {
    const originalKey = 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=';
    const newKey = 'MCowBQYDK2VwAyEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

    const localKeys = [
      {
        key_id: 'sync-key',
        name: 'Sync Publisher',
        algorithm: 'ed25519',
        public_key: originalKey,
        scopes: ['registry'],
        status: 'active',
        remote_source_url: 'https://example.com/sync-key.pub'
      }
    ];
    serializeTrustedKeys(syncFile, localKeys);

    const mockRequest = {
      on: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };
    const mockResponse = {
      statusCode: 200,
      setEncoding: vi.fn(),
      on: (event, cb) => {
        if (event === 'data') cb(Buffer.from(newKey));
        if (event === 'end') cb();
      }
    };

    mockHttpsRequest = (options, cb) => {
      cb(mockResponse);
      return mockRequest;
    };

    try {
      const res = await syncRemoteKeys(syncDir, { dryRun: true });
      expect(res.checkedCount).toBe(1);
      expect(res.updated).toHaveLength(1);

      const loaded = loadTrustedKeys(syncDir);
      expect(loaded[0].public_key).toBe(originalKey);
    } finally {
      mockHttpsRequest = null;
    }
  });
});

afterAll(() => {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
