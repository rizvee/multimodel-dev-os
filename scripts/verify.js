#!/usr/bin/env node

/**
 * multimodel-dev-os strict cross-platform release verification script.
 * Checks that all required files and directories exist in their exact locations.
 * Runs on Windows, macOS, and Linux with zero external dependencies.
 */

import { existsSync, readFileSync, statSync } from 'fs';
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
checkFile('examples/general-app/AGENTS.md');
checkFile('examples/general-app/MEMORY.md');

// --- Scripts & bin ---
console.log('\nScripts & Executables:');
checkFile('scripts/install.sh');
checkFile('scripts/install.ps1');
checkFile('scripts/verify.sh');
checkFile('scripts/pack-template.sh');
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

// --- JSON Schemas ---
console.log('\nJSON Schemas:');
checkFile('.ai/schema/config.schema.json');
checkFile('.ai/schema/template.schema.json');
checkFile('.ai/schema/adapter.schema.json');

// --- Test Blueprints ---
console.log('\nTest Manuals:');
checkFile('tests/README.md');
checkFile('tests/fixtures/README.md');
checkFile('tests/smoke/README.md');

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
} catch (e) {
  console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js --help failed: ${e.message}`);
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
