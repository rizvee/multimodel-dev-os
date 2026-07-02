/**
 * Registry Trust Store
 *
 * Manages trusted publisher public keys stored in `.ai/registries/trusted-keys.yaml`
 * (or as configured in registry-policy.yaml).
 *
 * Provides read, write, and remote-fetch operations for publisher public keys.
 * All remote operations enforce HTTPS-only transport using Node.js built-in https.
 *
 * Uses only Node.js built-in modules — zero runtime dependencies.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, isAbsolute } from 'path';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { parseYaml } from '../core/yaml.js';
import { loadRegistryPolicy } from '../core/policy.js';

/**
 * Load trusted publisher keys from disk.
 *
 * @param {string} targetDir  Absolute path to project root.
 * @param {Object} [policy]   Preloaded policy (optional).
 * @returns {Object[]}        Array of trusted publisher records.
 */
export function loadTrustedKeys(targetDir, policy) {
  const pol = policy || loadRegistryPolicy(targetDir);
  const keyFile = pol.trusted_keys_file || '.ai/registries/trusted-keys.yaml';
  const filePath = isAbsolute(keyFile) ? keyFile : join(targetDir, keyFile);

  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const raw = readFileSync(filePath, 'utf8');
    const parsed = parseYaml(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.trusted_publishers)) {
      return [];
    }
    return parsed.trusted_publishers;
  } catch (_e) {
    return [];
  }
}

/**
 * Resolve the absolute path to trusted-keys.yaml for a project.
 *
 * @param {string} targetDir  Absolute path to the project root.
 * @param {Object} [policy]   Preloaded policy (optional).
 * @returns {string}          Absolute path to trusted-keys.yaml.
 */
export function getTrustStorePath(targetDir, policy) {
  const pol = policy || loadRegistryPolicy(targetDir);
  const keyFile = pol.trusted_keys_file || '.ai/registries/trusted-keys.yaml';
  return isAbsolute(keyFile) ? keyFile : join(targetDir, keyFile);
}

/**
 * Serialize a list of trusted publisher records to YAML and write to disk.
 * Produces a human-readable YAML file compatible with trusted-keys.schema.json.
 *
 * @param {string}   filePath   Absolute path to the trusted-keys.yaml to write.
 * @param {Object[]} publishers Array of trusted publisher records.
 */
export function serializeTrustedKeys(filePath, publishers) {
  const lines = [
    '# MultiModel Dev OS Trusted Keys',
    '# Stores trusted public keys for registry publisher verification.',
    "# Only active keys with matching scopes ('registry' or 'catalog') can verify signatures.",
    '# Never store private keys in this file or in this repository.',
    '',
    'trusted_publishers:',
  ];

  for (const p of publishers) {
    const scopes = (p.scopes || []).map(s => `"${s}"`).join(', ');
    lines.push(`  - key_id: ${p.key_id}`);
    lines.push(`    name: "${p.name}"`);
    lines.push(`    algorithm: ${p.algorithm}`);

    // Write public key: inline base64 if single-line, YAML block scalar if multi-line PEM
    const pk = (p.public_key || '').trim();
    if (pk.includes('\n')) {
      lines.push('    public_key: |');
      pk.split('\n').forEach(l => lines.push(`      ${l}`));
    } else {
      lines.push(`    public_key: "${pk}"`);
    }

    lines.push(`    scopes: [${scopes}]`);
    lines.push(`    status: "${p.status}"`);

    if (p.added_at) lines.push(`    added_at: "${p.added_at}"`);
    if (p.remote_source_url) lines.push(`    remote_source_url: "${p.remote_source_url}"`);
    lines.push('');
  }

  writeFileSync(filePath, lines.join('\n'), 'utf8');
}

/**
 * Add a new trusted publisher key entry to the trust store.
 * Validates required fields and checks for duplicate key_id before writing.
 *
 * @param {string} targetDir   Absolute path to the project root.
 * @param {Object} keyEntry    Trusted publisher record to add.
 * @param {Object} [policy]    Preloaded policy (optional).
 * @returns {{ added: boolean, error?: string }}
 */
export function addTrustedKey(targetDir, keyEntry, policy) {
  const required = ['key_id', 'name', 'algorithm', 'public_key', 'scopes', 'status'];
  for (const field of required) {
    if (!keyEntry[field]) {
      return { added: false, error: `Missing required field: '${field}'.` };
    }
  }

  const validAlgorithms = ['ed25519', 'hmac-sha256', 'gpg'];
  if (!validAlgorithms.includes(keyEntry.algorithm)) {
    return { added: false, error: `Unsupported algorithm '${keyEntry.algorithm}'. Allowed: ${validAlgorithms.join(', ')}.` };
  }

  const validStatuses = ['active', 'revoked', 'disabled'];
  if (!validStatuses.includes(keyEntry.status)) {
    return { added: false, error: `Invalid status '${keyEntry.status}'. Allowed: ${validStatuses.join(', ')}.` };
  }

  if (!Array.isArray(keyEntry.scopes) || keyEntry.scopes.length === 0) {
    return { added: false, error: `'scopes' must be a non-empty array (e.g. ["registry"]).` };
  }

  if (!/^[a-z0-9_-]+$/i.test(keyEntry.key_id)) {
    return { added: false, error: `key_id '${keyEntry.key_id}' contains invalid characters. Use only [a-z0-9_-].` };
  }

  const pol = policy || loadRegistryPolicy(targetDir);
  const filePath = getTrustStorePath(targetDir, pol);
  const existing = loadTrustedKeys(targetDir, pol);

  if (existing.some(k => k.key_id === keyEntry.key_id)) {
    return { added: false, error: `Key ID '${keyEntry.key_id}' already exists in the trust store. Use a unique key_id.` };
  }

  const record = {
    key_id: keyEntry.key_id,
    name: keyEntry.name,
    algorithm: keyEntry.algorithm,
    public_key: keyEntry.public_key,
    scopes: keyEntry.scopes,
    status: keyEntry.status,
    added_at: keyEntry.added_at || new Date().toISOString(),
  };
  if (keyEntry.remote_source_url) record.remote_source_url = keyEntry.remote_source_url;

  serializeTrustedKeys(filePath, [...existing, record]);
  return { added: true };
}

/**
 * Remove a trusted publisher key from the trust store by key_id.
 *
 * @param {string} targetDir  Absolute path to the project root.
 * @param {string} keyId      The key_id to remove.
 * @param {Object} [policy]   Preloaded policy (optional).
 * @returns {{ removed: boolean, error?: string }}
 */
export function removeTrustedKey(targetDir, keyId, policy) {
  if (!keyId || typeof keyId !== 'string') {
    return { removed: false, error: 'key_id must be a non-empty string.' };
  }

  const pol = policy || loadRegistryPolicy(targetDir);
  const filePath = getTrustStorePath(targetDir, pol);
  const existing = loadTrustedKeys(targetDir, pol);
  const idx = existing.findIndex(k => k.key_id === keyId);

  if (idx === -1) {
    return { removed: false, error: `Key ID '${keyId}' not found in the trust store.` };
  }

  const updated = existing.filter(k => k.key_id !== keyId);
  serializeTrustedKeys(filePath, updated);
  return { removed: true };
}

/**
 * Fetch a public key string from a remote URL.
 *
 * Security enforcements:
 *  - HTTPS-only (HTTP rejected, except localhost with allowHttp=true)
 *  - Maximum response size of 100KB
 *  - 10-second request timeout
 *  - No shell execution — uses Node.js built-in https/http modules directly
 *  - Shell-injection metacharacter blocking on URL
 *
 * @param {string}  url                 The URL to fetch the public key from.
 * @param {Object}  [options]
 * @param {boolean} [options.allowHttp] Allow http://localhost for development (default false).
 * @returns {Promise<string>}           Resolves with the raw key string.
 */
export function fetchRemotePublicKey(url, options = {}) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (_e) {
      return reject(new Error(`Invalid URL: '${url}'.`));
    }

    const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
    const isHttps = parsedUrl.protocol === 'https:';
    const isHttp = parsedUrl.protocol === 'http:';

    if (!isHttps) {
      if (isHttp && isLocalhost && options.allowHttp) {
        // Permitted: localhost HTTP for development only
      } else {
        return reject(new Error(`Remote key URLs must use HTTPS. Got: '${parsedUrl.protocol}'.`));
      }
    }

    // Block shell-injection metacharacters in URL
    if (/['"`;<>&|$*(){}[\]\\]/.test(url)) {
      return reject(new Error(`URL contains unsafe characters: '${url}'.`));
    }

    const MAX_BYTES = 100 * 1024;
    let received = 0;
    let body = '';

    const reqModule = isHttps ? httpsRequest : httpRequest;
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'multimodel-dev-os/trust-store',
        'Accept': 'text/plain,application/octet-stream',
      },
      timeout: 10000,
    };

    const req = reqModule(reqOptions, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`Remote key fetch failed: HTTP ${res.statusCode} from '${url}'.`));
      }

      res.setEncoding('utf8');
      res.on('data', chunk => {
        received += Buffer.byteLength(chunk, 'utf8');
        if (received > MAX_BYTES) {
          req.destroy();
          return reject(new Error(`Remote key response exceeded 100KB limit from '${url}'.`));
        }
        body += chunk;
      });
      res.on('end', () => {
        const trimmed = body.trim();
        if (!trimmed) {
          return reject(new Error(`Remote key fetch returned empty response from '${url}'.`));
        }
        resolve(trimmed);
      });
      res.on('error', err => reject(new Error(`Response error from '${url}': ${err.message}`)));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Remote key fetch timed out (10s) from '${url}'.`));
    });

    req.on('error', err => reject(new Error(`Request error for '${url}': ${err.message}`)));
    req.end();
  });
}

/**
 * Sync trusted keys that have a remote_source_url.
 * For each key with remote_source_url, fetches the latest public key content.
 * If the content changed, updates the public key in the trust store.
 * Returns a list of updated key records.
 *
 * @param {string} targetDir   Absolute path to the project root.
 * @param {Object} [options]
 * @param {boolean} [options.dryRun] If true, does not write changes to disk.
 * @param {boolean} [options.allowHttp] Allow HTTP localhost (default false).
 * @returns {Promise<{ updated: Object[], errors: Object[], checkedCount: number }>}
 */
export async function syncRemoteKeys(targetDir, options = {}) {
  const pol = loadRegistryPolicy(targetDir);
  const filePath = getTrustStorePath(targetDir, pol);
  const publishers = loadTrustedKeys(targetDir, pol);

  const updated = [];
  const errors = [];
  let checkedCount = 0;

  const newPublishers = [...publishers];

  for (let i = 0; i < newPublishers.length; i++) {
    const p = newPublishers[i];
    if (!p.remote_source_url) {
      continue;
    }

    checkedCount++;
    try {
      const newKey = await fetchRemotePublicKey(p.remote_source_url, { allowHttp: options.allowHttp });
      if (newKey && newKey !== p.public_key.trim()) {
        const updatedRecord = {
          ...p,
          public_key: newKey,
          added_at: new Date().toISOString()
        };
        newPublishers[i] = updatedRecord;
        updated.push({ key_id: p.key_id, oldKey: p.public_key, newKey });
      }
    } catch (err) {
      errors.push({ key_id: p.key_id, error: err.message });
    }
  }

  if (updated.length > 0 && !options.dryRun) {
    serializeTrustedKeys(filePath, newPublishers);
  }

  return { updated, errors, checkedCount };
}
