import { PROVIDER_CAPABILITIES, PROVIDER_TYPES } from '../protocol/constants.js';
import { addError } from './errors.js';

export const RUNTIME_SCHEMA_VERSION = 'gateway-registry.v1';

export const DEFAULT_REGISTRY_FILES = Object.freeze({
  providers: '.ai/models/providers.yaml',
  models: '.ai/models/registry.yaml',
  localModels: '.ai/models/local-models.yaml',
  routingPresets: '.ai/models/routing-presets.yaml',
});

export const ROUTING_PRESET_STRATEGIES = Object.freeze([
  'explicit',
  'capability',
  'cost-first',
  'latency-first',
  'context-aware',
  'local-first',
  'fallback-chain',
  'balanced',
  'user-policy',
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const ALIAS_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/;
const CREDENTIAL_ENV_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const CONTROL_OR_SHELL_PATTERN = /[\u0000-\u001f\u007f`$<>|;\\]/;
const SECRET_KEY_PATTERN = /(api[_-]?key|secret|token|password|authorization|credential|private[_-]?key)/i;
const SECRET_VALUE_PATTERN = /(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|Bearer\s+[A-Za-z0-9._-]{12,})/i;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function stableClone(value) {
  if (Array.isArray(value)) {
    return value.map(stableClone);
  }
  if (isObject(value)) {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      output[key] = stableClone(value[key]);
    }
    return output;
  }
  return value;
}

export function isSlug(value) {
  return typeof value === 'string' && SLUG_PATTERN.test(value);
}

export function isSafeAlias(value) {
  return typeof value === 'string' && ALIAS_PATTERN.test(value);
}

export function isCredentialEnvName(value) {
  return value === null || value === undefined || (typeof value === 'string' && CREDENTIAL_ENV_PATTERN.test(value));
}

export function normalizeStringArray(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

export function normalizeCapabilities(value, diagnostics, path) {
  const capabilities = [];
  const addCapability = (capability) => {
    if (!capabilities.includes(capability)) capabilities.push(capability);
  };

  if (Array.isArray(value)) {
    for (const capability of value) {
      if (!PROVIDER_CAPABILITIES.includes(capability)) {
        addError(diagnostics, 'unsupported_capability', path, `Unsupported capability: ${capability}`);
      } else {
        addCapability(capability);
      }
    }
  } else if (isObject(value)) {
    for (const [key, enabled] of Object.entries(value)) {
      if (enabled !== true) continue;
      const mapped = key === 'tool_use' ? 'tools' : key === 'structured_output' ? 'structured-output' : key;
      if (!PROVIDER_CAPABILITIES.includes(mapped)) {
        addError(diagnostics, 'unsupported_capability', `${path}.${key}`, `Unsupported capability: ${key}`);
      } else {
        addCapability(mapped);
      }
    }
  }

  return capabilities.sort();
}

export function normalizeProviderType(value, local = false) {
  if (value && PROVIDER_TYPES.includes(value)) return value;
  return local ? 'local' : 'openai-compatible';
}

export function normalizeInteger(value, diagnostics, path, { positive = false } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  const valid = Number.isInteger(number) && Number.isFinite(number) && (positive ? number > 0 : number >= 0);
  if (!valid) {
    addError(diagnostics, 'invalid_number', path, `${path} must be a finite ${positive ? 'positive' : 'non-negative'} integer`);
    return null;
  }
  return number;
}

export function normalizeNullableNumber(value, diagnostics, path) {
  if (value === undefined || value === null || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) {
    addError(diagnostics, 'invalid_number', path, `${path} must be null or a non-negative number`);
    return null;
  }
  return number;
}

function normalizeHost(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return String(value || '').toLowerCase();
  }
}

export function isLocalHost(value) {
  const host = normalizeHost(value);
  return LOCAL_HOSTS.has(host);
}

export function isPrivateHost(value) {
  const host = normalizeHost(value);
  if (isLocalHost(host)) return true;
  if (host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('169.254.')) return true;
  const octets = host.split('.').map((part) => Number.parseInt(part, 10));
  return octets.length === 4 && octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31;
}

export function validateProviderUrl(value, { local = false, path = 'base_url', diagnostics }) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || CONTROL_OR_SHELL_PATTERN.test(value)) {
    addError(diagnostics, 'unsafe_url', path, `${path} must be a URL string without shell or control characters`);
    return null;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    addError(diagnostics, 'unsafe_url', path, `${path} is malformed`);
    return null;
  }

  if (parsed.username || parsed.password) {
    addError(diagnostics, 'unsafe_url', path, `${path} must not contain embedded credentials`);
  }
  if (parsed.hash) {
    addError(diagnostics, 'unsafe_url', path, `${path} must not contain URL fragments`);
  }

  if (local) {
    if (!['http:', 'https:'].includes(parsed.protocol) || !isLocalHost(parsed.hostname)) {
      addError(diagnostics, 'unsafe_url', path, `${path} for local providers must use an approved local host`);
    }
  } else {
    if (parsed.protocol !== 'https:') {
      addError(diagnostics, 'unsafe_url', path, `${path} for remote providers must use https`);
    }
    if (isPrivateHost(parsed.hostname)) {
      addError(diagnostics, 'unsafe_url', path, `${path} for remote providers must not target local or private networks`);
    }
  }

  return parsed.toString().replace(/\/$/, '');
}

export function validateLocalEndpoint(value, diagnostics, path) {
  return validateProviderUrl(value, {
    local: true,
    path,
    diagnostics,
  });
}

export function collectSecretFindings(value, path = '$', findings = []) {
  if (typeof value === 'string') {
    if (SECRET_VALUE_PATTERN.test(value)) {
      findings.push(`${path} contains a secret-like value`);
    }
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSecretFindings(item, `${path}[${index}]`, findings));
    return findings;
  }
  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = path === '$' ? key : `${path}.${key}`;
      if (SECRET_KEY_PATTERN.test(key) && typeof child === 'string' && !CREDENTIAL_ENV_PATTERN.test(child)) {
        findings.push(`${childPath} contains a credential-like field`);
      }
      collectSecretFindings(child, childPath, findings);
    }
  }
  return findings;
}

export function validateNoSecrets(value, diagnostics, path) {
  for (const finding of collectSecretFindings(value, path)) {
    addError(diagnostics, 'secret_value', finding, 'Registry metadata must not contain secret values');
  }
}

export function sortedEntries(objectValue) {
  return Object.entries(objectValue || {}).sort(([a], [b]) => a.localeCompare(b));
}
