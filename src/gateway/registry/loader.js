import { existsSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { parseYaml } from '../../core/yaml.js';
import { addError, createDiagnostics, createRegistryResult } from './errors.js';
import { DEFAULT_REGISTRY_FILES } from './validation.js';

function assertInsideRoot(rootDir, relOrAbsPath, diagnostics, path) {
  if (typeof relOrAbsPath !== 'string' || !relOrAbsPath.trim()) {
    addError(diagnostics, 'invalid_source_path', path, `${path} must be a non-empty path`);
    return null;
  }
  if (relOrAbsPath.includes('\0')) {
    addError(diagnostics, 'invalid_source_path', path, `${path} contains a null byte`);
    return null;
  }
  const root = resolve(rootDir || process.cwd());
  const absolute = isAbsolute(relOrAbsPath) ? resolve(relOrAbsPath) : resolve(root, relOrAbsPath);
  const rel = relative(root, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    addError(diagnostics, 'path_traversal', path, `${path} escapes the supplied root`);
    return null;
  }
  return {
    absolute,
    relative: rel.replace(/\\/g, '/'),
  };
}

function detectDuplicateChildKeys(content, rootKey) {
  const duplicates = [];
  const seen = new Set();
  let inRoot = false;
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const rootMatch = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (rootMatch) {
      inRoot = rootMatch[1] === rootKey;
      continue;
    }
    if (!inRoot) continue;
    const childMatch = line.match(/^  ([A-Za-z0-9_.:-]+):\s*/);
    if (!childMatch) {
      if (/^\S/.test(line)) inRoot = false;
      continue;
    }
    const key = childMatch[1];
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  return duplicates;
}

function readYamlSource(rootDir, relPath, rootKey, diagnostics, label) {
  const resolved = assertInsideRoot(rootDir, relPath, diagnostics, `files.${label}`);
  if (!resolved) return { data: {}, path: null, duplicates: [] };
  if (!existsSync(resolved.absolute)) {
    addError(diagnostics, 'missing_source', `files.${label}`, `Missing registry source: ${resolved.relative}`);
    return { data: {}, path: resolved.relative, duplicates: [] };
  }
  const content = readFileSync(resolved.absolute, 'utf8');
  const duplicates = detectDuplicateChildKeys(content, rootKey);
  const data = parseYaml(content) || {};
  if (!data[rootKey]) {
    addError(diagnostics, 'invalid_source', `files.${label}`, `${resolved.relative} missing root key: ${rootKey}`);
  }
  return {
    data,
    path: resolved.relative,
    duplicates,
  };
}

export function resolveGatewayRegistryFiles({ rootDir = process.cwd(), files = {} } = {}) {
  const diagnostics = createDiagnostics();
  const resolved = {};
  for (const [key, defaultPath] of Object.entries(DEFAULT_REGISTRY_FILES)) {
    const sourcePath = files[key] || defaultPath;
    const checked = assertInsideRoot(rootDir, sourcePath, diagnostics, `files.${key}`);
    resolved[key] = checked;
  }
  return createRegistryResult(resolved, diagnostics);
}

export function loadGatewayRegistrySources({ rootDir = process.cwd(), files = {} } = {}) {
  const diagnostics = createDiagnostics();
  const root = resolve(rootDir);
  const providers = readYamlSource(root, files.providers || DEFAULT_REGISTRY_FILES.providers, 'providers', diagnostics, 'providers');
  const models = readYamlSource(root, files.models || DEFAULT_REGISTRY_FILES.models, 'models', diagnostics, 'models');
  const localModels = readYamlSource(root, files.localModels || DEFAULT_REGISTRY_FILES.localModels, 'local_engines', diagnostics, 'localModels');
  const routingPresets = readYamlSource(root, files.routingPresets || DEFAULT_REGISTRY_FILES.routingPresets, 'presets', diagnostics, 'routingPresets');

  return createRegistryResult({
    providersSource: providers.data,
    modelsSource: models.data,
    localModelsSource: localModels.data,
    routingPresetsSource: routingPresets.data,
    sourceFiles: {
      providers: providers.path,
      models: models.path,
      localModels: localModels.path,
      routingPresets: routingPresets.path,
    },
    duplicateKeys: {
      providers: providers.duplicates,
      models: models.duplicates,
      localModels: localModels.duplicates,
      routingPresets: routingPresets.duplicates,
    },
    rootDir: dirname(join(root, 'package.json')),
  }, diagnostics);
}
