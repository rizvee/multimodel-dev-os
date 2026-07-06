import { existsSync } from 'fs';
import { join } from 'path';
import {
  getDefaultRoot,
  loadSkillOsRegistries,
  SKILL_OS_REGISTRY_FILES,
  SKILL_OS_SCHEMA_FILES,
  validateSkillOs,
} from './validation.js';

function hasAllSkillOsFiles(root) {
  const requiredFiles = [
    ...SKILL_OS_SCHEMA_FILES,
    ...Object.values(SKILL_OS_REGISTRY_FILES),
  ];
  return requiredFiles.every((relPath) => existsSync(join(root, relPath)));
}

export function resolveSkillOsRoot(target = process.cwd()) {
  if (target && hasAllSkillOsFiles(target)) {
    return { root: target, usingFallback: false };
  }

  return { root: getDefaultRoot(), usingFallback: true };
}

export function getSkillOsFileManifest(root) {
  return {
    schemas: SKILL_OS_SCHEMA_FILES.map((relPath) => ({
      path: relPath,
      exists: existsSync(join(root, relPath)),
    })),
    registries: Object.values(SKILL_OS_REGISTRY_FILES).map((relPath) => ({
      path: relPath,
      exists: existsSync(join(root, relPath)),
    })),
  };
}

export function loadSkillOsData(options = {}) {
  const { root, usingFallback } = resolveSkillOsRoot(options.target || process.cwd());
  const loaded = loadSkillOsRegistries(root);
  const validation = validateSkillOs(root);

  return {
    root,
    usingFallback,
    files: getSkillOsFileManifest(root),
    registries: loaded.registries,
    validation,
    loadErrors: loaded.errors,
    loadWarnings: loaded.warnings,
  };
}
