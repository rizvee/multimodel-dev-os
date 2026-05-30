#!/usr/bin/env node

/**
 * multimodel-dev-os CLI
 * Dependency-free local initialization and validation utility.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sourceRoot = resolve(__dirname, '..');

const ARGS = process.argv.slice(2);
const COMMAND = ARGS[0];

// Parse parameters manually to avoid external dependencies
function parseArgs(args) {
  const params = {
    target: process.cwd(),
    template: 'general-app',
    adapters: [],
    caveman: false,
    dryRun: false,
    force: false,
    help: false
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' || arg === '-t') {
      params.target = resolve(args[++i]);
    } else if (arg === '--template') {
      params.template = args[++i];
    } else if (arg === '--adapter' || arg === '-a') {
      params.adapters.push(args[++i]);
    } else if (arg === '--caveman') {
      params.caveman = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      params.dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      params.force = true;
    } else if (arg === '--help' || arg === '-h') {
      params.help = true;
    }
  }
  return params;
}

const params = parseArgs(ARGS);

if (params.help || !COMMAND) {
  showHelp();
  process.exit(0);
}

if (COMMAND === 'init') {
  handleInit(params);
} else if (COMMAND === 'verify') {
  handleVerify(params);
} else {
  console.error(`\x1b[31mUnknown command: ${COMMAND}\x1b[0m`);
  showHelp();
  process.exit(1);
}

function showHelp() {
  console.log('\n🧠 \x1b[36mmultimodel-dev-os CLI v0.1.1\x1b[0m');
  console.log('====================================');
  console.log('Usage: node bin/multimodel-dev-os.js <command> [options]\n');
  console.log('Commands:');
  console.log('  init       Initialize a project with configs and adapters');
  console.log('  verify     Validate structural integrity of an existing project\n');
  console.log('Options:');
  console.log('  -t, --target <path>     Target folder destination (default: current working directory)');
  console.log('  --template <name>       Template profile: nextjs-saas, wordpress-site, ecommerce-store,');
  console.log('                          seo-landing-page, general-app (default: general-app)');
  console.log('  -a, --adapter <name>    Inject specific adapter: codex, antigravity, cursor, claude, gemini, vscode');
  console.log('  --caveman               Use minimal-token templates (~79% fewer tokens)');
  console.log('  -d, --dry-run           Preview planned file actions without modifying the filesystem');
  console.log('  -f, --force             Overwrite existing files without prompting\n');
}

function handleInit(options) {
  console.log(`\n\x1b[34mInitializing multimodel-dev-os in: ${options.target}\x1b[0m`);
  console.log(`Template profile: \x1b[32m${options.template}\x1b[0m`);
  if (options.caveman) console.log('Bone variant: \x1b[33mCaveman Mode Active\x1b[0m');
  if (options.dryRun) console.log('\x1b[36mDry Run active - no actual modifications will occur\x1b[0m');

  const operations = [];
  const conflicts = [];

  // Determine core source files based on template and mode
  let agentsSrc = join(sourceRoot, 'AGENTS.md');
  let memorySrc = join(sourceRoot, 'MEMORY.md');
  let tasksSrc = join(sourceRoot, 'TASKS.md');
  let runbookSrc = join(sourceRoot, 'RUNBOOK.md');
  let configSrc = join(sourceRoot, '.ai', 'config.yaml');

  // Load custom template directories if selected
  if (options.template !== 'general-app') {
    const templateDir = join(sourceRoot, 'examples', options.template);
    if (existsSync(templateDir)) {
      agentsSrc = join(templateDir, 'AGENTS.md');
      memorySrc = join(templateDir, 'MEMORY.md');
      configSrc = join(templateDir, '.ai', 'config.yaml');
    }
  }

  // Handle Caveman Mode overrides
  if (options.caveman) {
    agentsSrc = join(sourceRoot, '.ai', 'templates', 'AGENTS.caveman.md');
    memorySrc = join(sourceRoot, '.ai', 'templates', 'MEMORY.caveman.md');
    tasksSrc = join(sourceRoot, '.ai', 'templates', 'TASKS.caveman.md');
    runbookSrc = join(sourceRoot, '.ai', 'templates', 'RUNBOOK.caveman.md');
  }

  // 1. Core Root Files
  operations.push({ dest: 'AGENTS.md', src: agentsSrc });
  operations.push({ dest: 'MEMORY.md', src: memorySrc });
  operations.push({ dest: 'TASKS.md', src: tasksSrc });
  operations.push({ dest: 'RUNBOOK.md', src: runbookSrc });
  operations.push({ dest: '.ai/config.yaml', src: configSrc });

  // 2. .ai/ Subdirectories & Core Specification Files
  const aiSubdirs = ['context', 'agents', 'skills', 'prompts', 'checks', 'templates', 'session-logs'];
  aiSubdirs.forEach(sub => {
    const srcDir = join(sourceRoot, '.ai', sub);
    if (existsSync(srcDir)) {
      readdirSync(srcDir).forEach(file => {
        operations.push({
          dest: join('.ai', sub, file),
          src: join(srcDir, file)
        });
      });
    }
  });

  // 3. Selected Adapters
  options.adapters.forEach(adapter => {
    const adapterDir = join(sourceRoot, 'adapters', adapter);
    if (existsSync(adapterDir)) {
      // Helper function to read recursive files in adapter
      const copyRecursive = (currSrc, currRel) => {
        if (statSync(currSrc).isDirectory()) {
          readdirSync(currSrc).forEach(file => {
            copyRecursive(join(currSrc, file), join(currRel, file));
          });
        } else {
          operations.push({
            dest: join('adapters', adapter, currRel),
            src: currSrc
          });
        }
      };
      readdirSync(adapterDir).forEach(file => {
        copyRecursive(join(adapterDir, file), file);
      });
    } else {
      console.warn(`\x1b[33mWarning: Adapter '${adapter}' not found. Skipping.\x1b[0m`);
    }
  });

  // Check for conflicts
  operations.forEach(op => {
    const targetFile = join(options.target, op.dest);
    if (existsSync(targetFile)) {
      if (!options.force) {
        conflicts.push(op.dest);
      }
    }
  });

  if (conflicts.length > 0) {
    console.error('\n\x1b[31m[ABORT] Overwrite Conflict Detected!\x1b[0m');
    console.error('The following files already exist in the target directory:');
    conflicts.forEach(c => console.error(`  - ${c}`));
    console.error('\nRun command with \x1b[33m--force\x1b[0m to overwrite these files.');
    process.exit(1);
  }

  // Execute operations
  operations.forEach(op => {
    const targetFile = join(options.target, op.dest);
    const targetDir = dirname(targetFile);

    if (options.dryRun) {
      console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE:\x1b[0m ${op.dest}`);
    } else {
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }
      const data = readFileSync(op.src);
      writeFileSync(targetFile, data);
      console.log(`  \x1b[32mCREATE:\x1b[0m ${op.dest}`);
    }
  });

  console.log(`\n\x1b[32m✔ Project initialized successfully! [Total Operations: ${operations.length}]\x1b[0m\n`);
}

function handleVerify(options) {
  console.log(`\n\x1b[34mRunning strict verification in: ${options.target}\x1b[0m\n`);

  let passed = 0;
  let failed = 0;

  const assertFile = (relPath) => {
    const fullPath = join(options.target, relPath);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      console.log(`  \x1b[32m✓\x1b[0m ${relPath}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✗ ${relPath} (missing)\x1b[0m`);
      failed++;
    }
  };

  // 1. Core Files
  const rootFiles = ['AGENTS.md', 'MEMORY.md', 'TASKS.md', 'RUNBOOK.md', '.ai/config.yaml'];
  rootFiles.forEach(assertFile);

  // 2. .ai/context
  const contextFiles = [
    '.ai/context/project-brief.md',
    '.ai/context/architecture.md',
    '.ai/context/business-rules.md',
    '.ai/context/seo-rules.md',
    '.ai/context/deployment-rules.md',
    '.ai/context/model-map.md',
    '.ai/context/context-budget.md'
  ];
  contextFiles.forEach(assertFile);

  // 3. .ai/agents
  const agentFiles = [
    '.ai/agents/multimodel-orchestrator.md',
    '.ai/agents/planner.md',
    '.ai/agents/coder.md',
    '.ai/agents/reviewer.md',
    '.ai/agents/qa-tester.md',
    '.ai/agents/security-auditor.md',
    '.ai/agents/seo-auditor.md',
    '.ai/agents/devops.md'
  ];
  agentFiles.forEach(assertFile);

  console.log('\n=====================================');
  if (failed > 0) {
    console.error(`  \x1b[31mVerification FAILED. [Passed: ${passed}, Failed: ${failed}]\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`  \x1b[32mVerification PASSED. [All ${passed} files present]\x1b[0m\n`);
    process.exit(0);
  }
}
