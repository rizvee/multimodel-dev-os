import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseYaml } from '../../core/yaml.js';
import { sourceRoot } from '../../core/globals.js';
import { handleScan, handleDoctor, handleVerify } from './inspection.js';
import { handleMemoryDiff, handleMemoryRefresh, handleMemoryBuild } from './memory.js';
import { handleFeedbackList, handleFeedbackSummarize } from './feedback.js';
import { handleImproveReview, handleImproveStatus, handleImproveLog } from './improve.js';

export function getWorkflowsPath(target) {
  let workflowsPath = join(target, '.ai', 'registries', 'workflows.yaml');
  let usingFallback = false;
  if (!existsSync(workflowsPath)) {
    const fallbackPath = join(sourceRoot, '.ai', 'registries', 'workflows.yaml');
    if (existsSync(fallbackPath)) {
      workflowsPath = fallbackPath;
      usingFallback = true;
    }
  }
  return { workflowsPath, usingFallback };
}

export function handleWorkflowList(options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync(workflowsPath)) {
    console.log('No workflows registry found.');
    return;
  }
  if (usingFallback) {
    console.log('\x1b[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1b[0m');
  }
  try {
    const registry = parseYaml(readFileSync(workflowsPath, 'utf8')) || {};
    const workflows = registry.workflows || {};
    console.log(`\n⚙ \x1b[36mRegistered Workflows\x1b[0m`);
    console.log('==================================================');
    Object.keys(workflows).forEach(key => {
      const wf = workflows[key];
      const name = wf.name || key;
      const risk = wf.risk_level || 'unknown';
      const riskColor = risk === 'low' ? '\x1b[32m' : risk === 'medium' ? '\x1b[33m' : '\x1b[31m';
      console.log(`\n  \x1b[34m* ${name}\x1b[0m (\x1b[35m${key}\x1b[0m)`);
      console.log(`    Description: ${wf.description || 'No description'}`);
      console.log(`    Risk Level:  ${riskColor}${risk.toUpperCase()}\x1b[0m`);
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError loading workflows: ${e.message}\x1b[0m`);
  }
}

export function handleWorkflowShow(wName, options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync(workflowsPath)) {
    console.log('No workflows registry found.');
    return;
  }
  if (usingFallback) {
    console.log('\x1b[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1b[0m');
  }
  try {
    const registry = parseYaml(readFileSync(workflowsPath, 'utf8')) || {};
    const workflows = registry.workflows || {};
    const wf = workflows[wName];
    if (!wf) {
      console.error(`\x1b[31mError: Workflow '${wName}' not found in registry.\x1b[0m`);
      process.exit(1);
    }
    const name = wf.name || wName;
    const risk = wf.risk_level || 'unknown';
    const riskColor = risk === 'low' ? '\x1b[32m' : risk === 'medium' ? '\x1b[33m' : '\x1b[31m';
    console.log(`\n⚙ \x1b[36mWorkflow Spec: ${name}\x1b[0m`);
    console.log('==================================================');
    console.log(`  Description:             ${wf.description || 'No description'}`);
    console.log(`  Risk Level:              ${riskColor}${risk.toUpperCase()}\x1b[0m`);
    console.log(`  Allowed to write memory: ${wf.allowed_to_write_memory || false}`);
    console.log(`  Allowed to modify code:  ${wf.allowed_to_modify_source || false}`);
    console.log(`\n  \x1b[33mSteps:\x1b[0m`);
    
    const steps = wf.steps || [];
    steps.forEach((step, idx) => {
      console.log(`    ${idx + 1}. [${step.name}]`);
      console.log(`       Command:         ${step.command}`);
      console.log(`       Expected Output: ${step.expected_output || 'N/A'}`);
      console.log(`       Next Action:     ${step.next_action || 'N/A'}`);
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError loading workflow '${wName}': ${e.message}\x1b[0m`);
  }
}

export function handleWorkflowPlan(wName, options) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync(workflowsPath)) {
    console.log('No workflows registry found.');
    return;
  }
  if (usingFallback) {
    console.log('\x1b[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1b[0m');
  }
  try {
    const registry = parseYaml(readFileSync(workflowsPath, 'utf8')) || {};
    const workflows = registry.workflows || {};
    const wf = workflows[wName];
    if (!wf) {
      console.error(`\x1b[31mError: Workflow '${wName}' not found.\x1b[0m`);
      process.exit(1);
    }
    const name = wf.name || wName;
    console.log(`\n📋 \x1b[36mExecution Plan for Workflow: ${name}\x1b[0m`);
    console.log('==================================================');
    console.log(`\x1b[33m[DRY-RUN/PLAN ONLY] No commands will be run.\x1b[0m\n`);
    const steps = wf.steps || [];
    steps.forEach((step, idx) => {
      console.log(`  Step ${idx + 1}: ${step.name}`);
      console.log(`    Command:         ${step.command}`);
      console.log(`    Expected Output: ${step.expected_output || 'N/A'}`);
      console.log(`    Next Action:     ${step.next_action || 'N/A'}`);
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError loading workflow plan: ${e.message}\x1b[0m`);
  }
}

export function handleWorkflowRun(wName, options, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks, getAnalysis, boundDiffMemory } = {}) {
  const { workflowsPath, usingFallback } = getWorkflowsPath(options.target);
  if (!existsSync(workflowsPath)) {
    console.log('No workflows registry found.');
    return;
  }
  if (usingFallback) {
    console.log('\x1b[33mNotice: Local workflows registry not found. Using bundled workflows registry fallback.\x1b[0m');
  }
  try {
    const registry = parseYaml(readFileSync(workflowsPath, 'utf8')) || {};
    const workflows = registry.workflows || {};
    const wf = workflows[wName];
    if (!wf) {
      console.error(`\x1b[31mError: Workflow '${wName}' not found.\x1b[0m`);
      process.exit(1);
    }

    const name = wf.name || wName;
    console.log(`\n🚀 \x1b[36mRunning Workflow: ${name}\x1b[0m`);
    console.log('==================================================');

    const steps = wf.steps || [];
    const safeCommands = {
      'scan': () => handleScan(options, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks }),
      'doctor': () => handleDoctor(options, { scanTarget, detectDependencySignals, getAnalysis, diffMemory: boundDiffMemory }),
      'verify': () => handleVerify({ ...options, noExit: true }),
      'memory diff': () => handleMemoryDiff({ ...options, noExit: true }, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks }),
      'memory refresh': () => handleMemoryRefresh(options, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks }),
      'memory build': () => handleMemoryBuild(options, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks }),
      'feedback list': () => handleFeedbackList(options),
      'feedback summarize': () => handleFeedbackSummarize(options),
      'improve review': () => handleImproveReview(options),
      'improve status': () => handleImproveStatus(options),
      'improve log': () => handleImproveLog(options),
      'doctor --release': () => handleDoctor({ ...options, release: true })
    };

    steps.forEach((step, idx) => {
      console.log(`\n\x1b[33m[Step ${idx + 1}/${steps.length}] Running: ${step.name} (${step.command})\x1b[0m`);
      const cmd = step.command;
      if (safeCommands[cmd]) {
        try {
          safeCommands[cmd]();
        } catch (e) {
          console.error(`\x1b[31mError executing step ${step.name}: ${e.message}\x1b[0m`);
        }
      } else {
        console.log(`  \x1b[35m[MANUAL ACTION NEEDED]\x1b[0m This step requires manual execution.`);
        console.log(`  Please run command: \x1b[36mnpx multimodel-dev-os ${cmd}\x1b[0m`);
        if (step.expected_output) {
          console.log(`  Expected Output:    ${step.expected_output}`);
        }
      }
    });
    console.log(`\n✔ Workflow '${name}' complete.\n`);
  } catch (e) {
    console.error(`\x1b[31mError running workflow '${wName}': ${e.message}\x1b[0m`);
  }
}
