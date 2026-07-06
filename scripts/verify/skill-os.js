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

  if ((summary.schemas || 0) === 6) {
    pass('Skill OS schema files parse');
    pass('Skill OS guardrail schema parses');
    pass('Workflow schema parses');
  } else {
    fail(`Skill OS schema files parse count mismatch: ${summary.schemas || 0}`);
  }

  if (summary.skills > 0 && summary.promptTemplates > 0 && summary.toolPermissions > 0 && summary.agentClusters > 0 && (summary.guardrails || 0) > 0) {
    pass('Skill OS registries parse');
    pass('Skill OS guardrail registry parses');
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

  if (summary.guardrails > 0) {
    pass(`Guardrail registry entries are valid (${summary.guardrails})`);
    
    const guardrails = result.parsed.registries.guardrails || [];
    let checksExist = true;
    let restrictedConfirm = true;
    let advisoryOnly = true;

    for (const g of guardrails) {
      if (!g.check_file) {
        checksExist = false;
      }
      if (g.severity === 'restricted' && g.requires_confirmation !== true) {
        restrictedConfirm = false;
      }
      if (g.validation && g.validation.advisory_only !== true) {
        advisoryOnly = false;
      }
    }

    if (checksExist) {
      pass('Guardrail check files exist');
    } else {
      fail('Guardrail check files are missing or invalid');
    }

    if (restrictedConfirm) {
      pass('Restricted guardrails require confirmation');
    } else {
      fail('Restricted guardrails do not require confirmation');
    }

    if (advisoryOnly) {
      pass('Guardrails are advisory-only in v4.1');
    } else {
      fail('Guardrails are not advisory-only in v4.1');
    }
  } else {
    fail('Guardrail registry entries are missing');
  }

  if ((summary.workflows || 0) > 0 && (summary.workflowsWithSkillOs || 0) > 0) {
    pass(`Skill OS workflow references are valid (${summary.workflowsWithSkillOs})`);
  } else {
    fail('Skill OS workflow references are missing');
  }

  if ((summary.workflows || 0) > (summary.workflowsWithSkillOs || 0)) {
    pass('Workflow Skill OS metadata is optional');
  } else {
    fail('Workflow Skill OS metadata optionality could not be verified');
  }

  if (result.success) {
    pass('Workflow required context paths are safe');
  } else {
    fail('Workflow required context paths failed validation');
  }

  const skills = result.parsed?.registries?.skills || {};
  const promptTemplates = result.parsed?.registries?.prompt_templates || {};
  const workflows = result.parsed?.registries?.workflows || {};
  const operatorSkillIds = [
    'operator-inbox-triage',
    'operator-meeting-recap',
    'operator-kpi-snapshot',
    'operator-weekly-review',
    'operator-sop-builder',
    'operator-project-pulse',
    'operator-content-brief',
    'operator-creative-intelligence',
  ];
  const operatorWorkflowIds = [
    'operator-weekly-review',
    'operator-content-brief',
    'operator-project-pulse',
  ];

  const operatorSkillsValid = operatorSkillIds.every((id) => {
    const skill = skills[id];
    return skill
      && skill.category === 'business-operator'
      && skill.risk_level === 'low'
      && Array.isArray(skill.permissions)
      && skill.permissions.length === 1
      && skill.permissions[0] === 'draft-only';
  });

  if (operatorSkillsValid) {
    pass('Business operator skill templates are registered');
  } else {
    fail('Business operator skill templates are missing or not draft-only');
  }

  const operatorPromptsValid = operatorSkillIds.every((id) => promptTemplates[id]);

  if (operatorPromptsValid) {
    pass('Business operator prompt templates are registered');
  } else {
    fail('Business operator prompt templates are missing');
  }

  const operatorWorkflowsValid = operatorWorkflowIds.every((id) => {
    const workflow = workflows[id];
    return workflow
      && workflow.allowed_to_write_memory === false
      && workflow.allowed_to_modify_source === false
      && workflow.skill_os
      && Array.isArray(workflow.skill_os.permissions)
      && workflow.skill_os.permissions.includes('operator-draft');
  });

  if (operatorWorkflowsValid) {
    pass('Business operator workflows are validation-only');
  } else {
    fail('Business operator workflows are missing validation-only metadata');
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
