import { validateSkillOs } from '../../src/skill-os/validation.js';
import { stats, GREEN, RED, YELLOW, NC } from './utils.js';
import { execFileSync } from 'child_process';

function pass(message) {
  console.log(`  ${GREEN}✓${NC} ${message}`);
  stats.pass++;
}

function fail(message) {
  console.error(`  ${RED}✗${NC} ${message}`);
  stats.fail++;
}

function warn(message) {
  console.log(`  ${YELLOW}!${NC} ${message}`);
  stats.warn++;
}

function checkCliSmoke(args, label) {
  try {
    execFileSync('node', ['bin/multimodel-dev-os.js', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    pass(label);
  } catch (error) {
    fail(`${label}: ${error.message}`);
  }
}

export function checkSkillOsValidation() {
  console.log('\nSkill OS Foundation Verification:');

  const result = validateSkillOs();
  const summary = result.summary || {};

  if ((summary.schemas || 0) === 4) {
    pass('Skill OS schema files parse');
  } else {
    fail(`Skill OS schema files parse count mismatch: ${summary.schemas || 0}`);
  }

  if (summary.skills > 0 && summary.promptTemplates > 0 && summary.toolPermissions > 0 && summary.agentClusters > 0) {
    pass('Skill OS registries parse');
  } else {
    fail('Skill OS registries parse with missing or empty registry');
  }

  if (summary.skills > 0) {
    pass(`Skill registry entries are valid (${summary.skills})`);
  } else {
    fail('Skill registry entries are missing');
  }

  if (summary.promptTemplates > 0) {
    pass(`Prompt template registry entries are valid (${summary.promptTemplates})`);
  } else {
    fail('Prompt template registry entries are missing');
  }

  if (summary.toolPermissions > 0) {
    pass(`Tool permission registry entries are valid (${summary.toolPermissions})`);
  } else {
    fail('Tool permission registry entries are missing');
  }

  if (summary.agentClusters > 0) {
    pass(`Agent cluster registry entries are valid (${summary.agentClusters})`);
  } else {
    fail('Agent cluster registry entries are missing');
  }

  for (const warning of result.warnings) {
    warn(warning);
  }

  for (const error of result.errors) {
    fail(error);
  }

  checkCliSmoke(['skill-os', 'status'], 'node bin/multimodel-dev-os.js skill-os status');
  checkCliSmoke(['skill-os', 'validate'], 'node bin/multimodel-dev-os.js skill-os validate');
  checkCliSmoke(['skill-os', 'list', 'skills'], 'node bin/multimodel-dev-os.js skill-os list skills');
  checkCliSmoke(['skill-os', 'list', 'prompts'], 'node bin/multimodel-dev-os.js skill-os list prompts');
  checkCliSmoke(['skill-os', 'list', 'permissions'], 'node bin/multimodel-dev-os.js skill-os list permissions');
  checkCliSmoke(['skill-os', 'list', 'clusters'], 'node bin/multimodel-dev-os.js skill-os list clusters');
}
