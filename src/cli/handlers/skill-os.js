import { loadSkillOsData } from '../../skill-os/registry-loader.js';

const LIST_TYPES = {
  skills: {
    title: 'Skills',
    registryKey: 'skills',
    label: 'skill',
  },
  prompts: {
    title: 'Prompt Templates',
    registryKey: 'promptTemplates',
    label: 'prompt',
  },
  permissions: {
    title: 'Tool Permissions',
    registryKey: 'toolPermissions',
    label: 'permission',
  },
  clusters: {
    title: 'Agent Clusters',
    registryKey: 'agentClusters',
    label: 'cluster',
  },
};

const SHOW_TYPES = {
  skill: LIST_TYPES.skills,
  prompt: LIST_TYPES.prompts,
  permission: LIST_TYPES.permissions,
  cluster: LIST_TYPES.clusters,
};

function printNotice(data) {
  if (data.usingFallback) {
    console.log('Notice: Local Skill OS registries not found. Using bundled Skill OS registries.');
  }
}

function printList(values, indent = '') {
  for (const value of values || []) {
    console.log(`${indent}- ${value}`);
  }
}

function getRegistry(data, registryKey) {
  return data.registries[registryKey] || {};
}

function getData(options, deps) {
  const loadSkillOsDataFn = deps.loadSkillOsDataFn || loadSkillOsData;
  return loadSkillOsDataFn(options);
}

export function handleSkillOsStatus(options, deps = {}) {
  const data = getData(options, deps);
  const summary = data.validation.summary || {};

  console.log('\nSkill OS Status');
  console.log('==================================================');
  printNotice(data);
  console.log(`Schemas: ${summary.schemas || data.files.schemas.length}`);
  console.log(`Registries: ${data.files.registries.length}`);
  console.log(`Skills: ${summary.skills || 0}`);
  console.log(`Prompt templates: ${summary.promptTemplates || 0}`);
  console.log(`Tool permissions: ${summary.toolPermissions || 0}`);
  console.log(`Agent clusters: ${summary.agentClusters || 0}`);
  console.log(`Validation: ${data.validation.success ? 'passed' : 'failed'}`);
  console.log('\nRegistry files:');
  for (const file of data.files.registries) {
    console.log(`- ${file.path}`);
  }
  console.log();
}

export function handleSkillOsValidate(options, deps = {}) {
  const data = getData(options, deps);

  console.log('\nSkill OS Validation');
  console.log('==================================================');
  printNotice(data);

  if (data.validation.success) {
    console.log('Validation: passed');
  } else {
    console.log('Validation: failed');
  }

  for (const warning of data.validation.warnings || []) {
    console.warn(`Warning: ${warning}`);
  }

  for (const error of data.validation.errors || []) {
    console.error(`Error: ${error}`);
  }

  if (!data.validation.success) {
    process.exit(1);
  }

  console.log();
}

export function handleSkillOsList(type, options, deps = {}) {
  const config = LIST_TYPES[type];
  if (!config) {
    console.error('\x1b[31mError: Please specify a Skill OS list type: skills, prompts, permissions, or clusters.\x1b[0m');
    process.exit(1);
  }

  const data = getData(options, deps);
  const registry = getRegistry(data, config.registryKey);

  console.log(`\n${config.title}`);
  console.log('==================================================');
  printNotice(data);

  const ids = Object.keys(registry);
  if (ids.length === 0) {
    console.log(`No ${config.title.toLowerCase()} found.`);
  } else {
    printList(ids);
  }
  console.log();
}

export function handleSkillOsShow(type, id, options, deps = {}) {
  const config = SHOW_TYPES[type];
  if (!config) {
    console.error('\x1b[31mError: Please specify a Skill OS show type: skill, prompt, permission, or cluster.\x1b[0m');
    process.exit(1);
  }

  if (!id || id.startsWith('-')) {
    console.error(`\x1b[31mError: Please specify a ${config.label} ID.\x1b[0m`);
    process.exit(1);
  }

  const data = getData(options, deps);
  const registry = getRegistry(data, config.registryKey);
  const item = registry[id];
  if (!item) {
    console.error(`\x1b[31mError: Skill OS ${config.label} '${id}' not found.\x1b[0m`);
    process.exit(1);
  }

  if (type === 'skill') {
    printSkill(id, item, data);
  } else if (type === 'prompt') {
    printPrompt(id, item, data);
  } else if (type === 'permission') {
    printPermission(id, item, data);
  } else {
    printCluster(id, item, data);
  }
}

function printSkill(id, skill, data) {
  console.log(`\nSkill: ${id}`);
  console.log('==================================================');
  printNotice(data);
  console.log(`Name: ${skill.name || id}`);
  console.log(`Category: ${skill.category || 'unknown'}`);
  console.log(`Risk: ${skill.risk_level || 'unknown'}`);
  console.log('Permissions:');
  printList(skill.permissions, '');
  console.log(`Skill file: ${skill.skill_file || 'N/A'}`);
  if (skill.description) console.log(`Description: ${skill.description}`);
  console.log();
}

function printPrompt(id, prompt, data) {
  const race = prompt.race_plus || {};
  console.log(`\nPrompt: ${id}`);
  console.log('==================================================');
  printNotice(data);
  console.log(`Name: ${prompt.name || id}`);
  console.log(`Role: ${race.role || 'N/A'}`);
  console.log(`Action: ${race.action || 'N/A'}`);
  console.log(`Expectation: ${race.expectation || 'N/A'}`);
  console.log(`Output format: ${race.output_format || 'N/A'}`);
  console.log('Constraints:');
  printList(race.constraints, '');
  console.log('Verification:');
  printList(race.verification, '');
  console.log(`Next action: ${race.next_action || 'N/A'}`);
  console.log();
}

function printPermission(id, permission, data) {
  console.log(`\nPermission: ${id}`);
  console.log('==================================================');
  printNotice(data);
  console.log(`Display name: ${permission.display_name || id}`);
  console.log(`Class: ${permission.class || 'unknown'}`);
  console.log(`Requires confirmation: ${permission.requires_confirmation === true}`);
  console.log(`Requires clean worktree: ${permission.requires_clean_worktree === true}`);
  console.log(`Requires validation: ${permission.requires_validation === true}`);
  console.log('Allowed operations:');
  printList(permission.allowed_operations, '');
  console.log('Blocked operations:');
  printList(permission.blocked_operations, '');
  console.log();
}

function printCluster(id, cluster, data) {
  console.log(`\nCluster: ${id}`);
  console.log('==================================================');
  printNotice(data);
  console.log(`Name: ${cluster.name || id}`);
  console.log(`Description: ${cluster.description || 'N/A'}`);
  console.log('Scope:');
  printList(cluster.scope, '');
  console.log('Typical skills:');
  printList(cluster.typical_skills, '');
  console.log('Allowed tool classes:');
  printList(cluster.allowed_tool_classes, '');
  console.log();
}
