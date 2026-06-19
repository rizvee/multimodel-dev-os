/**
 * Registry Signing — HMAC-SHA256 key management + verification
 *
 * Provides project-scoped signing for registry catalogs.
 *
 * Signing key is stored at `.ai/registry-signing-key` as a 64-char hex string
 * (32 random bytes). The file should be gitignored.
 *
 * Signing algorithm: HMAC-SHA256
 * The "payload" signed is the SHA-256 hex of the catalog content, so the
 * signature binds the key to the exact catalog content hash.
 *
 * Uses only Node.js built-in `crypto` — zero runtime dependencies.
 */

import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'fs';
import { join, dirname } from 'path';

const SIGNING_KEY_FILENAME = 'registry-signing-key';

/**
 * Return the absolute path to the signing key file for a given project dir.
 * @param {string} targetDir  Absolute path to the project root.
 * @returns {string}
 */
export function getSigningKeyPath(targetDir) {
  return join(targetDir, '.ai', SIGNING_KEY_FILENAME);
}

/**
 * Load the project-scoped signing key from `.ai/registry-signing-key`.
 * Returns null (without throwing) if the file does not exist.
 * Throws if the file exists but contains an invalid key format.
 *
 * @param {string} targetDir  Absolute path to the project root.
 * @returns {string|null}     64-char hex key string, or null.
 */
export function loadSigningKey(targetDir) {
  const keyPath = getSigningKeyPath(targetDir);
  if (!existsSync(keyPath)) {
    return null;
  }

  const raw = readFileSync(keyPath, 'utf8').trim();

  if (!/^[0-9a-f]{64}$/.test(raw)) {
    throw new Error(
      `Signing key at '${keyPath}' is malformed. Expected a 64-character lowercase hex string (32 bytes). ` +
      `Re-generate with: npx multimodel-dev-os registry keygen --approved`
    );
  }

  return raw;
}

/**
 * Generate a new random 32-byte signing key (64-char hex).
 * @returns {string}  64-char hex string.
 */
export function generateSigningKey() {
  return randomBytes(32).toString('hex');
}

/**
 * Write a signing key to disk at the project-scoped location.
 * Creates the `.ai/` directory if it does not exist.
 * Sets file permissions to 0o600 (owner read/write only) where supported.
 *
 * @param {string} targetDir  Absolute path to the project root.
 * @param {string} key        64-char hex key string.
 */
export function saveSigningKey(targetDir, key) {
  const keyPath = getSigningKeyPath(targetDir);
  const keyDir = dirname(keyPath);

  if (!existsSync(keyDir)) {
    mkdirSync(keyDir, { recursive: true });
  }

  writeFileSync(keyPath, key + '\n', { encoding: 'utf8', mode: 0o600 });

  // Best-effort chmod on platforms that support it (no-op on Windows)
  try {
    chmodSync(keyPath, 0o600);
  } catch (_e) {}
}

/**
 * Compute HMAC-SHA256 of a payload using the provided hex key.
 *
 * @param {string} hexKey  64-char hex signing key.
 * @param {string} payload Plaintext string to sign (typically the catalog_sha256 hex).
 * @returns {string}       HMAC-SHA256 hex digest.
 */
export function signPayload(hexKey, payload) {
  if (typeof hexKey !== 'string' || !/^[0-9a-f]{64}$/.test(hexKey)) {
    throw new Error('Invalid signing key: must be a 64-character lowercase hex string.');
  }
  if (typeof payload !== 'string') {
    throw new Error('Payload to sign must be a string.');
  }

  const keyBytes = Buffer.from(hexKey, 'hex');
  return createHmac('sha256', keyBytes).update(payload, 'utf8').digest('hex');
}

/**
 * Verify that a previously computed HMAC-SHA256 signature matches the payload.
 * Uses `timingSafeEqual` to prevent timing-based side-channel attacks.
 *
 * @param {string} hexKey       64-char hex signing key.
 * @param {string} payload      Plaintext string that was signed.
 * @param {string} expectedSig  The stored HMAC-SHA256 hex digest to compare against.
 * @returns {boolean}           true if valid, false if tampered or mismatched.
 */
export function verifySignature(hexKey, payload, expectedSig) {
  if (typeof hexKey !== 'string' || typeof payload !== 'string' || typeof expectedSig !== 'string') {
    return false;
  }

  let actualSig;
  try {
    actualSig = signPayload(hexKey, payload);
  } catch (_e) {
    return false;
  }

  if (actualSig.length !== expectedSig.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(actualSig, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );
  } catch (_e) {
    return false;
  }
}
