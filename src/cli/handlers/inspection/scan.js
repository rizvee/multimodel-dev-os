import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { parseYaml } from '../../../core/yaml.js';
import { sourceRoot } from '../../../core/globals.js';
import {
  scanTarget as defaultScanTarget,
  detectFrameworkSignals as defaultDetectFrameworkSignals,
  detectDependencySignals as defaultDetectDependencySignals,
  detectAiDevOsSignals as defaultDetectAiDevOsSignals,
  detectRisks as defaultDetectRisks
} from '../../../core/analysis.js';

export function handleScan(options, { scanTarget = defaultScanTarget, detectFrameworkSignals = defaultDetectFrameworkSignals, detectDependencySignals = defaultDetectDependencySignals, detectAiDevOsSignals = defaultDetectAiDevOsSignals, detectRisks = defaultDetectRisks } = {}) {
  console.log(`\n🔍 \x1b[36mCodebase Scan target: ${options.target}\x1b[0m`);
  console.log('==================================================');
  
  const { files, ignoredCount } = scanTarget(options.target);
  const frameworkSignals = detectFrameworkSignals(files, options.target);
  const dependencySignals = detectDependencySignals(files, options.target);
  const aiDevOsSignals = detectAiDevOsSignals(files);
  const risks = detectRisks(files, options.target);
  
  console.log(`\n\x1b[33mProject Stats:\x1b[0m`);
  console.log(`  File Count:    ${files.length}`);
  console.log(`  Ignored Files: ${ignoredCount}`);
  
  console.log(`\n\x1b[33mFramework & Language Signals:\x1b[0m`);
  frameworkSignals.forEach(sig => console.log(`  - ${sig}`));
  
  console.log(`\n\x1b[33mPackage Manager & Dependency Signals:\x1b[0m`);
  dependencySignals.forEach(sig => console.log(`  - ${sig}`));
  
  console.log(`\n\x1b[33mMultiModel Dev OS Files:\x1b[0m`);
  if (aiDevOsSignals.length > 0) {
    aiDevOsSignals.forEach(sig => console.log(`  - ${sig}`));
  } else {
    console.log(`  No MultiModel Dev OS files detected. Run \x1b[36mmit --template general-app\x1b[0m to initialize.`);
  }
  
  if (risks.length > 0) {
    console.log(`\n\x1b[31mDetected Risks:\x1b[0m`);
    risks.forEach(r => console.log(`  - [${r.severity.toUpperCase()}] ${r.file_pattern}: ${r.risk_description}`));
  } else {
    console.log(`\n\x1b[32m✔ No high/medium risks detected in repository structure.\x1b[0m`);
  }
  
  console.log();
}

export function handleStatus(options, { scanTarget = defaultScanTarget, detectFrameworkSignals = defaultDetectFrameworkSignals, detectDependencySignals = defaultDetectDependencySignals, diffMemory } = {}) {
  console.log(`\n📊 \x1b[36mRepository Intelligence Status: ${options.target}\x1b[0m`);
  console.log('==================================================');

  // 1. Project Info
  let pkgName = 'unknown';
  let pkgVersion = 'unknown';
  try {
    const pkgPath = join(options.target, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      pkgName = pkg.name || pkgName;
      pkgVersion = pkg.version || pkgVersion;
    }
  } catch (e) {}
  console.log(`  \x1b[33mProject Info:\x1b[0m`);
  console.log(`    Package Name:    ${pkgName}`);
  console.log(`    Package Version: ${pkgVersion}`);

  // 2. Framework signals
  const { files } = scanTarget(options.target);
  const frameworkSignals = detectFrameworkSignals(files, options.target);
  const dependencySignals = detectDependencySignals(files, options.target);
  console.log(`  \x1b[33mFramework & Dependency Signals:\x1b[0m`);
  console.log(`    Frameworks:      ${frameworkSignals.join(', ') || 'None'}`);
  console.log(`    Dependencies:    ${dependencySignals.join(', ') || 'None'}`);

  // 3. Memory status
  const memoryHashPath = join(options.target, '.ai', 'intelligence', 'memory.hash.json');
  let memoryStatus = '\x1b[31mMISSING\x1b[0m';
  let lastBuildTime = 'N/A';
  if (existsSync(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync(memoryHashPath, 'utf8'));
      lastBuildTime = memObj.generated_at || 'N/A';
      const diff = diffMemory(options.target);
      if (diff) {
        if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
          memoryStatus = '\x1b[32mCURRENT\x1b[0m';
        } else {
          memoryStatus = `\x1b[33mSTALE\x1b[0m (changes: +${diff.added.length}, -${diff.removed.length}, ~${diff.changed.length})`;
        }
      }
    } catch (e) {
      memoryStatus = '\x1b[31mCORRUPT\x1b[0m';
    }
  }
  console.log(`  \x1b[33mMemory State:\x1b[0m`);
  console.log(`    Status:          ${memoryStatus}`);
  console.log(`    Last Built:      ${lastBuildTime}`);

  // 4. Feedback & Rules
  const feedbackPath = join(options.target, '.ai', 'intelligence', 'feedback-log.jsonl');
  let feedbackCount = 0;
  if (existsSync(feedbackPath)) {
    try {
      feedbackCount = readFileSync(feedbackPath, 'utf8').trim().split(/\r?\n/).filter(l => l.trim() !== '').length;
    } catch (e) {}
  }
  const rulesPath = join(options.target, '.ai', 'intelligence', 'learning-rules.md');
  const rulesStatus = existsSync(rulesPath) ? '\x1b[32mPRESENT\x1b[0m' : '\x1b[31mMISSING\x1b[0m';
  console.log(`  \x1b[33mFeedback Loop & Rules:\x1b[0m`);
  console.log(`    Feedback Count:  ${feedbackCount}`);
  console.log(`    Learning Rules:  ${rulesStatus}`);

  // 5. Proposals Engine
  const proposalsDir = join(options.target, '.ai', 'proposals');
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let totalProposals = 0;
  if (existsSync(proposalsDir)) {
    try {
      const propFiles = readdirSync(proposalsDir).filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
      totalProposals = propFiles.length;
      propFiles.forEach(file => {
        const content = readFileSync(join(proposalsDir, file), 'utf8');
        const fmMatch = content.match(/^---([\s\S]*?)---/);
        if (fmMatch) {
          const yamlData = fmMatch[1];
          let status = 'pending';
          const statusMatch = yamlData.match(/approval_status:\s*(\w+)/);
          if (statusMatch) status = statusMatch[1];
          if (status === 'approved') approvedCount++;
          else if (status === 'rejected') rejectedCount++;
          else pendingCount++;
        }
      });
    } catch (e) {}
  }
  console.log(`  \x1b[33mImprovement Proposals:\x1b[0m`);
  console.log(`    Total proposals: ${totalProposals}`);
  console.log(`    Pending:         \x1b[33m${pendingCount}\x1b[0m`);
  console.log(`    Approved:        \x1b[32m${approvedCount}\x1b[0m`);
  console.log(`    Rejected:        \x1b[31m${rejectedCount}\x1b[0m`);

  // 6. Apply Log History
  const applyLogPath = join(options.target, '.ai', 'proposals', 'apply-log.jsonl');
  let applyLogCount = 0;
  if (existsSync(applyLogPath)) {
    try {
      applyLogCount = readFileSync(applyLogPath, 'utf8').trim().split(/\r?\n/).filter(l => l.trim() !== '').length;
    } catch (e) {}
  }
  console.log(`  \x1b[33mApply Audit Log:\x1b[0m`);
  console.log(`    Apply Count:     ${applyLogCount}`);

  // 7. Recommended Next Move
  let nextMove = 'mmdo status';
  if (!existsSync(join(options.target, '.ai', 'config.yaml'))) {
    nextMove = '\x1b[36mnpx multimodel-dev-os init\x1b[0m (initialize MultiModel Dev OS first)';
  } else if (!existsSync(memoryHashPath)) {
    nextMove = '\x1b[36mnpx multimodel-dev-os memory build\x1b[0m (initialize memory index)';
  } else {
    const diff = diffMemory(options.target);
    if (diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0)) {
      nextMove = '\x1b[36mnpx multimodel-dev-os memory refresh\x1b[0m (update memory with changes)';
    } else if (feedbackCount > 0 && !existsSync(rulesPath)) {
      nextMove = '\x1b[36mnpx multimodel-dev-os feedback summarize\x1b[0m (compile feedback into learning rules)';
    } else if (pendingCount > 0) {
      nextMove = '\x1b[36mnpx multimodel-dev-os improve review\x1b[0m (review pending proposals)';
    } else {
      nextMove = '\x1b[36mnpx multimodel-dev-os workflow run repo-health\x1b[0m (run standard codebase health checks)';
    }
  }
  console.log(`\n  \x1b[35mRecommended Next Command:\x1b[0m`);
  console.log(`    ${nextMove}\n`);
}
