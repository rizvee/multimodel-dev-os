/**
 * Registry Trust Store
 *
 * Manages trusted publisher public keys stored in `.ai/registries/trusted-keys.yaml`
 * (or as configured in registry-policy.yaml).
 *
 * Uses Node.js built-in fs and yaml parser from the codebase.
 */

import { existsSync, readFileSync } from 'fs';
import { join, isAbsolute } from 'path';
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
