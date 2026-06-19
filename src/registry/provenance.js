/**
 * Registry Provenance — Lockfile I/O
 *
 * Manages `.ai/registry-lock.json`, the tamper-evident record that captures
 * deterministic provenance for every synced registry: URL, catalog/manifest
 * hashes, sync timestamp, and optional HMAC-SHA256 signature.
 *
 * This module is pure I/O + structure. No signing logic lives here.
 * See: src/registry/signing.js for HMAC operations.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const LOCKFILE_VERSION = '1';
const LOCKFILE_FILENAME = 'registry-lock.json';

/**
 * Return the absolute path to the registry lockfile for a given project dir.
 * @param {string} targetDir  Absolute path to the project root.
 * @returns {string}
 */
export function getLockfilePath(targetDir) {
  return join(targetDir, '.ai', LOCKFILE_FILENAME);
}

/**
 * Load the registry lockfile from disk.
 * Returns a well-formed empty structure if the file does not exist or is invalid.
 *
 * @param {string} targetDir  Absolute path to the project root.
 * @returns {{ lockfile_version: string, generated_at: string, entries: Object }}
 */
export function loadRegistryLockfile(targetDir) {
  const lockfilePath = getLockfilePath(targetDir);
  const empty = { lockfile_version: LOCKFILE_VERSION, generated_at: '', entries: {} };

  if (!existsSync(lockfilePath)) {
    return empty;
  }

  try {
    const raw = readFileSync(lockfilePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.entries) {
      return empty;
    }
    // Ensure lockfile_version is present
    parsed.lockfile_version = parsed.lockfile_version || LOCKFILE_VERSION;
    return parsed;
  } catch (_e) {
    return empty;
  }
}

/**
 * Persist the lockfile to disk.
 * Creates the `.ai/` directory if it does not exist.
 *
 * @param {string} targetDir  Absolute path to the project root.
 * @param {{ lockfile_version: string, generated_at: string, entries: Object }} lockfile
 */
export function saveRegistryLockfile(targetDir, lockfile) {
  const lockfilePath = getLockfilePath(targetDir);
  const lockfileDir = dirname(lockfilePath);

  if (!existsSync(lockfileDir)) {
    mkdirSync(lockfileDir, { recursive: true });
  }

  lockfile.generated_at = new Date().toISOString();
  lockfile.lockfile_version = LOCKFILE_VERSION;

  writeFileSync(lockfilePath, JSON.stringify(lockfile, null, 2) + '\n', 'utf8');
}

/**
 * Upsert a provenance entry for a registry into the lockfile object.
 * Does NOT write to disk — call saveRegistryLockfile() after this.
 *
 * @param {{ entries: Object }} lockfile         The lockfile object to mutate.
 * @param {string}              name             Registry name key.
 * @param {ProvenanceEntry}     entry
 *
 * @typedef  {Object}      ProvenanceEntry
 * @property {string}      url              Registry URL.
 * @property {string}      synced_at        ISO 8601 timestamp of the sync.
 * @property {string}      catalog_sha256   SHA-256 hex of the downloaded catalog.yaml.
 * @property {string|null} manifest_sha256  SHA-256 hex of manifest.json (null if not downloaded).
 * @property {string|null} signature        HMAC-SHA256 hex of catalog_sha256 (null if no key).
 * @property {string}      signature_alg    Algorithm identifier (e.g. "hmac-sha256").
 */
export function updateLockfileEntry(lockfile, name, entry) {
  if (!lockfile.entries || typeof lockfile.entries !== 'object') {
    lockfile.entries = {};
  }
  lockfile.entries[name] = {
    url: entry.url,
    synced_at: entry.synced_at || new Date().toISOString(),
    catalog_sha256: entry.catalog_sha256,
    manifest_sha256: entry.manifest_sha256 ?? null,
    signature: entry.signature ?? null,
    signature_alg: entry.signature_alg || 'hmac-sha256'
  };
}
