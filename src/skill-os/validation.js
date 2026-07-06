import { existsSync, readFileSync } from 'fs';
import { join, resolve, relative } from 'path';
import { parseYaml } from '../core/yaml.js';
import { sourceRoot } from '../core/globals.js';

export const VALID_PERMISSION_CLASSES = [
  'read-only',
  'draft-only',
  'write-with-confirmation',
  'restricted-admin',
];

export const VALID_RISK_LEVELS = ['low', 'medium', 'high', 'restricted'];

export const SKILL_OS_SCHEMA_FILES = [
  '.ai/schema/skill.schema.json',
  '.ai/schema/prompt-template.schema.json',
  '.ai/schema/tool-permission.schema.json',
  '.ai/schema/agent-cluster.schema.json',
];

export const SKILL_OS_REGISTRY_FILES = {
  skills: '.ai/registries/skills.yaml',
  promptTemplates: '.ai/registries/prompt-templates.yaml',
  toolPermissions: '.ai/registries/tool-permissions.yaml',
  agentClusters: '.ai/registries/agent-clusters.yaml',
};

const REQUIRED_RACE_PLUS_FIELDS = [
  'role',
  'action',
  'context',
  'expectation',
  'constraints',
  'output_format',
  'verification',
  'next_action',
];

const DANGEROUS_OPERATION_PATTERN = /\b(publish|deploy|dns|ad spend|secret|token|credential|force push|delete|remove|rotate|billing|production)\b/i;

export function getDefaultRoot() {
  if (existsSync(join(sourceRoot, 'package.json'))) {
    return sourceRoot;
  }
  const parentRoot = resolve(sourceRoot, '..');
  if (existsSync(join(parentRoot, 'package.json'))) {
    return parentRoot;
  }
  return sourceRoot;
}

function createResult() {
  return {
    success: true,
    errors: [],
    warnings: [],
    parsed: {
      schemas: {},
      registries: {},
    },
  };
}

function addError(result, message) {
  result.errors.push(message);
  result.success = false;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asObjectEntries(value) {
  return isObject(value) ? Object.entries(value) : [];
}

function hasRequiredFields(entry, fields, label, result) {
  for (const field of fields) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
      addError(result, `${label} missing required field: ${field}`);
    }
  }
}

export function isSlugSafe(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isSemverLike(value) {
  return typeof value === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value);
}

export function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  const normalized = value.replace(/\\/g, '/').trim();
  if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) return false;
  return !normalized.split('/').includes('..');
}

function pathExists(root, relPath) {
  if (!isSafeRelativePath(relPath)) return false;
  const resolved = resolve(root, relPath);
  const rel = relative(root, resolved);
  if (rel.startsWith('..') || resolve(root) === resolved && relPath !== '.') return false;
  return existsSync(resolved);
}

function validateRelativePath(root, relPath, label, result, { mustExist = true } = {}) {
  if (!isSafeRelativePath(relPath)) {
    addError(result, `${label} must be a safe relative path: ${relPath}`);
    return;
  }

  if (mustExist && !pathExists(root, relPath)) {
    addError(result, `${label} references missing file or directory: ${relPath}`);
  }
}

function validateStringArray(value, label, result) {
  if (!Array.isArray(value)) {
    addError(result, `${label} must be an array`);
    return;
  }

  for (const item of value) {
    if (typeof item !== 'string' || item.trim() === '') {
      addError(result, `${label} contains a non-string item`);
    }
  }
}

function parseJsonFile(root, relPath, result) {
  const fullPath = join(root, relPath);
  try {
    const parsed = JSON.parse(readFileSync(fullPath, 'utf8'));
    result.parsed.schemas[relPath] = parsed;
    return parsed;
  } catch (error) {
    addError(result, `${relPath} failed to parse as JSON: ${error.message}`);
    return null;
  }
}

function parseYamlFile(root, relPath, rootKey, result) {
  const fullPath = join(root, relPath);
  try {
    const parsed = parseYaml(readFileSync(fullPath, 'utf8'));
    if (!isObject(parsed)) {
      addError(result, `${relPath} failed to parse as YAML object`);
      return null;
    }
    if (!isObject(parsed[rootKey])) {
      addError(result, `${relPath} missing root key: ${rootKey}`);
      return null;
    }
    result.parsed.registries[rootKey] = parsed[rootKey];
    return parsed[rootKey];
  } catch (error) {
    addError(result, `${relPath} failed to parse as YAML: ${error.message}`);
    return null;
  }
}

function validateSchemas(root, result) {
  for (const relPath of SKILL_OS_SCHEMA_FILES) {
    validateRelativePath(root, relPath, relPath, result);
    if (pathExists(root, relPath)) {
      parseJsonFile(root, relPath, result);
    }
  }
}

function validateToolPermissions(toolPermissions, result) {
  if (!toolPermissions) return new Set();

  const knownClasses = new Set(VALID_PERMISSION_CLASSES);
  const declaredClasses = new Set();

  for (const [key, entry] of asObjectEntries(toolPermissions)) {
    const label = `tool permission '${key}'`;
    hasRequiredFields(entry, [
      'tool_id',
      'display_name',
      'class',
      'allowed_operations',
      'blocked_operations',
      'requires_confirmation',
      'requires_clean_worktree',
      'requires_validation',
      'audit_log',
    ], label, result);

    if (!isSlugSafe(entry.tool_id)) addError(result, `${label} has invalid slug id: ${entry.tool_id}`);
    if (entry.tool_id !== key) addError(result, `${label} key must match tool_id`);
    if (!knownClasses.has(entry.class)) addError(result, `${label} has invalid class: ${entry.class}`);
    declaredClasses.add(entry.class);

    validateStringArray(entry.allowed_operations, `${label} allowed_operations`, result);
    validateStringArray(entry.blocked_operations, `${label} blocked_operations`, result);

    if ((entry.class === 'restricted-admin' || entry.class === 'write-with-confirmation') && entry.requires_confirmation !== true) {
      addError(result, `${label} must require confirmation for class ${entry.class}`);
    }

    if (entry.class === 'read-only') {
      const operations = [
        ...(Array.isArray(entry.allowed_operations) ? entry.allowed_operations : []),
      ].join(' ');
      if (DANGEROUS_OPERATION_PATTERN.test(operations)) {
        addError(result, `${label} marks dangerous operations as read-only`);
      }
    }
  }

  for (const permissionClass of VALID_PERMISSION_CLASSES) {
    if (declaredClasses.has(permissionClass)) continue;
  }

  return knownClasses;
}

function validateSkills(root, skills, knownPermissionClasses, result) {
  const knownSkillIds = new Set(Object.keys(skills || {}));

  for (const [key, entry] of asObjectEntries(skills)) {
    const label = `skill '${key}'`;
    hasRequiredFields(entry, [
      'id',
      'name',
      'version',
      'description',
      'category',
      'risk_level',
      'permissions',
      'skill_file',
    ], label, result);

    if (!isSlugSafe(entry.id)) addError(result, `${label} has invalid slug id: ${entry.id}`);
    if (entry.id !== key) addError(result, `${label} key must match id`);
    if (!isSemverLike(entry.version)) addError(result, `${label} has invalid semver-like version: ${entry.version}`);
    if (!isSlugSafe(entry.category)) addError(result, `${label} has invalid category slug: ${entry.category}`);
    if (!VALID_RISK_LEVELS.includes(entry.risk_level)) addError(result, `${label} has invalid risk_level: ${entry.risk_level}`);

    if (!Array.isArray(entry.permissions) || entry.permissions.length === 0) {
      addError(result, `${label} permissions must be a non-empty array`);
    } else {
      for (const permission of entry.permissions) {
        if (!knownPermissionClasses.has(permission)) {
          addError(result, `${label} permission does not map to known tool permission class: ${permission}`);
        }
      }
    }

    validateRelativePath(root, entry.skill_file, `${label} skill_file`, result);

    for (const relPath of entry.checks || []) {
      validateRelativePath(root, relPath, `${label} check`, result);
    }

    for (const relPath of entry.required_context || []) {
      validateRelativePath(root, relPath, `${label} required_context`, result);
    }
  }

  return knownSkillIds;
}

function validatePromptTemplates(root, promptTemplates, result) {
  for (const [key, entry] of asObjectEntries(promptTemplates)) {
    const label = `prompt template '${key}'`;
    hasRequiredFields(entry, ['id', 'name', 'version', 'description', 'race_plus'], label, result);

    if (!isSlugSafe(entry.id)) addError(result, `${label} has invalid slug id: ${entry.id}`);
    if (entry.id !== key) addError(result, `${label} key must match id`);
    if (!isSemverLike(entry.version)) addError(result, `${label} has invalid semver-like version: ${entry.version}`);

    if (!isObject(entry.race_plus)) {
      addError(result, `${label} race_plus must be an object`);
      continue;
    }

    for (const field of REQUIRED_RACE_PLUS_FIELDS) {
      if (entry.race_plus[field] === undefined || entry.race_plus[field] === null || entry.race_plus[field] === '') {
        addError(result, `${label} missing RACE+ field: ${field}`);
      }
    }

    if (!Array.isArray(entry.race_plus.constraints)) {
      addError(result, `${label} race_plus.constraints must be an array`);
    }
    if (!Array.isArray(entry.race_plus.verification)) {
      addError(result, `${label} race_plus.verification must be an array`);
    }

    const requiredFiles = entry.race_plus.context && entry.race_plus.context.required_files;
    if (Array.isArray(requiredFiles)) {
      for (const relPath of requiredFiles) {
        validateRelativePath(root, relPath, `${label} required_file`, result);
      }
    }
  }
}

function validateAgentClusters(root, clusters, knownSkillIds, knownPermissionClasses, result) {
  for (const [key, entry] of asObjectEntries(clusters)) {
    const label = `agent cluster '${key}'`;
    hasRequiredFields(entry, [
      'id',
      'name',
      'description',
      'scope',
      'typical_skills',
      'allowed_tool_classes',
      'required_context',
      'outputs',
      'validation_expectations',
    ], label, result);

    if (!isSlugSafe(entry.id)) addError(result, `${label} has invalid slug id: ${entry.id}`);
    if (entry.id !== key) addError(result, `${label} key must match id`);

    validateStringArray(entry.scope, `${label} scope`, result);
    validateStringArray(entry.typical_skills, `${label} typical_skills`, result);
    validateStringArray(entry.allowed_tool_classes, `${label} allowed_tool_classes`, result);
    validateStringArray(entry.required_context, `${label} required_context`, result);
    validateStringArray(entry.outputs, `${label} outputs`, result);
    validateStringArray(entry.validation_expectations, `${label} validation_expectations`, result);

    for (const permissionClass of entry.allowed_tool_classes || []) {
      if (!knownPermissionClasses.has(permissionClass)) {
        addError(result, `${label} references invalid tool class: ${permissionClass}`);
      }
    }

    for (const skillId of entry.typical_skills || []) {
      if (!knownSkillIds.has(skillId)) {
        result.warnings.push(`${label} references planned skill id not present in skills registry: ${skillId}`);
      }
    }

    for (const relPath of entry.required_context || []) {
      validateRelativePath(root, relPath, `${label} required_context`, result);
    }
  }
}

export function loadSkillOsRegistries(root = getDefaultRoot()) {
  const result = createResult();
  const registries = {
    skills: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.skills, 'skills', result),
    promptTemplates: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.promptTemplates, 'prompt_templates', result),
    toolPermissions: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.toolPermissions, 'tool_permissions', result),
    agentClusters: parseYamlFile(root, SKILL_OS_REGISTRY_FILES.agentClusters, 'agent_clusters', result),
  };
  return { ...result, registries };
}

export function validateSkillOs(root = getDefaultRoot()) {
  const result = createResult();

  validateSchemas(root, result);

  const skills = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.skills, 'skills', result) || {};
  const promptTemplates = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.promptTemplates, 'prompt_templates', result) || {};
  const toolPermissions = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.toolPermissions, 'tool_permissions', result) || {};
  const agentClusters = parseYamlFile(root, SKILL_OS_REGISTRY_FILES.agentClusters, 'agent_clusters', result) || {};

  const knownPermissionClasses = validateToolPermissions(toolPermissions, result);
  const knownSkillIds = validateSkills(root, skills, knownPermissionClasses, result);
  validatePromptTemplates(root, promptTemplates, result);
  validateAgentClusters(root, agentClusters, knownSkillIds, knownPermissionClasses, result);

  result.summary = {
    schemas: SKILL_OS_SCHEMA_FILES.length,
    skills: Object.keys(skills).length,
    promptTemplates: Object.keys(promptTemplates).length,
    toolPermissions: Object.keys(toolPermissions).length,
    agentClusters: Object.keys(agentClusters).length,
  };

  return result;
}
