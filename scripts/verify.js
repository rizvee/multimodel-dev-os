#!/usr/bin/env node

/**
 * multimodel-dev-os strict cross-platform release verification script.
 * Checks that all required files and directories exist in their exact locations.
 * Runs on Windows, macOS, and Linux with zero external dependencies.
 */

import { existsSync, readFileSync, statSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

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

const originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  if (process.env.GITHUB_ACTIONS === 'true') {
    const cleanMsg = args.join(' ').replace(/\x1b\[[0-9;]*m/g, '');
    console.log(`::error::${cleanMsg}`);
  }
};

const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  originalConsoleWarn.apply(console, args);
  if (process.env.GITHUB_ACTIONS === 'true') {
    const cleanMsg = args.join(' ').replace(/\x1b\[[0-9;]*m/g, '');
    console.log(`::warning::${cleanMsg}`);
  }
};

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

// --- Modular Source Files ---
console.log('\nModular Source Files:');
checkFile('src/cli/main.js');
checkFile('src/cli/args.js');
checkFile('src/cli/help.js');
checkFile('src/core/yaml.js');
checkFile('src/core/hashes.js');
checkFile('src/core/policy.js');
checkFile('src/core/security.js');
checkFile('src/core/globals.js');
checkFile('src/registry/validation.js');
checkFile('src/registry/sources.js');
checkFile('src/registry/provenance.js');
checkFile('src/registry/signing.js');
checkFile('src/registry/trust-store.js');
checkFile('src/catalog/loader.js');
checkFile('src/plugin/manifest.js');

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
checkFile('docs/testing.md');
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
checkFile('docs/v3-roadmap.md');
checkFile('docs/template-authoring.md');
checkFile('docs/skill-authoring.md');
checkFile('docs/registry-contribution.md');
checkFile('docs/v2-migration.md');
checkFile('docs/v2-release-checklist.md');
checkFile('docs/package-safety.md');
checkFile('docs/registry-signing.md');
checkFile('docs/registry-trust-store.md');

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
checkFile('.ai/schema/trusted-keys.schema.json');

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
checkFile('.ai/registries/trusted-keys.yaml');

// --- Unit Tests ---
console.log('\nUnit Tests:');
checkFile('tests/unit/yaml.test.js');
checkFile('tests/unit/registry-url-validation.test.js');
checkFile('tests/unit/registry-policy.test.js');
checkFile('tests/unit/registry-provenance.test.js');
checkFile('tests/unit/registry-signing.test.js');
checkFile('tests/unit/registry-public-signing.test.js');
checkFile('tests/unit/registry-trust-store.test.js');
checkFile('tests/unit/registry-signature-policy.test.js');
checkFile('tests/unit/path-safety.test.js');
checkFile('tests/unit/plugin-manifest.test.js');
checkFile('tests/unit/catalog-loader.test.js');
checkFile('tests/unit/build-output.test.js');
checkFile('tests/unit/prepublish-guard.test.js');

// --- Test Manuals & Fixtures ---
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
function parseFlowArray(str) {
  const contents = str.slice(1, -1).trim();
  if (!contents) return [];

  const result = [];
  const regex = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^,\s][^,]*[^,\s]|[^,\s])/g;
  let match;
  while ((match = regex.exec(contents)) !== null) {
    if (match[1] !== undefined) {
      result.push(match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    } else if (match[2] !== undefined) {
      result.push(match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
    } else if (match[3] !== undefined) {
      let val = match[3].trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
      result.push(val);
    }
  }
  return result;
}

function parseYaml(content) {
  try {
    const root = {};
    const stack = [{ obj: root, indent: -1, key: null, isArray: false }];
    const lines = content.split(/\r?\n/);
    for (let line of lines) {
      // Find comment index outside quotes
      let commentIdx = -1;
      let insideDouble = false;
      let insideSingle = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
          insideDouble = !insideDouble;
        } else if (char === "'" && (i === 0 || line[i-1] !== '\\')) {
          insideSingle = !insideSingle;
        } else if (char === '#' && !insideDouble && !insideSingle) {
          commentIdx = i;
          break;
        }
      }
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
          let val = trimmed;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (val.startsWith('[') && val.endsWith(']')) {
            val = parseFlowArray(val);
          }
          parent.obj.push(val);
        } else {
          const key = trimmed.substring(0, colonIdx).trim();
          let val = trimmed.substring(colonIdx + 1).trim();
          let isQuoted = false;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
            isQuoted = true;
          }
          if (val.startsWith('[') && val.endsWith(']')) {
            val = parseFlowArray(val);
          } else if (!isQuoted) {
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (val === 'null') val = null;
            else if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
          }
          const newObj = { [key]: val };
          parent.obj.push(newObj);
          stack.push({ obj: newObj, indent: indent, key: key, isArray: false });
        }
      } else {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) continue;
        const key = trimmed.substring(0, colonIdx).trim();
        let val = trimmed.substring(colonIdx + 1).trim();
        let isQuoted = false;
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
          isQuoted = true;
        }
        if (val.startsWith('[') && val.endsWith(']')) {
          val = parseFlowArray(val);
        } else if (!isQuoted) {
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (val === 'null') val = null;
          else if (/^\d+$/.test(val)) val = parseInt(val, 10);
        }
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

  if (helpOutput.includes('dashboard') && helpOutput.includes('ui') && helpOutput.includes('plugin')) {
    console.log(`  ${GREEN}✓${NC} CLI help includes dashboard, ui, and plugin commands`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} CLI help is missing dashboard, ui, or plugin commands`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js --help failed: ${e.message}`);
  fail++;
}

// Verify prepublish guard behavior
try {
  // Test 1: Blocks without MMDO_ALLOW_PUBLISH
  try {
    execSync('node scripts/prepublish-guard.js', { 
      cwd: projectRoot, 
      env: { ...process.env, MMDO_ALLOW_PUBLISH: 'false' }, 
      stdio: 'pipe' 
    });
    console.error(`  ${RED}✗${NC} prepublish-guard should have failed without MMDO_ALLOW_PUBLISH=true`);
    fail++;
  } catch (err) {
    const output = err.stderr ? err.stderr.toString() : '';
    if (output.includes('Publishing requires explicit release approval')) {
      console.log(`  ${GREEN}✓${NC} prepublish guard blocks without MMDO_ALLOW_PUBLISH`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} prepublish guard failed with unexpected error: ${output}`);
      fail++;
    }
  }

  // Test 2: Allows version 3.5.0 with MMDO_ALLOW_PUBLISH=true
  try {
    const output = execSync('node scripts/prepublish-guard.js', { 
      cwd: projectRoot, 
      env: { ...process.env, MMDO_ALLOW_PUBLISH: 'true' }, 
      encoding: 'utf8' 
    });
    if (output.includes('Prepublish guard passed')) {
      console.log(`  ${GREEN}✓${NC} prepublish guard allows version 3.5.0 when MMDO_ALLOW_PUBLISH=true`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} prepublish guard passed but stdout missing success indicator`);
      fail++;
    }
  } catch (err) {
    const errText = err.stderr ? err.stderr.toString() : '';
    console.error(`  ${RED}✗${NC} prepublish guard blocked version 3.5.0: ${errText || err.message}`);
    fail++;
  }

  // Test 3: Guard output no longer has "Only major v2" wording
  const guardCode = readFileSync(join(projectRoot, 'scripts', 'prepublish-guard.js'), 'utf8');
  if (guardCode.includes('Only major v2')) {
    console.error(`  ${RED}✗${NC} prepublish-guard still contains "Only major v2" wording`);
    fail++;
  } else {
    console.log(`  ${GREEN}✓${NC} prepublish guard no longer has "Only major v2" wording`);
    pass++;
  }

  // Test 4: Package.json version is exactly 3.5.0
  if (expectedVersion === '3.5.0') {
    console.log(`  ${GREEN}✓${NC} package.json version is exactly 3.5.0`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} package.json version is not 3.5.0 (found ${expectedVersion})`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} prepublish guard checks failed: ${e.message}`);
  fail++;
}

// --- Post-build Generated CLI Checks ---
console.log('\nPost-build Generated CLI Checks:');
try {
  // 0. Check build freshness
  try {
    execSync('node scripts/check-build-fresh.js', { cwd: projectRoot, stdio: 'ignore' });
    console.log(`  ${GREEN}✓${NC} generated bin matches current source layout`);
    pass++;
  } catch (err) {
    console.error(`  ${RED}✗${NC} generated bin is stale! Run 'npm run build' and commit bin/multimodel-dev-os.js`);
    fail++;
  }

  const buildPath = join(projectRoot, 'bin', 'multimodel-dev-os.js');
  const binContent = readFileSync(buildPath, 'utf8');
  
  const totalShebangs = (binContent.match(/#!/g) || []).length;
  if (binContent.startsWith('#!/usr/bin/env node') && totalShebangs === 1) {
    console.log(`  ${GREEN}✓${NC} generated bin has exactly one shebang at the top`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} generated bin has invalid shebang layout (count: ${totalShebangs})`);
    fail++;
  }
  
  if (binContent.includes('// Generated from src/. Do not edit directly.')) {
    console.log(`  ${GREEN}✓${NC} generated bin has warning header`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} generated bin is missing the warning header`);
    fail++;
  }
  
  const hasUnsafeSync = binContent.includes("mod.get('${targetUrl}'") || (binContent.includes('execSync(`node -e "') && binContent.includes('${targetUrl}'));
  if (!hasUnsafeSync && binContent.includes('execFileSync(process.execPath')) {
    console.log(`  ${GREEN}✓${NC} generated bin is free of unsafe URL interpolation and uses execFileSync`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} generated bin fails safety scan (unsafe interpolation found)`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} post-build generated CLI checks failed: ${e.message}`);
  fail++;
}

// --- v2.8.0 / v2.8.1 Dashboard & Plugin Tests ---
console.log('\nRunning TUI Dashboard & Plugin Pre-Flight Tests...');

// 1. Dashboard dry-run check
try {
  const output = execSync('node bin/multimodel-dev-os.js dashboard --dry-run', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('Headless/CI Preview') && output.includes('npx multimodel-dev-os')) {
    console.log(`  ${GREEN}✓${NC} dashboard --dry-run executes successfully and displays headless preview`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} dashboard --dry-run output is missing preview strings`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} dashboard --dry-run execution failed: ${e.message}`);
  fail++;
}

// 2. Dashboard list-actions check
try {
  const output = execSync('node bin/multimodel-dev-os.js dashboard --list-actions', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('Headless/CI Preview') && output.includes('npx multimodel-dev-os')) {
    console.log(`  ${GREEN}✓${NC} dashboard --list-actions executes successfully and displays headless preview`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} dashboard --list-actions output is missing preview strings`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} dashboard --list-actions execution failed: ${e.message}`);
  fail++;
}

// 3. Plugin validation check
try {
  const output = execSync('node bin/multimodel-dev-os.js plugin validate .ai/plugins/plugin.example.yaml', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('fully valid and compliant')) {
    console.log(`  ${GREEN}✓${NC} plugin validate on example manifest passes successfully`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} plugin validate on example manifest failed to report compliance`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} plugin validate execution failed: ${e.message}`);
  fail++;
}

// 4. Plugin install refusal check (no --approved, should exit with code 1)
try {
  execSync('node bin/multimodel-dev-os.js plugin install .ai/plugins/plugin.example.yaml', { cwd: projectRoot, stdio: 'pipe' });
  console.error(`  ${RED}✗${NC} plugin install without --approved should have exited with code 1, but exited with 0`);
  fail++;
} catch (e) {
  if (e.status === 1) {
    const stdErrOut = e.stderr ? e.stderr.toString() : '';
    const stdOutOut = e.stdout ? e.stdout.toString() : '';
    if (stdErrOut.includes('Installation refused') || stdOutOut.includes('Installation refused')) {
      console.log(`  ${GREEN}✓${NC} plugin install without --approved correctly refuses and exits with code 1`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} plugin install without --approved exited with 1 but missing refusal message`);
      fail++;
    }
  } else {
    console.error(`  ${RED}✗${NC} plugin install without --approved failed with unexpected code ${e.status}: ${e.message}`);
    fail++;
  }
}

// 5. Plugin status check
try {
  execSync('node bin/multimodel-dev-os.js plugin status', { cwd: projectRoot, stdio: 'ignore' });
  console.log(`  ${GREEN}✓${NC} plugin status executes without crashing`);
  pass++;
} catch (e) {
  console.error(`  ${RED}✗${NC} plugin status execution failed: ${e.message}`);
  fail++;
}

// --- v2.9.0 Catalog & Marketplace Tests ---
console.log('\nRunning Catalog & Marketplace Pre-Flight Tests...');

// 1. Catalog list check
try {
  const output = execSync('node bin/multimodel-dev-os.js catalog list', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('Workflow Marketplace & Plugin Catalog') && output.includes('git-workflows')) {
    console.log(`  ${GREEN}✓${NC} catalog list executes successfully and displays catalog listings`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog list output is missing catalog listings`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog list execution failed: ${e.message}`);
  fail++;
}

// 2. Catalog categories check
try {
  const output = execSync('node bin/multimodel-dev-os.js catalog categories', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('Marketplace Categories') && output.includes('git')) {
    console.log(`  ${GREEN}✓${NC} catalog categories executes successfully`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog categories output is missing categories`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog categories execution failed: ${e.message}`);
  fail++;
}

// 3. Catalog search check
try {
  const output = execSync('node bin/multimodel-dev-os.js catalog search release', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('Search Catalog Results') && output.includes('release-workflows')) {
    console.log(`  ${GREEN}✓${NC} catalog search release executes successfully`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog search release output is missing matches`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog search execution failed: ${e.message}`);
  fail++;
}

// 4. Catalog show check
try {
  const output = execSync('node bin/multimodel-dev-os.js catalog show release-workflows', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('Catalog Plugin: Release Preparation') && output.includes('release-workflows')) {
    console.log(`  ${GREEN}✓${NC} catalog show release-workflows executes successfully`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog show output is missing details`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog show execution failed: ${e.message}`);
  fail++;
}

// 5. Catalog recommend check
try {
  const output = execSync('node bin/multimodel-dev-os.js catalog recommend --target .', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('Marketplace Recommendations') && output.includes('git-workflows')) {
    console.log(`  ${GREEN}✓${NC} catalog recommend executes successfully`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog recommend output is missing recommendations`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog recommend execution failed: ${e.message}`);
  fail++;
}

// 6. Catalog status check
try {
  const output = execSync('node bin/multimodel-dev-os.js catalog status --target .', { cwd: projectRoot, encoding: 'utf8' });
  if (output.includes('Auditing Catalog Plugins') && output.includes('git-workflows')) {
    console.log(`  ${GREEN}✓${NC} catalog status executes successfully`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog status output is missing audit results`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog status execution failed: ${e.message}`);
  fail++;
}

// 7. Catalog install refusal check (no --approved)
try {
  execSync('node bin/multimodel-dev-os.js catalog install release-workflows', { cwd: projectRoot, stdio: 'pipe' });
  console.error(`  ${RED}✗${NC} catalog install without --approved should have exited with code 1, but exited with 0`);
  fail++;
} catch (e) {
  if (e.status === 1) {
    const stdOutOut = e.stdout ? e.stdout.toString() : '';
    const stdErrOut = e.stderr ? e.stderr.toString() : '';
    if (stdOutOut.includes('Installation refused') || stdErrOut.includes('Installation refused')) {
      console.log(`  ${GREEN}✓${NC} catalog install without --approved correctly refuses and exits with code 1`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog install without --approved exited with 1 but missing refusal message`);
      fail++;
    }
  } else {
    console.error(`  ${RED}✗${NC} catalog install without --approved failed with unexpected code ${e.status}: ${e.message}`);
    fail++;
  }
}

// 8. Catalog file checks and schema validations
try {
  const catalogYamlPath = join(projectRoot, '.ai', 'plugins', 'catalog.yaml');
  if (existsSync(catalogYamlPath)) {
    console.log(`  ${GREEN}✓${NC} catalog.yaml file exists in registries`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog.yaml is missing`);
    fail++;
  }

  // Parse and validate catalog plugins
  const catalogData = parseYaml(readFileSync(catalogYamlPath, 'utf8'));
  const plugins = (catalogData.catalog && catalogData.catalog.plugins) || [];
  let catalogValid = true;

  plugins.forEach(p => {
    const manifestPath = join(projectRoot, '.ai', 'plugins', 'catalog', `${p.slug}.yaml`);
    if (!existsSync(manifestPath)) {
      console.error(`  ${RED}✗${NC} Catalog plugin manifest missing for: ${p.slug}`);
      catalogValid = false;
    } else {
      // Validate manifest against plugin validate logic
      const out = execSync(`node bin/multimodel-dev-os.js plugin validate .ai/plugins/catalog/${p.slug}.yaml`, { cwd: projectRoot, encoding: 'utf8' });
      if (!out.includes('fully valid and compliant')) {
        console.error(`  ${RED}✗${NC} Catalog plugin validate failed for: ${p.slug}`);
        catalogValid = false;
      }
    }
  });

  if (catalogValid) {
    console.log(`  ${GREEN}✓${NC} all bundled catalog plugins exist and pass validation rules`);
    pass++;
  } else {
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog manifests integrity checks failed: ${e.message}`);
  fail++;
}

// 9. YAML Parser regressions check
try {
  const yamlTest = `
test_flow_array: ["git", "workflow", "vcs"]
test_quoted_string: "1.0.0"
test_comment_inside: "Work with # characters" # inline comment
test_quoted_bool: "true"
`;
  const parsed = parseYaml(yamlTest);
  if (parsed &&
      Array.isArray(parsed.test_flow_array) && parsed.test_flow_array.length === 3 && parsed.test_flow_array[0] === 'git' &&
      parsed.test_quoted_string === '1.0.0' &&
      parsed.test_comment_inside === 'Work with # characters' &&
      parsed.test_quoted_bool === 'true') {
    console.log(`  ${GREEN}✓${NC} YAML parser regression fixtures passed successfully`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} YAML parser regression fixtures failed. Flow arrays, quoted types, or comment stripping is broken.`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} YAML parser regression check crashed: ${e.message}`);
  fail++;
}

// 10. Catalog search empty result state warning check
try {
  const out = execSync('node bin/multimodel-dev-os.js catalog search no-match-term', { cwd: projectRoot, encoding: 'utf8' });
  if (out.includes('Warning: No plugins found matching')) {
    console.log(`  ${GREEN}✓${NC} catalog search empty state prints correct warning`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog search empty state does not print warning`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog search empty state check failed: ${e.message}`);
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

// Verify npm pack dry-run shows current version dynamically and has clean hygiene
try {
  const packOutput = execSync('npm pack --dry-run 2>&1', { 
    cwd: projectRoot, 
    env: { ...process.env, MMDO_ALLOW_PUBLISH: 'true' },
    encoding: 'utf8' 
  });
  const combinedOutput = packOutput;
  
  const hasVersion = combinedOutput.includes(`multimodel-dev-os@${expectedVersion}`) || combinedOutput.includes(`multimodel-dev-os-${expectedVersion}.tgz`) || combinedOutput.includes(`version: ${expectedVersion}`);
  if (hasVersion) {
    console.log(`  ${GREEN}✓${NC} npm pack --dry-run reports version ${expectedVersion}`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} npm pack --dry-run did not report ${expectedVersion} in output`);
    fail++;
  }

  // Hygiene checks
  const lines = combinedOutput.split(/\r?\n|\r/);
  const files = lines
    .filter(l => l.includes('npm notice') && !l.includes('Tarball Details') && !l.includes('Tarball Filename') && !l.includes('package size:') && !l.includes('unpacked size:') && !l.includes('shasum:') && !l.includes('integrity:') && !l.includes('total files:'))
    .map(l => {
      const match = l.match(/npm notice\s+\d+(\.\d+)?[a-zA-Z]+\s+(.+)$/);
      return match ? match[2].trim() : '';
    })
    .filter(f => f !== '');

  const hasSrc = files.some(f => f.startsWith('src/'));
  const hasTests = files.some(f => f.startsWith('tests/'));
  
  if (hasSrc && hasTests) {
    console.log(`  ${GREEN}✓${NC} npm pack includes 'src/' and 'tests/' directories`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} npm pack is missing 'src/' or 'tests/' directory`);
    fail++;
  }

  const blacklistedFiles = files.filter(f => f.includes('.npmrc') || f.includes('.env') || f.includes('node_modules') || f.endsWith('.tgz') || f.includes('coverage/'));
  if (blacklistedFiles.length === 0) {
    console.log(`  ${GREEN}✓${NC} npm pack excludes sensitive and temporary files (.npmrc, .env, node_modules, .tgz, coverage)`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} npm pack contains blacklisted files: ${blacklistedFiles.join(', ')}`);
    fail++;
  }
} catch (e) {
  const stdErrOut = e.stderr ? e.stderr.toString() : '';
  const stdOutOut = e.stdout ? e.stdout.toString() : '';
  const combined = stdErrOut + '\n' + stdOutOut;
  
  const hasVersion = combined.includes(`multimodel-dev-os@${expectedVersion}`) || combined.includes(`multimodel-dev-os-${expectedVersion}.tgz`) || combined.includes(`version: ${expectedVersion}`);
  if (hasVersion) {
    console.log(`  ${GREEN}✓${NC} npm pack --dry-run reports version ${expectedVersion}`);
    pass++;
    
    const hasSrc = combined.includes('src/') || combined.includes('src\\');
    const hasTests = combined.includes('tests/') || combined.includes('tests\\');
    if (hasSrc && hasTests) {
      console.log(`  ${GREEN}✓${NC} npm pack includes 'src/' and 'tests/' directories`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} npm pack is missing 'src/' or 'tests/' directory`);
      fail++;
    }

    const cleanCombined = combined.replace(new RegExp(`multimodel-dev-os-${expectedVersion}\\.tgz`, 'g'), '');
    const hasBlacklisted = cleanCombined.includes('.npmrc') || cleanCombined.includes('.env') || cleanCombined.includes('node_modules') || cleanCombined.includes('.tgz') || cleanCombined.includes('coverage/');
    if (!hasBlacklisted) {
      console.log(`  ${GREEN}✓${NC} npm pack excludes sensitive and temporary files`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} npm pack contains blacklisted files!`);
      fail++;
    }
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

// --- SHA256 Helper ---
function computeSHA256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

// --- v3.0.0 Trusted Registry & Policy Engine Verification Checks ---
console.log('\nRegistry & Policy Engine Verification:');

// Check policy files
checkFile('.ai/policies/registry-policy.yaml');
checkFile('.ai/schema/registry-policy.schema.json');
checkFile('.ai/registries/sources.yaml');

// Verify policy JSON schema parses
try {
  const schemaPath = join(projectRoot, '.ai', 'schema', 'registry-policy.schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  if (schema.title === 'MultiModel Dev OS Registry Policy Schema') {
    console.log(`  ${GREEN}✓${NC} registry-policy schema JSON is valid and has correct title`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} registry-policy schema JSON title mismatch`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} registry-policy schema JSON check failed: ${e.message}`);
  fail++;
}

// Verify sources.yaml parses and contains bundled source
try {
  const sourcesPath = join(projectRoot, '.ai', 'registries', 'sources.yaml');
  const sourcesYaml = readFileSync(sourcesPath, 'utf8');
  const parsed = parseYaml(sourcesYaml);
  const bundled = (parsed.sources || []).find(s => s.name === 'bundled');
  if (bundled && bundled.type === 'local') {
    console.log(`  ${GREEN}✓${NC} sources.yaml parsed and verified local bundled registry`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} sources.yaml does not contain valid local bundled registry`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} sources.yaml check failed: ${e.message}`);
  fail++;
}

// Verify default policy blocks remote registries
try {
  const policyPath = join(projectRoot, '.ai', 'policies', 'registry-policy.yaml');
  const policyYaml = readFileSync(policyPath, 'utf8');
  const parsed = parseYaml(policyYaml);
  if (parsed.allow_remote_registries === false) {
    console.log(`  ${GREEN}✓${NC} default policy blocks remote registries (allow_remote_registries = false)`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} default policy does not block remote registries`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} default policy check failed: ${e.message}`);
  fail++;
}

// Verify SHA256 helper is deterministic and works
try {
  const fixture = 'MultiModel Dev OS v3.0.0';
  const expectedHash = 'feba01a9e59c59a74a15769517aed5e4f5361fa3bd454f1b127357998bdebabe'; // sha256 of 'MultiModel Dev OS v3.0.0'
  const actualHash = computeSHA256(fixture);
  if (actualHash === expectedHash) {
    console.log(`  ${GREEN}✓${NC} SHA256 checksum helper verified successfully`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} SHA256 checksum helper mismatch. Expected: ${expectedHash}, Got: ${actualHash}`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} SHA256 helper check failed: ${e.message}`);
  fail++;
}

// Verify registry CLI commands
try {
  const helpOutput = execSync('node bin/multimodel-dev-os.js --help', { cwd: projectRoot, encoding: 'utf8' });
  if (helpOutput.includes('registry <subcmd>') && helpOutput.includes('--all-sources')) {
    console.log(`  ${GREEN}✓${NC} CLI help output includes registry commands and flags`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} CLI help output missing registry subcommands or flags`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} CLI help check failed: ${e.message}`);
  fail++;
}

try {
  const statusOutput = execSync('node bin/multimodel-dev-os.js registry status', { cwd: projectRoot, encoding: 'utf8' });
  if (statusOutput.includes('allow_remote_registries') && statusOutput.includes('bundled')) {
    console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js registry status runs cleanly`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry status output invalid`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry status failed: ${e.message}`);
  fail++;
}

try {
  const listOutput = execSync('node bin/multimodel-dev-os.js registry list', { cwd: projectRoot, encoding: 'utf8' });
  if (listOutput.includes('bundled') && listOutput.includes('local')) {
    console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js registry list runs cleanly`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry list output invalid`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry list failed: ${e.message}`);
  fail++;
}

try {
  // Syncing a non-existent or "official" source without approved should refuse or report not found
  try {
    execSync('node bin/multimodel-dev-os.js registry sync official', { cwd: projectRoot, stdio: 'pipe' });
    console.error(`  ${RED}✗${NC} registry sync official should have failed without --approved or because registry not found`);
    fail++;
  } catch (err) {
    const errText = err.stderr ? err.stderr.toString() : '';
    const outText = err.stdout ? err.stdout.toString() : '';
    if (errText.includes('not found') || outText.includes('Registry Sync Refused')) {
      console.log(`  ${GREEN}✓${NC} registry sync checks validation behavior correctly`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} registry sync verification output mismatch: ${errText || outText}`);
      fail++;
    }
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} registry sync check failed: ${e.message}`);
  fail++;
}

try {
  const verifyOutput = execSync('node bin/multimodel-dev-os.js registry verify bundled', { cwd: projectRoot, encoding: 'utf8' });
  if (verifyOutput.includes('verification passed')) {
    console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js registry verify bundled passes cleanly`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry verify bundled failed: ${verifyOutput}`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry verify bundled failed: ${e.message}`);
  fail++;
}

try {
  const showOutput = execSync('node bin/multimodel-dev-os.js registry show bundled', { cwd: projectRoot, encoding: 'utf8' });
  if (showOutput.includes('bundled') && showOutput.includes('local')) {
    console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js registry show bundled runs cleanly`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry show bundled failed: ${showOutput}`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry show bundled failed: ${e.message}`);
  fail++;
}

// Security Hotfix v3.0.2 Regression checks
console.log('\nSecurity Hotfix v3.0.2 Regression checks:');

const tempPolicyDir = join(projectRoot, 'temp-verify-policy');
const tempPolicySubdir = join(tempPolicyDir, '.ai', 'policies');
const tempPolicyFile = join(tempPolicySubdir, 'registry-policy.yaml');

try {
  // Create temporary policy directory and file
  mkdirSync(tempPolicySubdir, { recursive: true });
  writeFileSync(tempPolicyFile, 'allow_remote_registries: true\n', 'utf8');

  // 1. registry add rejects malformed URL
  try {
    execSync(`node bin/multimodel-dev-os.js registry add testmalformed not-a-url --approved --target "${tempPolicyDir}"`, { cwd: projectRoot, stdio: 'pipe' });
    console.error(`  ${RED}✗${NC} registry add should have rejected malformed URL`);
    fail++;
  } catch (err) {
    const errText = err.stderr ? err.stderr.toString() : '';
    if (errText.includes('invalid') || errText.includes('malformed')) {
      console.log(`  ${GREEN}✓${NC} registry add rejects malformed URL`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} registry add malformed URL failed with unexpected error: ${errText}`);
      fail++;
    }
  }

  // 2. registry add rejects URL containing quote/shell-injection characters
  try {
    execSync(`node bin/multimodel-dev-os.js registry add testinjection "https://example.com'console.log(1)" --approved --target "${tempPolicyDir}"`, { cwd: projectRoot, stdio: 'pipe' });
    console.error(`  ${RED}✗${NC} registry add should have rejected URL containing single quote`);
    fail++;
  } catch (err) {
    const errText = err.stderr ? err.stderr.toString() : '';
    if (errText.includes('quote') || errText.includes('invalid') || errText.includes('metacharacter')) {
      console.log(`  ${GREEN}✓${NC} registry add rejects URL containing quote/shell-injection characters`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} registry add URL with quotes failed with unexpected error: ${errText}`);
      fail++;
    }
  }

  // 3. registry add rejects non-HTTPS remote URL
  try {
    execSync(`node bin/multimodel-dev-os.js registry add testnonhttps http://example.com/catalog.yaml --approved --target "${tempPolicyDir}"`, { cwd: projectRoot, stdio: 'pipe' });
    console.error(`  ${RED}✗${NC} registry add should have rejected non-HTTPS URL`);
    fail++;
  } catch (err) {
    const errText = err.stderr ? err.stderr.toString() : '';
    if (errText.includes('Only HTTPS is permitted') || errText.includes('protocol') || errText.includes('invalid')) {
      console.log(`  ${GREEN}✓${NC} registry add rejects non-HTTPS remote URL`);
      pass++;
    } else {
      console.error(`  ${RED}✗${NC} registry add non-HTTPS URL failed with unexpected error: ${errText}`);
      fail++;
    }
  }
} catch (tempErr) {
  console.error(`  ${RED}✗${NC} Setting up temporary policy folder failed: ${tempErr.message}`);
  fail++;
} finally {
  // Clean up temporary policy directory
  try {
    if (existsSync(tempPolicyDir)) {
      rmSync(tempPolicyDir, { recursive: true, force: true });
    }
  } catch (e) {}
}

// 4. Codebase structural checks for shell-based fetch URL interpolation
try {
  const cliCode = readFileSync(join(projectRoot, 'bin', 'multimodel-dev-os.js'), 'utf8');
  
  // Check for mod.get('${targetUrl}') or similar interpolation in node -e
  const hasUnsafeSync = cliCode.includes("mod.get('${targetUrl}'") || (cliCode.includes('execSync(`node -e "') && cliCode.includes('${targetUrl}'));
  const usesExecFileSync = cliCode.includes('execFileSync(process.execPath');
  
  if (!hasUnsafeSync && usesExecFileSync) {
    console.log(`  ${GREEN}✓${NC} fetch helper uses execFileSync and does not use shell-based URL interpolation`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} codebase security check failed. Unsafe shell execution or URL interpolation detected.`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} codebase structural check failed: ${e.message}`);
  fail++;
}

// Backward compatibility catalog checks
try {
  const catList = execSync('node bin/multimodel-dev-os.js catalog list', { cwd: projectRoot, encoding: 'utf8' });
  const catSearch = execSync('node bin/multimodel-dev-os.js catalog search release', { cwd: projectRoot, encoding: 'utf8' });
  const catRecommend = execSync('node bin/multimodel-dev-os.js catalog recommend --target .', { cwd: projectRoot, encoding: 'utf8' });
  
  if (catList.includes('Git Workflows') && catSearch.includes('Release Preparation') && catRecommend.includes('Recommendations')) {
    console.log(`  ${GREEN}✓${NC} catalog commands remain backward-compatible without remote sources`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} catalog commands backward compatibility check failed`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} catalog backward compatibility check failed: ${e.message}`);
  fail++;
}

// --- Package Safety & Hygiene Checks ---
console.log('\nPackage Safety & Hygiene Checks:');
if (existsSync(join(projectRoot, '.npmrc')) && process.env.MMDO_ALLOW_PUBLISH !== 'true' && process.env.CI !== 'true' && process.env.MMDO_CI_VERIFICATION !== 'true') {
  console.error(`  ${RED}✗ .npmrc file exists in package root (security risk)${NC}`);
  fail++;
} else {
  if (existsSync(join(projectRoot, '.npmrc'))) {
    const reason = process.env.CI === 'true' ? 'CI' : (process.env.MMDO_CI_VERIFICATION === 'true' ? 'MMDO_CI_VERIFICATION' : 'MMDO_ALLOW_PUBLISH');
    console.log(`  ${YELLOW}!${NC} .npmrc file present in package root (allowed via ${reason})`);
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

// --- Registry Signing & Provenance Checks ---
console.log('\nRegistry Signing & Provenance Checks:');

// Check .gitignore contains registry-signing-key
try {
  const gitignoreContent = readFileSync(join(projectRoot, '.gitignore'), 'utf8');
  if (gitignoreContent.includes('registry-signing-key')) {
    console.log(`  ${GREEN}✓${NC} .gitignore includes registry-signing-key pattern`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} .gitignore is missing the registry-signing-key entry (secrets must be gitignored)`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to read .gitignore: ${e.message}`);
  fail++;
}

// Check provenance.js exports the expected API surface
try {
  const provenanceSrc = readFileSync(join(projectRoot, 'src', 'registry', 'provenance.js'), 'utf8');
  const hasLoadLockfile = provenanceSrc.includes('export function loadRegistryLockfile');
  const hasSaveLockfile = provenanceSrc.includes('export function saveRegistryLockfile');
  const hasUpdateEntry = provenanceSrc.includes('export function updateLockfileEntry');
  const hasGetPath = provenanceSrc.includes('export function getLockfilePath');
  if (hasLoadLockfile && hasSaveLockfile && hasUpdateEntry && hasGetPath) {
    console.log(`  ${GREEN}✓${NC} src/registry/provenance.js exports complete API (load/save/update/getPath)`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} src/registry/provenance.js is missing expected exports`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to check provenance.js: ${e.message}`);
  fail++;
}

// Check signing.js exports the expected API surface
try {
  const signingSrc = readFileSync(join(projectRoot, 'src', 'registry', 'signing.js'), 'utf8');
  const hasLoadKey = signingSrc.includes('export function loadSigningKey');
  const hasGenKey = signingSrc.includes('export function generateSigningKey');
  const hasSaveKey = signingSrc.includes('export function saveSigningKey');
  const hasSign = signingSrc.includes('export function signPayload');
  const hasVerify = signingSrc.includes('export function verifySignature');
  const hasTimingSafe = signingSrc.includes('timingSafeEqual');
  const hasEdKeygen = signingSrc.includes('export function generateEd25519KeyPair');
  const hasEdSign = signingSrc.includes('export function signEd25519Payload');
  const hasEdVerify = signingSrc.includes('export function verifyEd25519Payload');
  const hasSigBlockVerify = signingSrc.includes('export function verifySignatureBlock');
  
  if (hasLoadKey && hasGenKey && hasSaveKey && hasSign && hasVerify && hasTimingSafe && hasEdKeygen && hasEdSign && hasEdVerify && hasSigBlockVerify) {
    console.log(`  ${GREEN}✓${NC} src/registry/signing.js exports complete API (HMAC + Ed25519)`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} src/registry/signing.js is missing expected exports`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to check signing.js: ${e.message}`);
  fail++;
}

// Check trust-store.js exports expected API surface
try {
  const trustSrc = readFileSync(join(projectRoot, 'src', 'registry', 'trust-store.js'), 'utf8');
  const hasLoadTrustedKeys = trustSrc.includes('export function loadTrustedKeys');
  if (hasLoadTrustedKeys) {
    console.log(`  ${GREEN}✓${NC} src/registry/trust-store.js exports loadTrustedKeys`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} src/registry/trust-store.js is missing expected exports`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to check trust-store.js: ${e.message}`);
  fail++;
}

// Check main.js imports the new modules
try {
  const mainSrc = readFileSync(join(projectRoot, 'src', 'cli', 'main.js'), 'utf8');
  const hasProvenanceImport = mainSrc.includes("from '../registry/provenance.js'");
  const hasSigningImport = mainSrc.includes("from '../registry/signing.js'");
  const hasTrustImport = mainSrc.includes("from '../registry/trust-store.js'");
  const hasKeygenHandler = mainSrc.includes('handleRegistryKeygen');
  const hasLockHandler = mainSrc.includes('handleRegistryLock');
  const hasTrustHandler = mainSrc.includes('handleRegistryTrustList');
  if (hasProvenanceImport && hasSigningImport && hasTrustImport && hasKeygenHandler && hasLockHandler && hasTrustHandler) {
    console.log(`  ${GREEN}✓${NC} src/cli/main.js imports provenance/signing/trust-store and registers handlers`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} src/cli/main.js is missing required imports or handlers`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to check main.js integrations: ${e.message}`);
  fail++;
}

// Check that policy.js has the new fields in defaults
try {
  const policySrc = readFileSync(join(projectRoot, 'src', 'core', 'policy.js'), 'utf8');
  const hasLockfileField = policySrc.includes('require_lockfile_on_verify');
  const hasUnsignedLocal = policySrc.includes('allow_unsigned_local');
  const hasUnsignedBundled = policySrc.includes('allow_unsigned_bundled');
  const hasUnsignedRemote = policySrc.includes('allow_unsigned_remote');
  const hasTrustedKeysFile = policySrc.includes('trusted_keys_file');
  const hasAllowedAlgs = policySrc.includes('allowed_signature_algorithms');
  const hasRequireTrustedPublisher = policySrc.includes('require_trusted_publisher');
  const hasProvenanceRequired = policySrc.includes('provenance_required');
  
  if (hasLockfileField && hasUnsignedLocal && hasUnsignedBundled && hasUnsignedRemote && hasTrustedKeysFile && hasAllowedAlgs && hasRequireTrustedPublisher && hasProvenanceRequired) {
    console.log(`  ${GREEN}✓${NC} src/core/policy.js includes all Sprint 2 policy defaults`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} src/core/policy.js is missing required policy defaults`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to check policy.js: ${e.message}`);
  fail++;
}

// --- v3.5.0 Sprint 3 E2E Fixtures & Threat Model Checks ---
console.log('\nSprint 3 Signed Registry E2E & Readiness Checks:');
checkFile('src/registry/verdict.js');
checkFile('tests/unit/registry-e2e-signature-fixtures.test.js');
checkFile('docs/security-threat-model.md');
checkFile('docs/v3.5.0-readiness.md');

// Verify that the trusted-keys.yaml in the E2E fixtures directory exists
const e2eKeysPath = 'tests/fixtures/signed-registries/trusted-keys.yaml';
if (checkFile(e2eKeysPath)) {
  const e2eKeysContent = readFileSync(join(projectRoot, e2eKeysPath), 'utf8');
  if (e2eKeysContent.includes('test-key-valid') && e2eKeysContent.includes('test-key-revoked')) {
    console.log(`  ${GREEN}✓${NC} ${e2eKeysPath} is populated with test fixtures and marked for testing`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} ${e2eKeysPath} is missing expected test keys`);
    fail++;
  }
}

// Verify that the threat model document has a standard threat modeling structure
try {
  const threatModelContent = readFileSync(join(projectRoot, 'docs/security-threat-model.md'), 'utf8');
  if (threatModelContent.includes('Threat Model') && (threatModelContent.includes('STRIDE') || threatModelContent.includes('stride'))) {
    console.log(`  ${GREEN}✓${NC} docs/security-threat-model.md structure verified`);
    pass++;
  } else {
    console.error(`  ${RED}✗${NC} docs/security-threat-model.md is missing standard threat modeling structure`);
    fail++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to verify threat model document: ${e.message}`);
  fail++;
}

// Verify that no private keys are committed in main directories (like .ai/)
try {
  const rootKeyFile = '.ai/registry-signing-key';
  if (existsSync(join(projectRoot, rootKeyFile))) {
    console.error(`  ${RED}✗${NC} Private signing key ${rootKeyFile} should not be committed!`);
    fail++;
  } else {
    console.log(`  ${GREEN}✓${NC} No private registry-signing-key found in codebase root`);
    pass++;
  }
} catch (e) {
  console.error(`  ${RED}✗${NC} Failed to check private key existence: ${e.message}`);
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
