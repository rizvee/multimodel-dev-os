#!/usr/bin/env node

/**
 * multimodel-dev-os strict cross-platform release verification script.
 * Checks that all required files and directories exist in their exact locations.
 * Runs on Windows, macOS, and Linux with zero external dependencies.
 */

import { existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

let pass = 0;
let fail = 0;
let warn = 0;

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

function checkFile(relPath, required = true) {
  const fullPath = join(projectRoot, relPath);
  if (existsSync(fullPath) && statSync(fullPath).isFile()) {
    console.log(`  ${GREEN}✓${NC} ${relPath}`);
    pass++;
    return true;
  } else if (required) {
    console.error(`  ${RED}✗${NC} ${relPath} (missing)`);
    fail++;
    return false;
  } else {
    console.log(`  ${YELLOW}?${NC} ${relPath} (optional, not found)`);
    warn++;
    return false;
  }
}

function checkDir(relPath) {
  const fullPath = join(projectRoot, relPath);
  if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
    console.log(`  ${GREEN}✓${NC} ${relPath}/`);
    pass++;
    return true;
  } else {
    console.error(`  ${RED}✗${NC} ${relPath}/ (missing)`);
    fail++;
    return false;
  }
}

console.log('multimodel-dev-os - Strict Release Audit Verification');
console.log('=====================================================');
console.log('');

// --- Root Files ---
console.log('Root files:');
checkFile('AGENTS.md');
checkFile('MEMORY.md');
checkFile('TASKS.md');
checkFile('RUNBOOK.md');
checkFile('README.md');
checkFile('LICENSE');
checkFile('CONTRIBUTING.md');
checkFile('CONTRIBUTORS.md');
checkFile('CODE_OF_CONDUCT.md');
checkFile('SECURITY.md');
checkFile('CHANGELOG.md');
checkFile('package.json');
checkFile('.gitignore');
checkFile('.gitattributes');
checkFile('.editorconfig', false);

// --- .ai/ Core Directory & YAML ---
console.log('\n.ai/ directory & config:');
checkDir('.ai');
checkFile('.ai/config.yaml');

// --- .ai/context/ ---
console.log('\n.ai/context/ files:');
checkFile('.ai/context/project-brief.md');
checkFile('.ai/context/architecture.md');
checkFile('.ai/context/business-rules.md');
checkFile('.ai/context/seo-rules.md');
checkFile('.ai/context/deployment-rules.md');
checkFile('.ai/context/model-map.md');
checkFile('.ai/context/context-budget.md');

// --- .ai/agents/ ---
console.log('\n.ai/agents/ files:');
checkFile('.ai/agents/multimodel-orchestrator.md');
checkFile('.ai/agents/planner.md');
checkFile('.ai/agents/coder.md');
checkFile('.ai/agents/reviewer.md');
checkFile('.ai/agents/qa-tester.md');
checkFile('.ai/agents/security-auditor.md');
checkFile('.ai/agents/seo-auditor.md');
checkFile('.ai/agents/devops.md');

// --- .ai/skills/ ---
console.log('\n.ai/skills/ files:');
checkFile('.ai/skills/model-routing.md');
checkFile('.ai/skills/context-routing.md');
checkFile('.ai/skills/nextjs-feature-build.md');
checkFile('.ai/skills/bug-fix.md');
checkFile('.ai/skills/refactor.md');
checkFile('.ai/skills/seo-implementation.md');
checkFile('.ai/skills/landing-page-optimization.md');
checkFile('.ai/skills/cpanel-deploy.md');
checkFile('.ai/skills/caveman-bug-fix.md');
checkFile('.ai/skills/caveman-feature-build.md');
checkFile('.ai/skills/caveman-context-handoff.md');

// --- .ai/prompts/ ---
console.log('\n.ai/prompts/ files:');
checkFile('.ai/prompts/plan-first.md');
checkFile('.ai/prompts/implement-safely.md');
checkFile('.ai/prompts/review-diff.md');
checkFile('.ai/prompts/generate-tests.md');
checkFile('.ai/prompts/summarize-session.md');
checkFile('.ai/prompts/handoff-to-next-model.md');

// --- .ai/checks/ ---
console.log('\n.ai/checks/ files:');
checkFile('.ai/checks/pre-implementation.md');
checkFile('.ai/checks/pre-commit.md');
checkFile('.ai/checks/pre-deploy.md');
checkFile('.ai/checks/regression-checklist.md');
checkFile('.ai/checks/context-budget.md');

// --- .ai/templates/ ---
console.log('\n.ai/templates/ files:');
checkFile('.ai/templates/task-template.md');
checkFile('.ai/templates/feature-spec-template.md');
checkFile('.ai/templates/bug-report-template.md');
checkFile('.ai/templates/session-log-template.md');
checkFile('.ai/templates/project-memory-template.md');

// --- Adapters ---
console.log('\nAdapters:');
checkFile('adapters/codex/AGENTS.md');
checkFile('adapters/codex/setup.md');
checkFile('adapters/antigravity/AGENTS.md');
checkFile('adapters/antigravity/.gemini/settings.json');
checkFile('adapters/antigravity/setup.md');
checkFile('adapters/cursor/.cursorrules');
checkFile('adapters/cursor/setup.md');
checkFile('adapters/claude/CLAUDE.md');
checkFile('adapters/claude/setup.md');
checkFile('adapters/gemini/GEMINI.md');
checkFile('adapters/gemini/setup.md');
checkFile('adapters/vscode/.vscode/settings.json');
checkFile('adapters/vscode/setup.md');

// --- Examples ---
console.log('\nExamples:');
checkFile('examples/nextjs-saas/AGENTS.md');
checkFile('examples/nextjs-saas/MEMORY.md');
checkFile('examples/wordpress-site/AGENTS.md');
checkFile('examples/wordpress-site/MEMORY.md');
checkFile('examples/ecommerce-store/AGENTS.md');
checkFile('examples/ecommerce-store/MEMORY.md');
checkFile('examples/seo-landing-page/AGENTS.md');
checkFile('examples/seo-landing-page/MEMORY.md');
checkFile('examples/expo-react-native-android/AGENTS.md');
checkFile('examples/expo-react-native-android/MEMORY.md');
checkFile('examples/expo-react-native-android/app.json');
checkFile('examples/expo-react-native-android/eas.json');
checkFile('examples/expo-react-native-android/app.config.ts');
checkFile('examples/expo-react-native-android/jest.config.js');
checkFile('examples/expo-react-native-android/src/app/_layout.tsx');
checkFile('examples/expo-react-native-android/src/lib/secure-storage.ts');
checkFile('examples/expo-react-native-android/src/services/api-client.ts');
checkFile('examples/general-app/AGENTS.md');
checkFile('examples/general-app/MEMORY.md');

// --- Scripts & bin ---
console.log('\nScripts & Executables:');
checkFile('scripts/install.sh');
checkFile('scripts/install.ps1');
checkFile('scripts/verify.sh');
checkFile('scripts/pack-template.sh');
checkFile('scripts/prepublish-guard.js');
checkFile('bin/multimodel-dev-os.js');

// --- GitHub Integration ---
console.log('\nGitHub Workflows:');
checkFile('.github/workflows/verify.yml');

// --- Documentation ---
console.log('\nExtended Documentation:');
checkFile('docs/quickstart.md');
checkFile('docs/architecture.md');
checkFile('docs/multimodel-workflow.md');
checkFile('docs/caveman-mode.md');
checkFile('docs/adapters.md');
checkFile('docs/installers.md');
checkFile('docs/cli-roadmap.md');
checkFile('docs/faq.md');
checkFile('docs/testing-v0.2.md');
checkFile('docs/npm-publishing.md');
checkFile('docs/templates-guide.md');
checkFile('docs/protocol.md');
checkFile('docs/compatibility.md');
checkFile('docs/migration-guide.md');
checkFile('docs/template-qa.md');
checkFile('docs/v1-readiness.md');
checkFile('docs/stable-protocol.md');
checkFile('docs/release-policy.md');
checkFile('docs/support-policy.md');
checkFile('docs/final-launch.md');
checkFile('docs/v1-checklist.md');
checkFile('docs/model-compatibility.md');
checkFile('docs/model-routing.md');
checkFile('docs/local-models.md');
checkFile('docs/provider-strategy.md');
checkFile('docs/agent-compatibility.md');
checkFile('docs/adapter-authoring.md');
checkFile('docs/token-optimization.md');
checkFile('docs/mobile-android.md');
checkFile('docs/v2-roadmap.md');
checkFile('docs/template-authoring.md');
checkFile('docs/skill-authoring.md');
checkFile('docs/registry-contribution.md');
checkFile('docs/v2-migration.md');
checkFile('docs/v2-release-checklist.md');
checkFile('docs/package-safety.md');

// --- v2.1.0 Intelligence Layer Documentation ---
console.log('\nIntelligence Layer Documentation:');
checkFile('docs/future-proof-architecture.md');
checkFile('docs/self-improving-codebase.md');
checkFile('docs/feedback-learning.md');
checkFile('docs/hash-compressed-memory.md');
checkFile('docs/capability-registry.md');
checkFile('docs/tool-registry.md');
checkFile('docs/improvement-proposals.md');
checkFile('docs/learning-rules.md');
checkFile('docs/approved-proposal-apply.md');
checkFile('docs/repository-command-center.md');
checkFile('docs/workflow-orchestration.md');
checkFile('docs/agent-handoff.md');

// --- Model & Adapter Registries ---
console.log('\nModel & Adapter Registries:');
checkFile('.ai/models/registry.yaml');
checkFile('.ai/models/providers.yaml');
checkFile('.ai/models/routing-presets.yaml');
checkFile('.ai/models/local-models.yaml');
checkFile('.ai/models/README.md');
checkFile('.ai/adapters/registry.yaml');
checkFile('.ai/templates/registry.yaml');
checkFile('.ai/templates/custom-template.example.yaml');
checkFile('.ai/adapters/custom-adapter.example.yaml');
checkFile('.ai/skills/custom-skill.example.md');

// --- JSON Schemas ---
console.log('\nJSON Schemas:');
checkFile('.ai/schema/config.schema.json');
checkFile('.ai/schema/template.schema.json');
checkFile('.ai/schema/adapter.schema.json');

// --- v2.1.0 Intelligence Layer (Schemas, Policies, Registries) ---
console.log('\nIntelligence Layer Schemas:');
checkFile('.ai/intelligence/memory.schema.json');
checkFile('.ai/intelligence/feedback.schema.json');
checkFile('.ai/intelligence/README.md');
checkFile('.ai/intelligence/feedback-log.example.jsonl');
checkFile('.ai/intelligence/learning-rules.example.md');
checkFile('.ai/intelligence/improvement-proposal.schema.json');
checkFile('.ai/intelligence/apply-log.schema.json');
checkFile('.ai/proposals/README.md');
checkFile('.ai/proposals/apply-operation.example.json');

console.log('\nIntelligence Layer Policies:');
checkFile('.ai/policies/self-improvement-policy.md');
checkFile('.ai/policies/memory-policy.md');
checkFile('.ai/policies/approval-gates.md');

console.log('\nIntelligence Layer Registries:');
checkFile('.ai/registries/capabilities.yaml');
checkFile('.ai/registries/tools.yaml');
checkFile('.ai/registries/workflows.yaml');

// --- Test Blueprints ---
console.log('\nTest Manuals:');
checkFile('tests/README.md');
checkFile('tests/fixtures/README.md');
checkFile('tests/fixtures/custom-template-example/README.md');
checkFile('tests/fixtures/registry-overrides/README.md');
checkFile('tests/smoke/README.md');
checkFile('tests/smoke/cli-smoke.md');

// --- Visual & AI Discovery Assets ---
console.log('\nVisual & AI Discovery Assets:');
checkFile('assets/favicon.png');
checkFile('assets/logo.png');
checkFile('docs/public/favicon.png');
checkFile('docs/public/logo.png');
checkFile('docs/public/llms.txt');
checkFile('docs/public/llms-full.txt');
checkFile('docs/public/robots.txt');
checkFile('docs/public/sitemap.xml');
checkFile('docs/public/assets/social-preview.svg');
checkFile('docs/public/assets/terminal-demo.svg');
checkFile('docs/public/assets/architecture-preview.svg');

// --- YAML Parser Helper ---
function parseYaml(content) {
  try {
    const root = {};
    const stack = [{ obj: root, indent: -1, key: null, isArray: false }];
    const lines = content.split(/\r?\n/);
    for (let line of lines) {
      const commentIdx = line.indexOf('#');
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      line = line.trimEnd();
      if (!line.trim()) continue;
      const indent = line.match(/^ */)[0].length;
      let trimmed = line.trim();
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1];
      if (trimmed.startsWith('-')) {
        trimmed = trimmed.substring(1).trim();
        if (!Array.isArray(parent.obj)) {
          const grandparent = stack[stack.length - 2];
          if (grandparent) {
            grandparent.obj[parent.key] = [];
            parent.obj = grandparent.obj[parent.key];
          }
        }
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) {
          parent.obj.push(trimmed);
        } else {
          const key = trimmed.substring(0, colonIdx).trim();
          let val = trimmed.substring(colonIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (val === 'null') val = null;
          else if (/^\d+$/.test(val)) val = parseInt(val, 10);
          const newObj = { [key]: val };
          parent.obj.push(newObj);
          stack.push({ obj: newObj, indent: indent, key: key, isArray: false });
        }
      } else {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) continue;
        const key = trimmed.substring(0, colonIdx).trim();
        let val = trimmed.substring(colonIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val === 'null') val = null;
        else if (/^\d+$/.test(val)) val = parseInt(val, 10);
        if (val === '') {
          parent.obj[key] = {};
          stack.push({ obj: parent.obj[key], indent: indent, key: key, isArray: false });
        } else {
          parent.obj[key] = val;
        }
      }
    }
    return root;
  } catch (e) {
    return null;
  }
}

function verifyRegistryParsed(relPath, requiredRootKey) {
  const fullPath = join(projectRoot, relPath);
  if (!existsSync(fullPath)) {
    console.error(`  ${RED}✗${NC} ${relPath} (missing for parsing)`);
    fail++;
    return;
  }
  try {
    const data = parseYaml(readFileSync(fullPath, 'utf8'));
    if (!data || typeof data !== 'object') {
      console.error(`  ${RED}✗${NC} ${relPath} (YAML parsing returned invalid object)`);
      fail++;
    } else if (requiredRootKey && !data[requiredRootKey]) {
      console.error(`  ${RED}✗${NC} ${relPath} (missing root key: "${requiredRootKey}")`);
      fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} ${relPath} (parsed successfully, verified root key "${requiredRootKey}")`);
      pass++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} ${relPath} (failed parsing: ${e.message})`);
    fail++;
  }
}

// --- Verifying Registry Parsers and Syntax Sanity ---
console.log('\nVerifying Registry Parsers and Syntax Sanity:');
verifyRegistryParsed('.ai/models/registry.yaml', 'models');
verifyRegistryParsed('.ai/models/providers.yaml', 'providers');
verifyRegistryParsed('.ai/models/routing-presets.yaml', 'presets');
verifyRegistryParsed('.ai/models/local-models.yaml', 'local_engines');
verifyRegistryParsed('.ai/adapters/registry.yaml', 'adapters');
verifyRegistryParsed('.ai/templates/registry.yaml', 'templates');
verifyRegistryParsed('.ai/registries/capabilities.yaml', 'capabilities');
verifyRegistryParsed('.ai/registries/tools.yaml', 'tools');
verifyRegistryParsed('.ai/registries/workflows.yaml', 'workflows');

// --- CLI & Packaging Pre-Flight Tests ---
console.log('\nRunning CLI & Packaging Pre-Flight Tests...');

// Verify package.json version dynamically
let expectedVersion = '';
try {
  const pkgData = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  expectedVersion = pkgData.version;
  if (!expectedVersion || !/^\d+\.\d+\.\d+/.test(expectedVersion)) {
    console.error(`  ${RED}✗${NC} package.json version is invalid (found ${expectedVersion})`);
    fail++;
  } else {
    console.log(`  ${GREEN}✓${NC} package.json version is valid: ${expectedVersion}`);
    pass++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to parse package.json: ${e.message}`);
  fail++;
}

// Verify CLI help displays current version dynamically
try {
  const helpOutput = execSync('node bin/multimodel-dev-os.js --help', { cwd: projectRoot, encoding: 'utf8' });
  if (!helpOutput.includes(`v${expectedVersion}`)) {
    console.error(`  ${RED}✗${NC} CLI help does not display v${expectedVersion}`);
    fail++;
  } else {
    console.log(`  ${GREEN}✓${NC} CLI help displays v${expectedVersion}`);
    pass++;
  }
  
  if (helpOutput.includes('scan') && helpOutput.includes('memory') && helpOutput.includes('status') && helpOutput.includes('workflow') && helpOutput.includes('handoff')) {
    console.log(`  ${GREEN}✓${NC} CLI help includes scan, memory, status, workflow, and handoff commands`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} CLI help is missing scan, memory, status, workflow, or handoff commands`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js --help failed: ${e.message}`);
  fail++;
}

// Verify docs mention memory build
try {
  const mdContent = readFileSync(join(projectRoot, 'docs', 'hash-compressed-memory.md'), 'utf8');
  if (mdContent.includes('memory build')) {
    console.log(`  ${GREEN}✓${NC} docs/hash-compressed-memory.md mentions 'memory build'`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} docs/hash-compressed-memory.md does not mention 'memory build'`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} docs check failed: ${e.message}`);
  fail++;
}

// Verify no generated memory or feedback logs or proposals are committed/tracked in git root/intelligence folder
try {
  const checkUntracked = (relPath) => {
    if (existsSync(join(projectRoot, relPath))) {
      console.error(`  ${RED}✗${NC} ${relPath} should not be tracked/committed!`);
      fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} ${relPath} is not tracked/committed`);
      pass++;
    }
  };
  checkUntracked('.ai/intelligence/memory.hash.json');
  checkUntracked('.ai/intelligence/memory.summary.md');
  checkUntracked('.ai/intelligence/feedback-log.jsonl');
  checkUntracked('.ai/intelligence/learning-rules.md');
  checkUntracked('.ai/intelligence/handoff.md');
  checkUntracked('.ai/proposals/apply-log.jsonl');
  
  // also check if any proposal-*.md file exists directly in projectRoot/proposals (since it shouldn't be tracked)
  const proposalsDir = join(projectRoot, '.ai', 'proposals');
  if (existsSync(proposalsDir)) {
    const files = readdirSync(proposalsDir);
    const hasRuntimeProposals = files.some(f => f.startsWith('proposal-') && f !== 'proposal-template.md' && f.endsWith('.md'));
    if (hasRuntimeProposals) {
      console.error(`  ${RED}✗${NC} Runtime proposals should not be committed/tracked!`);
      fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} No runtime proposals committed`);
      pass++;
    }
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Tracking verification of generated files failed: ${e.message}`);
  fail++;
}

// Verify npm pack dry-run shows current version dynamically
try {
  const packOutput = execSync('npm pack --dry-run', { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (packOutput.includes(`multimodel-dev-os@${expectedVersion}`) || packOutput.includes(`multimodel-dev-os-${expectedVersion}.tgz`) || packOutput.includes(`version: ${expectedVersion}`)) {
    console.log(`  ${GREEN}✓${NC} npm pack --dry-run reports version ${expectedVersion}`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} npm pack --dry-run did not report ${expectedVersion} in stdout`);
    fail++;
  }
} catch (e) {
  const stdErrOut = e.stderr ? e.stderr.toString() : '';
  const stdOutOut = e.stdout ? e.stdout.toString() : '';
  if (stdErrOut.includes(`multimodel-dev-os@${expectedVersion}`) || stdErrOut.includes(`multimodel-dev-os-${expectedVersion}.tgz`) || stdOutOut.includes(`multimodel-dev-os-${expectedVersion}.tgz`)) {
    console.log(`  ${GREEN}✓${NC} npm pack --dry-run reports version ${expectedVersion}`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} npm pack --dry-run failed or did not report ${expectedVersion}: ${e.message}`);
    fail++;
  }
}

// Dry run verify command runs cleanly
try {
  execSync('node bin/multimodel-dev-os.js verify', { cwd: projectRoot, stdio: 'ignore' });
  console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js verify`);
  pass++;
} catch (e) {
  console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js verify failed: ${e.message}`);
  fail++;
}

// --- Package Safety & Hygiene Checks ---
console.log('\nPackage Safety & Hygiene Checks:');
if (existsSync(join(projectRoot, '.npmrc')) && process.env.MMDO_ALLOW_PUBLISH !== 'true') {
  console.error(`  ${RED}✗ .npmrc file exists in package root (security risk)${NC}`);
  fail++;
} else {
  if (existsSync(join(projectRoot, '.npmrc'))) {
    console.log(`  ${YELLOW}!${NC} .npmrc file present in package root (allowed via MMDO_ALLOW_PUBLISH)`);
    warn++;
  } else {
    console.log(`  ${GREEN}✓${NC} No .npmrc file present in package root`);
    pass++;
  }
}

const checkExamplesHygiene = (dir) => {
  if (!existsSync(dir)) return;
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        checkExamplesHygiene(fullPath);
      } else if (stat.isFile()) {
        if (item === '.env' || item.endsWith('.keystore') || item.endsWith('.jks')) {
          console.error(`  ${RED}✗ Unsafe file found inside examples: ${fullPath.replace(projectRoot, '')}${NC}`);
          fail++;
        }
      }
    } catch (e) {}
  }
};
checkExamplesHygiene(join(projectRoot, 'examples'));

console.log('\n=====================================================');
const total = pass + fail + warn;
console.log(`  Pass: ${GREEN}${pass}${NC}  Fail: ${RED}${fail}${NC}  Warn: ${YELLOW}${warn}${NC}  Total: ${total}`);

if (fail > 0) {
  console.error(`\n${RED}Verification failed. Fix issues listed above.${NC}`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}Verification passed successfully.${NC}`);
  process.exit(0);
}
