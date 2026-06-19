import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  loadSigningKey,
  generateSigningKey,
  saveSigningKey,
  signPayload,
  verifySignature,
  getSigningKeyPath
} from '../../src/registry/signing.js';

const tempDir = join(process.cwd(), 'temp-signing-test');

describe('Registry Signing — loadSigningKey', () => {
  beforeAll(() => {
    mkdirSync(join(tempDir, '.ai'), { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('returns null when no signing key file exists', () => {
    const noKeyDir = join(tempDir, 'no-key-dir');
    mkdirSync(noKeyDir, { recursive: true });
    const result = loadSigningKey(noKeyDir);
    expect(result).toBeNull();
  });

  it('returns the key string when a valid key file exists', () => {
    const validKey = 'a'.repeat(64);
    writeFileSync(join(tempDir, '.ai', 'registry-signing-key'), validKey + '\n', 'utf8');
    const result = loadSigningKey(tempDir);
    expect(result).toBe(validKey);
  });

  it('throws if the key file contains a malformed key', () => {
    const badKeyDir = join(tempDir, 'bad-key-dir');
    mkdirSync(join(badKeyDir, '.ai'), { recursive: true });
    writeFileSync(join(badKeyDir, '.ai', 'registry-signing-key'), 'too-short', 'utf8');
    expect(() => loadSigningKey(badKeyDir)).toThrow('malformed');
  });

  it('throws if the key file contains wrong-length hex', () => {
    const badKeyDir2 = join(tempDir, 'bad-key-dir2');
    mkdirSync(join(badKeyDir2, '.ai'), { recursive: true });
    // 63 hex chars — one short
    writeFileSync(join(badKeyDir2, '.ai', 'registry-signing-key'), 'a'.repeat(63), 'utf8');
    expect(() => loadSigningKey(badKeyDir2)).toThrow('malformed');
  });

  it('getSigningKeyPath returns expected path', () => {
    const expected = join(tempDir, '.ai', 'registry-signing-key');
    expect(getSigningKeyPath(tempDir)).toBe(expected);
  });
});

describe('Registry Signing — generateSigningKey + saveSigningKey', () => {
  const genDir = join(process.cwd(), 'temp-signing-gen');

  beforeAll(() => {
    mkdirSync(join(genDir, '.ai'), { recursive: true });
  });

  afterAll(() => {
    if (existsSync(genDir)) {
      rmSync(genDir, { recursive: true, force: true });
    }
  });

  it('generateSigningKey returns a 64-char lowercase hex string', () => {
    const key = generateSigningKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generateSigningKey returns different values each call (random)', () => {
    const key1 = generateSigningKey();
    const key2 = generateSigningKey();
    expect(key1).not.toBe(key2);
  });

  it('saveSigningKey writes a valid key that loadSigningKey can read back', () => {
    const key = generateSigningKey();
    saveSigningKey(genDir, key);
    const loaded = loadSigningKey(genDir);
    expect(loaded).toBe(key);
  });

  it('saveSigningKey creates .ai/ directory if it does not exist', () => {
    const freshDir = join(process.cwd(), 'temp-signing-fresh');
    try {
      const key = generateSigningKey();
      saveSigningKey(freshDir, key);
      expect(existsSync(join(freshDir, '.ai', 'registry-signing-key'))).toBe(true);
      const loaded = loadSigningKey(freshDir);
      expect(loaded).toBe(key);
    } finally {
      if (existsSync(freshDir)) {
        rmSync(freshDir, { recursive: true, force: true });
      }
    }
  });
});

describe('Registry Signing — signPayload', () => {
  const validKey = 'f'.repeat(64);

  it('returns a 64-char lowercase hex HMAC-SHA256 digest', () => {
    const sig = signPayload(validKey, 'test-payload');
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same output for the same key and payload (deterministic)', () => {
    const sig1 = signPayload(validKey, 'same-payload');
    const sig2 = signPayload(validKey, 'same-payload');
    expect(sig1).toBe(sig2);
  });

  it('produces different output for different payloads', () => {
    const sig1 = signPayload(validKey, 'payload-A');
    const sig2 = signPayload(validKey, 'payload-B');
    expect(sig1).not.toBe(sig2);
  });

  it('produces different output for different keys', () => {
    const key1 = 'a'.repeat(64);
    const key2 = 'b'.repeat(64);
    const sig1 = signPayload(key1, 'same-payload');
    const sig2 = signPayload(key2, 'same-payload');
    expect(sig1).not.toBe(sig2);
  });

  it('throws for an invalid key (non-hex)', () => {
    expect(() => signPayload('not-a-valid-key'.padEnd(64, 'z'), 'payload')).toThrow('Invalid signing key');
  });

  it('throws for an invalid key (wrong length)', () => {
    expect(() => signPayload('abc', 'payload')).toThrow('Invalid signing key');
  });

  it('throws if payload is not a string', () => {
    expect(() => signPayload(validKey, 12345)).toThrow('Payload to sign must be a string');
  });
});

describe('Registry Signing — verifySignature', () => {
  const key = 'c'.repeat(64);
  const payload = 'catalog-sha256-hash-string';

  it('returns true for a valid signature', () => {
    const sig = signPayload(key, payload);
    expect(verifySignature(key, payload, sig)).toBe(true);
  });

  it('returns false for a tampered payload', () => {
    const sig = signPayload(key, payload);
    expect(verifySignature(key, 'tampered-payload', sig)).toBe(false);
  });

  it('returns false for a wrong key', () => {
    const sig = signPayload(key, payload);
    const wrongKey = 'd'.repeat(64);
    expect(verifySignature(wrongKey, payload, sig)).toBe(false);
  });

  it('returns false for a corrupted signature', () => {
    const sig = signPayload(key, payload);
    // Flip first char
    const corruptedSig = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1);
    expect(verifySignature(key, payload, corruptedSig)).toBe(false);
  });

  it('returns false for non-string arguments', () => {
    expect(verifySignature(null, payload, 'sig')).toBe(false);
    expect(verifySignature(key, null, 'sig')).toBe(false);
    expect(verifySignature(key, payload, null)).toBe(false);
  });

  it('returns false for mismatched-length signature', () => {
    expect(verifySignature(key, payload, 'abc')).toBe(false);
  });

  it('uses timing-safe comparison — does not short-circuit on length match', () => {
    // We can't test timing directly, but we verify the correctness of the logic:
    // two sigs of equal length but different values must still return false
    const sig = signPayload(key, payload);
    const fakeMatchLength = 'e'.repeat(64); // Same 64-char hex length, wrong value
    expect(verifySignature(key, payload, fakeMatchLength)).toBe(false);
  });
});
