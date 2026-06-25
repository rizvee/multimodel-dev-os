import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parseYaml } from '../../core/yaml.js';

export function handleHandoffBuild(options, { scanTarget, detectFrameworkSignals, detectDependencySignals, diffMemory } = {}) {
  const intelDir = join(options.target, '.ai', 'intelligence');
  if (!existsSync(intelDir)) {
    mkdirSync(intelDir, { recursive: true });
  }
  const handoffPath = join(intelDir, 'handoff.md');

  // 1. Get package metadata
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

  // 2. Scan targets
  const { files } = scanTarget(options.target);
  const frameworkSignals = detectFrameworkSignals(files, options.target);
  const dependencySignals = detectDependencySignals(files, options.target);

  // 3. Memory
  const memoryHashPath = join(intelDir, 'memory.hash.json');
  let memoryStatus = 'MISSING';
  let memoryTime = 'N/A';
  if (existsSync(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync(memoryHashPath, 'utf8'));
      memoryTime = memObj.generated_at || 'N/A';
      const diff = diffMemory(options.target);
      if (diff) {
        memoryStatus = (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) ? 'CURRENT' : 'STALE';
      }
    } catch (e) {
      memoryStatus = 'CORRUPT';
    }
  }

  // 4. Feedback
  const feedbackPath = join(intelDir, 'feedback-log.jsonl');
  let feedbackCount = 0;
  if (existsSync(feedbackPath)) {
    try {
      feedbackCount = readFileSync(feedbackPath, 'utf8').trim().split(/\r?\n/).filter(l => l.trim() !== '').length;
    } catch (e) {}
  }
  const rulesPath = join(intelDir, 'learning-rules.md');
  const rulesStatus = existsSync(rulesPath) ? 'PRESENT' : 'MISSING';

  // 5. Proposals
  const proposalsDir = join(options.target, '.ai', 'proposals');
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  if (existsSync(proposalsDir)) {
    try {
      const propFiles = readdirSync(proposalsDir).filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
      propFiles.forEach(file => {
        const content = readFileSync(join(proposalsDir, file), 'utf8');
        const fmMatch = content.match(/^---([\s\S]*?)---/);
        if (fmMatch) {
          const metadata = parseYaml(fmMatch[1]) || {};
          const status = metadata.approval_status || 'pending';
          if (status === 'approved') approvedCount++;
          else if (status === 'rejected') rejectedCount++;
          else pendingCount++;
        }
      });
    } catch (e) {}
  }

  // 6. Apply logs
  const applyLogPath = join(proposalsDir, 'apply-log.jsonl');
  let applyLogCount = 0;
  let lastApplyId = 'None';
  if (existsSync(applyLogPath)) {
    try {
      const lines = readFileSync(applyLogPath, 'utf8').trim().split(/\r?\n/).filter(l => l.trim() !== '');
      applyLogCount = lines.length;
      if (applyLogCount > 0) {
        const lastRecord = JSON.parse(lines[lines.length - 1]);
        lastApplyId = lastRecord.id || 'unknown';
      }
    } catch (e) {}
  }

  // 7. Core Learning Summary
  let rulesSummary = 'No learning rules defined yet.';
  if (existsSync(rulesPath)) {
    try {
      const rulesContent = readFileSync(rulesPath, 'utf8');
      const lines = rulesContent.split(/\r?\n/);
      const summaryLines = [];
      for (const line of lines) {
        if (line.startsWith('*   **Pattern:**') || line.startsWith('    *   **Rule:**')) {
          summaryLines.push(line);
        }
        if (summaryLines.length >= 10) break;
      }
      if (summaryLines.length > 0) {
        rulesSummary = summaryLines.join('\n');
      }
    } catch (e) {}
  }

  // Next steps recommended
  let recs = '1. Run `npx multimodel-dev-os workflow run repo-health` to check the directory hygiene.\n2. Review pending proposals if any exist.';
  if (!existsSync(join(options.target, '.ai', 'config.yaml'))) {
    recs = '1. Run `npx multimodel-dev-os init` to bootstrap MultiModel Dev OS.\n2. Run `npx multimodel-dev-os memory build` to initialize codebase memory.';
  } else if (memoryStatus === 'MISSING') {
    recs = '1. Run `npx multimodel-dev-os memory build` to initialize codebase index.\n2. Verify package safety boundaries.';
  } else if (memoryStatus === 'STALE') {
    recs = '1. Run `npx multimodel-dev-os memory refresh` to update memory files.\n2. Analyze modifications.';
  } else if (pendingCount > 0) {
    recs = `1. Run \`npx multimodel-dev-os improve review\` to inspect the ${pendingCount} pending proposals.\n2. Apply approved changes manually.`;
  }

  const handoffContent = `# Agent Handoff Spec - ${new Date().toISOString()}

## 1. Project Context
- **Name**: ${pkgName}
- **Version**: ${pkgVersion}
- **Frameworks**: ${frameworkSignals.join(', ') || 'None'}
- **Dependencies**: ${dependencySignals.join(', ') || 'None'}

## 2. Intelligence Core State
- **Memory**: ${memoryStatus} (Last build: ${memoryTime})
- **Feedback Loop**: ${feedbackCount} items logged. \`learning-rules.md\` is ${rulesStatus}.
- **Proposals**: ${pendingCount} Pending, ${approvedCount} Approved, ${rejectedCount} Rejected.
- **Applied Modifications**: ${applyLogCount} runs recorded. Last run: ${lastApplyId}.

## 3. Core Learning Summaries
\`\`\`markdown
${rulesSummary}
\`\`\`

## 4. Safety Constraints
- Workflow run is restricted to read-only actions.
- Modifications must be applied explicitly via \`improve apply --approved\`.
- No code modification permissions exist in this session context.

## 5. Recommended Next Steps
${recs}
`;

  try {
    writeFileSync(handoffPath, handoffContent, 'utf8');
    console.log(`\n✔ Handoff context built successfully in: .ai/intelligence/handoff.md`);
  } catch (e) {
    console.error(`\x1b[31mError writing handoff: ${e.message}\x1b[0m`);
  }
}

export function handleHandoffShow(options, { scanTarget, detectFrameworkSignals, detectDependencySignals, diffMemory } = {}) {
  const handoffPath = join(options.target, '.ai', 'intelligence', 'handoff.md');
  if (!existsSync(handoffPath)) {
    console.log('No compiled handoff file exists. Building first...');
    handleHandoffBuild(options, { scanTarget, detectFrameworkSignals, detectDependencySignals, diffMemory });
  }
  try {
    const content = readFileSync(handoffPath, 'utf8');
    console.log('\n' + content);
  } catch (e) {
    console.error(`\x1b[31mError reading handoff: ${e.message}\x1b[0m`);
  }
}
