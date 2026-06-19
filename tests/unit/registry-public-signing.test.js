import { describe, it, expect } from 'vitest';
import {
  generateEd25519KeyPair,
  signEd25519Payload,
  verifyEd25519Payload,
  createCanonicalPayload,
  normalizePublicKey
} from '../../src/registry/signing.js';

describe('Registry Public Signing — Ed25519 Key Generation', () => {
  it('generates valid PEM format keys', () => {
    const { publicKey, privateKey } = generateEd25519KeyPair();
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(publicKey).toContain('-----END PUBLIC KEY-----');
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(privateKey).toContain('-----END PRIVATE KEY-----');
  });
});

describe('Registry Public Signing — Ed25519 Sign/Verify', () => {
  it('signs and verifies a payload successfully', () => {
    const { publicKey, privateKey } = generateEd25519KeyPair();
    const payload = 'test-canonical-payload-data';
    const signature = signEd25519Payload(privateKey, payload);

    expect(signature).toBeTruthy();
    expect(typeof signature).toBe('string');
    // Base64 signature check
    expect(signature).toMatch(/^[a-zA-Z0-9+/=]+$/);

    const verified = verifyEd25519Payload(publicKey, payload, signature);
    expect(verified).toBe(true);
  });

  it('fails verification for a tampered payload', () => {
    const { publicKey, privateKey } = generateEd25519KeyPair();
    const payload = 'original-payload';
    const signature = signEd25519Payload(privateKey, payload);

    const verified = verifyEd25519Payload(publicKey, 'tampered-payload', signature);
    expect(verified).toBe(false);
  });

  it('fails verification for an invalid signature', () => {
    const { publicKey } = generateEd25519KeyPair();
    const verified = verifyEd25519Payload(publicKey, 'payload', 'not-a-valid-base64-signature!');
    expect(verified).toBe(false);
  });

  it('fails verification with a different key', () => {
    const pairA = generateEd25519KeyPair();
    const pairB = generateEd25519KeyPair();
    const payload = 'some-payload';
    const signature = signEd25519Payload(pairA.privateKey, payload);

    const verified = verifyEd25519Payload(pairB.publicKey, payload, signature);
    expect(verified).toBe(false);
  });
});

describe('Registry Public Signing — Canonical Payload Determinism', () => {
  it('generates identical payload regardless of key insertion order', () => {
    const obj1 = { name: 'registry-a', version: '1.0.0', catalog_hash: 'hash123' };
    const obj2 = { catalog_hash: 'hash123', name: 'registry-a', version: '1.0.0' };
    const fields = ['name', 'version', 'catalog_hash'];

    const payload1 = createCanonicalPayload(obj1, fields);
    const payload2 = createCanonicalPayload(obj2, fields);

    expect(payload1).toBe(payload2);
    // Keys sorted alphabetically: catalog_hash, name, version
    const parsed = JSON.parse(payload1);
    const keys = Object.keys(parsed);
    expect(keys).toEqual(['catalog_hash', 'name', 'version']);
  });

  it('handles nested objects deterministically by sorting their keys', () => {
    const obj1 = {
      name: 'registry-b',
      metadata: { z: 3, a: 1, m: 2 }
    };
    const obj2 = {
      metadata: { a: 1, m: 2, z: 3 },
      name: 'registry-b'
    };
    const fields = ['name', 'metadata'];

    const payload1 = createCanonicalPayload(obj1, fields);
    const payload2 = createCanonicalPayload(obj2, fields);

    expect(payload1).toBe(payload2);
    expect(payload1).toContain('"metadata":{"a":1,"m":2,"z":3}');
  });
});

describe('Registry Public Signing — normalizePublicKey', () => {
  it('keeps PEM headers intact if already present', () => {
    const raw = '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=\n-----END PUBLIC KEY-----';
    expect(normalizePublicKey(raw)).toBe(raw);
  });

  it('wraps a raw base64 string into PEM format', () => {
    const raw = 'MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=';
    const normalized = normalizePublicKey(raw);
    expect(normalized).toContain('-----BEGIN PUBLIC KEY-----');
    expect(normalized).toContain('-----END PUBLIC KEY-----');
    expect(normalized.replace(/\s+/g, '')).toContain(raw);
  });
});
