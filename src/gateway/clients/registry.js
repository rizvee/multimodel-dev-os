import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { sourceRoot } from '../../core/globals.js';
import { parseYaml } from '../../core/yaml.js';
import { defaultProfileFor } from './profiles.js';
import { validateGatewayClientProfile } from './validation.js';

export const DEFAULT_GATEWAY_CLIENT_REGISTRY = join('.ai', 'registries', 'gateway-clients.yaml');

function defaultRootDir() {
  if (existsSync(join(sourceRoot, DEFAULT_GATEWAY_CLIENT_REGISTRY))) return sourceRoot;
  const parent = resolve(sourceRoot, '..');
  if (existsSync(join(parent, DEFAULT_GATEWAY_CLIENT_REGISTRY))) return parent;
  return process.cwd();
}

function normalizeProfile(id, profile = {}) {
  const fallback = defaultProfileFor(id);
  return {
    ...fallback,
    ...profile,
    id: profile.id || id,
    metadata: { ...(fallback.metadata || {}), ...(profile.metadata || {}) },
  };
}

export function loadGatewayClientProfiles({ rootDir = defaultRootDir(), registryPath = DEFAULT_GATEWAY_CLIENT_REGISTRY } = {}) {
  const fullPath = join(rootDir, registryPath);
  if (!existsSync(fullPath)) {
    return { profiles: [], profilesById: {}, diagnostics: [{ code: 'missing_registry', message: 'gateway client registry not found' }] };
  }
  const parsed = parseYaml(readFileSync(fullPath, 'utf8')) || {};
  const rawProfiles = parsed.gateway_clients || [];
  const profiles = [];
  const diagnostics = [];
  const seen = new Set();
  for (const raw of rawProfiles) {
    const profile = normalizeProfile(raw.id, raw);
    if (seen.has(profile.id)) diagnostics.push({ code: 'duplicate_id', id: profile.id, message: `duplicate client id: ${profile.id}` });
    seen.add(profile.id);
    const validation = validateGatewayClientProfile(profile);
    if (!validation.success) diagnostics.push(...validation.errors.map((error) => ({ ...error, id: profile.id })));
    profiles.push(Object.freeze(profile));
  }
  const profilesById = Object.fromEntries(profiles.map((profile) => [profile.id, profile]));
  return { profiles, profilesById, diagnostics };
}

export function getGatewayClientProfile(clientId, options = {}) {
  const registry = loadGatewayClientProfiles(options);
  return registry.profilesById[clientId] || null;
}

export function listGatewayClientProfiles(options = {}) {
  return loadGatewayClientProfiles(options).profiles;
}
