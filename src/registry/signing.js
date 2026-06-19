/**
 * Registry Signing — HMAC-SHA256 and Ed25519 key management + verification
 *
 * Provides project-scoped HMAC signing and public-key Ed25519 signature verification
 * for registry manifests.
 *
 * HMAC key is stored at `.ai/registry-signing-key` as a 64-char hex string
 * (32 random bytes). The file should be gitignored.
 *
 * Uses only Node.js built-in `crypto` — zero runtime dependencies.
 */

import { generateKeyPairSync, sign, verify, createHmac, timingSafeEqual, randomBytes } from 'crypto';
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

/**
 * Generate a deterministic canonical payload string from an object based on specified fields.
 * Recursively sorts keys of nested objects to ensure key order stability.
 *
 * @param {Object} data    The source object.
 * @param {string[]} fields The fields to extract and canonicalize.
 * @returns {string}       JSON-serialized canonical string.
 */
export function createCanonicalPayload(data, fields) {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object.');
  }
  if (!Array.isArray(fields)) {
    throw new Error('Fields must be an array of strings.');
  }
  const sortedFields = [...fields].sort();
  const obj = {};
  for (const field of sortedFields) {
    if (data[field] !== undefined) {
      obj[field] = data[field];
    }
  }
  return JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((sorted, k) => {
        sorted[k] = value[k];
        return sorted;
      }, {});
    }
    return value;
  });
}

/**
 * Generate an Ed25519 keypair in PEM SPKI/PKCS8 format.
 *
 * @returns {{ publicKey: string, privateKey: string }}
 */
export function generateEd25519KeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  return { publicKey, privateKey };
}

/**
 * Sign a payload using an Ed25519 private key PEM.
 *
 * @param {string} privateKey Ed25519 PEM private key string.
 * @param {string} payload    Canonical payload string.
 * @returns {string}          Base64-encoded signature.
 */
export function signEd25519Payload(privateKey, payload) {
  if (typeof privateKey !== 'string') {
    throw new Error('Private key must be a PEM string.');
  }
  if (typeof payload !== 'string') {
    throw new Error('Payload to sign must be a string.');
  }
  const signatureBuffer = sign(null, Buffer.from(payload, 'utf8'), privateKey);
  return signatureBuffer.toString('base64');
}

/**
 * Normalize a public key to ensure it is in PEM SPKI format.
 * Wraps bare base64 public keys in SPKI headers/footers if needed.
 *
 * @param {string} input  PEM public key or raw base64.
 * @returns {string}      Normalized PEM public key string.
 */
export function normalizePublicKey(input) {
  if (typeof input !== 'string') {
    throw new Error('Public key must be a string.');
  }
  let trimmed = input.trim();
  if (trimmed.startsWith('-----BEGIN PUBLIC KEY-----')) {
    return trimmed;
  }
  if (trimmed.startsWith('-----BEGIN')) {
    return trimmed;
  }
  const clean = trimmed.replace(/\s+/g, '');
  const lines = [];
  for (let i = 0; i < clean.length; i += 64) {
    lines.push(clean.slice(i, i + 64));
  }
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

/**
 * Verify an Ed25519 signature of a payload.
 *
 * @param {string} publicKey Public key in PEM or raw base64.
 * @param {string} payload   Payload that was signed.
 * @param {string} signature Base64 signature to verify.
 * @returns {boolean}        true if signature is valid, false otherwise.
 */
export function verifyEd25519Payload(publicKey, payload, signature) {
  if (typeof publicKey !== 'string' || typeof payload !== 'string' || typeof signature !== 'string') {
    return false;
  }
  try {
    const pubKey = normalizePublicKey(publicKey);
    const sigBuffer = Buffer.from(signature, 'base64');
    return verify(null, Buffer.from(payload, 'utf8'), pubKey, sigBuffer);
  } catch (_e) {
    return false;
  }
}

/**
 * Detect the signature algorithm from a signature block object.
 *
 * @param {Object} signatureBlock  The signature block.
 * @returns {string|null}          Algorithm name or null.
 */
export function detectSignatureAlgorithm(signatureBlock) {
  if (!signatureBlock || typeof signatureBlock !== 'object') {
    return null;
  }
  return signatureBlock.algorithm || null;
}

/**
 * Verify a manifest signature or signatures array block using trusted keys and policy.
 *
 * @param {Object} options
 * @param {Object} options.manifest     Parsed registry manifest object.
 * @param {Object[]} options.trustedKeys Array of trusted publishers from trust store.
 * @param {Object} [options.policy]      Policy settings.
 * @param {string|null} [options.hmacKey] Project HMAC key.
 * @param {Object} [options.source]     Source configuration for the registry.
 * @returns {{ verified: boolean, status: string, error?: string, errors?: string[], warning?: string, message?: string, verified_signatures?: Object[] }}
 */
export function verifySignatureBlock({ manifest, trustedKeys, policy = {}, hmacKey = null, source = {} }) {
  const isBundled = source.name === 'bundled';
  const isLocal = source.type === 'local';
  const isRemote = source.type === 'remote' || (!isBundled && !isLocal);

  const signatureBlocks = [];
  if (manifest.signature && typeof manifest.signature === 'object') {
    signatureBlocks.push(manifest.signature);
  }
  if (Array.isArray(manifest.signatures)) {
    signatureBlocks.push(...manifest.signatures);
  }

  if (signatureBlocks.length === 0) {
    if (policy.require_signature) {
      return { verified: false, status: 'failed', error: 'Signature is required by policy but missing from manifest.' };
    }
    if (isRemote && policy.allow_unsigned_remote === false) {
      return { verified: false, status: 'failed', error: 'Unsigned remote registries are not allowed by policy.' };
    }
    if (isBundled && policy.allow_unsigned_bundled === false) {
      return { verified: false, status: 'failed', error: 'Unsigned bundled registries are not allowed by policy.' };
    }
    if (isLocal && !isBundled && policy.allow_unsigned_local === false) {
      return { verified: false, status: 'failed', error: 'Unsigned local registries are not allowed by policy.' };
    }
    return { verified: true, status: 'unsigned', message: 'Registry is unsigned (allowed by policy).' };
  }

  let verifiedCount = 0;
  const errors = [];
  const allowedAlgs = policy.allowed_signature_algorithms || ['ed25519', 'hmac-sha256'];

  for (const sigBlock of signatureBlocks) {
    const alg = sigBlock.algorithm;
    const keyId = sigBlock.key_id;
    const signature = sigBlock.signature;
    const signedFields = sigBlock.signed_fields;

    if (!alg || !keyId || !signature || !Array.isArray(signedFields)) {
      errors.push(`Malformed signature block for key_id '${keyId || 'unknown'}'.`);
      continue;
    }

    if (!allowedAlgs.includes(alg)) {
      errors.push(`Signature algorithm '${alg}' is not allowed by policy (allowed: ${allowedAlgs.join(', ')}).`);
      continue;
    }

    if (alg === 'hmac-sha256') {
      if (!hmacKey) {
        errors.push(`HMAC key not configured locally for key_id '${keyId}'.`);
        continue;
      }
      try {
        const payload = createCanonicalPayload(manifest, signedFields);
        const expected = createHmac('sha256', Buffer.from(hmacKey, 'hex')).update(payload, 'utf8').digest('hex');
        if (timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
          verifiedCount++;
        } else {
          errors.push(`Invalid HMAC signature for key_id '${keyId}'.`);
        }
      } catch (err) {
        errors.push(`HMAC signature verification failed: ${err.message}`);
      }
    } else if (alg === 'ed25519') {
      const trustedKey = trustedKeys ? trustedKeys.find(k => k.key_id === keyId) : null;
      if (!trustedKey) {
        errors.push(`Key ID '${keyId}' not found in trust store.`);
        continue;
      }

      if (trustedKey.status !== 'active') {
        errors.push(`Key ID '${keyId}' is ${trustedKey.status} (must be active).`);
        continue;
      }

      const scopes = trustedKey.scopes || [];
      if (!scopes.includes('registry') && !scopes.includes('catalog')) {
        errors.push(`Key ID '${keyId}' does not have required scope 'registry' or 'catalog' (scopes: ${scopes.join(', ')}).`);
        continue;
      }

      try {
        const payload = createCanonicalPayload(manifest, signedFields);
        if (verifyEd25519Payload(trustedKey.public_key, payload, signature)) {
          verifiedCount++;
        } else {
          errors.push(`Invalid Ed25519 signature for key_id '${keyId}'.`);
        }
      } catch (err) {
        errors.push(`Ed25519 signature verification failed: ${err.message}`);
      }
    } else {
      errors.push(`Unsupported signature algorithm '${alg}' for key_id '${keyId}'.`);
    }
  }

  if (verifiedCount > 0) {
    return {
      verified: true,
      status: 'verified',
      verified_signatures: signatureBlocks.map(s => ({ key_id: s.key_id, algorithm: s.algorithm }))
    };
  }

  return {
    verified: false,
    status: 'failed',
    errors
  };
}
