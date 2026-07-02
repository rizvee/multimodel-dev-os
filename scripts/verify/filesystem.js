import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { checkFile, checkDir, projectRoot, stats, RED, GREEN, NC } from './utils.js';

export function checkLayout() {
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
}

export function checkUntrackedFiles() {
  const checkUntracked = (relPath) => {
    if (existsSync(join(projectRoot, relPath))) {
      console.error(`  ${RED}✗${NC} ${relPath} should not be tracked/committed!`);
      stats.fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} ${relPath} is not tracked/committed`);
      stats.pass++;
    }
  };

  try {
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
        stats.fail++;
      } else {
        console.log(`  ${GREEN}✓${NC} No runtime proposals committed`);
        stats.pass++;
      }
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Tracking verification of generated files failed: ${e.message}`);
    stats.fail++;
  }
}
