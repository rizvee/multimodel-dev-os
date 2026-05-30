#!/usr/bin/env node

/**
 * multimodel-dev-os CLI
 * Dependency-free local initialization, diagnostics, and validation utility.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sourceRoot = resolve(__dirname, '..');

let version = '0.5.1';
try {
  const pkgData = JSON.parse(readFileSync(resolve(sourceRoot, 'package.json'), 'utf8'));
  version = pkgData.version;
} catch (e) {}

const ARGS = process.argv.slice(2);

// Parse parameters manually to avoid external dependencies
function parseArgs(args) {
  const params = {
    command: null,
    target: process.cwd(),
    template: 'general-app',
    adapters: [],
    caveman: false,
    dryRun: false,
    force: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
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
    } else if (!params.command && !arg.startsWith('-')) {
      params.command = arg;
    }
  }
  return params;
}

const params = parseArgs(ARGS);
const COMMAND = params.command;

const TEMPLATES = {
  'nextjs-saas': {
    name: 'nextjs-saas',
    description: 'Next.js App Router starter with TypeScript, Prisma database, Tailwind CSS, and Stripe subscription setup.',
    stack: 'Next.js 14, React 18, TypeScript, Tailwind CSS, Prisma ORM, Stripe payments',
    skill: 'nextjs-action-build.md',
    skillDesc: 'React Server Actions secure implementation conventions.'
  },
  'wordpress-site': {
    name: 'wordpress-site',
    description: 'WordPress custom block theme and plugin development profile with secure PHP database query rules.',
    stack: 'WordPress Core, PHP, Gutenberg Block APIs, theme customization hooks',
    skill: 'plugin-boilerplate.md',
    skillDesc: 'PHP hook registrations and sanitization gates boilerplate.'
  },
  'ecommerce-store': {
    name: 'ecommerce-store',
    description: 'PCI-compliant headless e-commerce store with secure checkout loops, card state validations, and Stripe webhooks.',
    stack: 'Headless Store API, cart states, secure payment webhooks, order database triggers',
    skill: 'webhook-handler.md',
    skillDesc: 'Stripe order checkout webhook secure listener verification rules.'
  },
  'seo-landing-page': {
    name: 'seo-landing-page',
    description: 'Ultra-fast static landing page layout optimized for Astro, high Core Web Vitals scores, and JSON-LD schema markup.',
    stack: 'Astro, HTML5, structured JSON-LD SEO markup, asset minification frameworks',
    skill: 'seo-audit.md',
    skillDesc: 'Lighthouse audits optimization guidelines and Core Web Vitals targets.'
  },
  'general-app': {
    name: 'general-app',
    description: 'Baseline generic fallback profile for standard backend systems (Python, Go, Node, Rust) and universal git workflows.',
    stack: 'Universal backends baseline structure, default git flow parameters',
    skill: 'example-skill.md',
    skillDesc: 'Generic baseline instructions and coding standards.'
  }
};

if (params.help || !COMMAND) {
  showHelp();
  process.exit(0);
}

if (COMMAND === 'init') {
  handleInit(params);
} else if (COMMAND === 'verify') {
  handleVerify(params);
} else if (COMMAND === 'templates' || COMMAND === 'list-templates') {
  handleListTemplates();
} else if (COMMAND === 'show-template') {
  const tName = ARGS[1];
  if (!tName || tName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a template name. Example: node bin/multimodel-dev-os.js show-template nextjs-saas\x1b[0m');
    process.exit(1);
  }
  handleShowTemplate(tName);
} else if (COMMAND === 'doctor') {
  handleDoctor(params);
} else if (COMMAND === 'validate') {
  handleValidate(params);
} else {
  console.error(`\x1b[31mUnknown command: ${COMMAND}\x1b[0m`);
  showHelp();
  process.exit(1);
}

function showHelp() {
  console.log(`\n🧠 \x1b[36mmultimodel-dev-os CLI v${version}\x1b[0m`);
  console.log('====================================');
  console.log('Usage: node bin/multimodel-dev-os.js <command> [options]\n');
  console.log('Commands:');
  console.log('  init              Initialize a project with configs and adapters');
  console.log('  verify            Validate structural integrity of an existing project');
  console.log('  templates         List all built-in template profiles with details');
  console.log('  list-templates    Alias for templates command');
  console.log('  show-template <t> Inspect detailed stack specifications of template <t>');
  console.log('  doctor            Advisory checkup of project compatibility loops and ignored folders');
  console.log('  validate          Strict validation checks to verify directory schema compliance\n');
  console.log('Options:');
  console.log('  -t, --target <path>     Target folder destination (default: current working directory)');
  console.log('  --template <name>       Template profile: nextjs-saas, wordpress-site, ecommerce-store,');
  console.log('                          seo-landing-page, general-app (default: general-app)');
  console.log('  -a, --adapter <name>    Inject specific adapter: codex, antigravity, cursor, claude, gemini, vscode');
  console.log('  --caveman               Use minimal-token templates (~79% fewer tokens)');
  console.log('  -d, --dry-run           Preview planned file actions without modifying the filesystem');
  console.log('  -f, --force             Overwrite existing files without prompting\n');
}

function handleListTemplates() {
  console.log(`\n🧠 \x1b[36mBuilt-in Template Profiles [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(TEMPLATES).forEach(key => {
    const t = TEMPLATES[key];
    console.log(`\n\x1b[32m* ${t.name}\x1b[0m`);
    console.log(`  \x1b[33mStack:\x1b[0m ${t.stack}`);
    console.log(`  \x1b[37mDescription:\x1b[0m ${t.description}`);
  });
  console.log('\nUse \x1b[36mshow-template <template-name>\x1b[0m to view detailed layout specifications.\n');
}

function handleShowTemplate(name) {
  const t = TEMPLATES[name];
  if (!t) {
    console.error(`\n\x1b[31mError: Template '${name}' does not exist. Available: nextjs-saas, wordpress-site, ecommerce-store, seo-landing-page, general-app\x1b[0m\n`);
    process.exit(1);
  }

  console.log(`\n🔍 \x1b[36mTemplate Profile: ${t.name}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mStack Blueprint:\x1b[0m ${t.stack}`);
  console.log(`\x1b[33mOverview:\x1b[0m ${t.description}`);
  console.log(`\x1b[33mHighlighted Skill:\x1b[0m .ai/skills/${t.skill}`);
  console.log(`  └─> ${t.skillDesc}`);
  console.log('\n\x1b[33mScaffolding Directory Layout:\x1b[0m');
  console.log('  ├── AGENTS.md                   (Stack building conventions)');
  console.log('  ├── MEMORY.md                   (Architectural constraints record)');
  console.log('  ├── TASKS.md                    (Pre-populated first project tasks)');
  console.log('  ├── RUNBOOK.md                  (Default operations guide)');
  console.log('  └── .ai/');
  console.log('      ├── config.yaml             (Enabled adapter options)');
  console.log('      ├── context/');
  console.log('      │   ├── project-brief.md    (Scaffolding baseline brief)');
  console.log('      │   ├── architecture.md     (Stack specific architecture map)');
  console.log('      │   ├── model-map.md        (AI routing specifications)');
  console.log('      │   └── context-budget.md   (Token allocation guidelines)');
  console.log(`      └── skills/`);
  console.log(`          └── ${t.skill}     (Custom template skills code boiler)`);
  console.log('\nUse \x1b[32minit --template ' + t.name + '\x1b[0m to bootstrap this profile.\n');
}

function handleInit(options) {
  console.log(`\n\x1b[34mInitializing multimodel-dev-os in: ${options.target}\x1b[0m`);
  console.log(`Template profile: \x1b[32m${options.template}\x1b[0m`);
  if (options.caveman) console.log('Bone variant: \x1b[33mCaveman Mode Active\x1b[0m');
  if (options.dryRun) console.log('\x1b[36mDry Run active - no actual modifications will occur\x1b[0m');

  const operations = [];
  const conflicts = [];

  // Source path mapping for core files
  let templateDir = join(sourceRoot, 'examples', options.template);
  if (!existsSync(templateDir)) {
    templateDir = join(sourceRoot, 'examples', 'general-app');
  }

  let agentsSrc = join(templateDir, 'AGENTS.md');
  let memorySrc = join(templateDir, 'MEMORY.md');
  let tasksSrc = join(templateDir, 'TASKS.md');
  let runbookSrc = join(sourceRoot, 'RUNBOOK.md'); // Global operational runbook fallback
  let configSrc = join(templateDir, '.ai', 'config.yaml');

  // Handle Caveman Mode overrides
  if (options.caveman) {
    agentsSrc = join(sourceRoot, '.ai', 'templates', 'AGENTS.caveman.md');
    memorySrc = join(sourceRoot, '.ai', 'templates', 'MEMORY.caveman.md');
    tasksSrc = join(sourceRoot, '.ai', 'templates', 'TASKS.caveman.md');
    runbookSrc = join(sourceRoot, '.ai', 'templates', 'RUNBOOK.caveman.md');
  }

  operations.push({ dest: 'AGENTS.md', src: agentsSrc });
  operations.push({ dest: 'MEMORY.md', src: memorySrc });
  operations.push({ dest: 'TASKS.md', src: tasksSrc });
  operations.push({ dest: 'RUNBOOK.md', src: runbookSrc });
  operations.push({ dest: '.ai/config.yaml', src: configSrc });

  // Add all files from template-specific context and skills folders if they exist
  const templateAiDir = join(templateDir, '.ai');
  if (existsSync(templateAiDir) && !options.caveman) {
    const subdirs = ['context', 'skills'];
    subdirs.forEach(sub => {
      const subPath = join(templateAiDir, sub);
      if (existsSync(subPath)) {
        readdirSync(subPath).forEach(file => {
          operations.push({
            dest: join('.ai', sub, file),
            src: join(subPath, file)
          });
        });
      }
    });
  }

  // Fallback to copy default global folders if files aren't already included by template
  const globalAiSubdirs = ['context', 'agents', 'skills', 'prompts', 'checks', 'templates', 'session-logs'];
  globalAiSubdirs.forEach(sub => {
    const globalPath = join(sourceRoot, '.ai', sub);
    if (existsSync(globalPath)) {
      readdirSync(globalPath).forEach(file => {
        const destRel = join('.ai', sub, file);
        // Only push if not already loaded from the template specific directory overrides
        if (!operations.some(op => op.dest === destRel)) {
          // If --caveman is active, skip regular context/skills to save token files
          if (options.caveman && (sub === 'context' || sub === 'skills' || sub === 'prompts' || sub === 'checks')) {
            return;
          }
          operations.push({
            dest: destRel,
            src: join(globalPath, file)
          });
        }
      });
    }
  });

  // Selected Adapters
  options.adapters.forEach(adapter => {
    const adapterDir = join(sourceRoot, 'adapters', adapter);
    if (existsSync(adapterDir)) {
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

  // Audit conflicts
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

  // Ensure crucial directories exist (e.g. for --caveman or missing folders check compliance)
  const dirsToEnsure = ['.ai/context', '.ai/skills', '.ai/session-logs'];
  dirsToEnsure.forEach(d => {
    const fullPath = join(options.target, d);
    if (!options.dryRun && !existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`  \x1b[32mCREATE DIR:\x1b[0m ${d}`);
    }
  });

  // Copy root-level adapter rule files if selected
  if (!options.dryRun) {
    options.adapters.forEach(adapter => {
      if (adapter === 'cursor') {
        const srcFile = join(sourceRoot, 'adapters/cursor/.cursorrules');
        const destFile = join(options.target, '.cursorrules');
        if (existsSync(srcFile)) {
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m .cursorrules`);
        }
      } else if (adapter === 'claude') {
        const srcFile = join(sourceRoot, 'adapters/claude/CLAUDE.md');
        const destFile = join(options.target, 'CLAUDE.md');
        if (existsSync(srcFile)) {
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m CLAUDE.md`);
        }
      } else if (adapter === 'vscode') {
        const srcFile = join(sourceRoot, 'adapters/vscode/.vscode/settings.json');
        const destDir = join(options.target, '.vscode');
        const destFile = join(destDir, 'settings.json');
        if (existsSync(srcFile)) {
          if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m .vscode/settings.json`);
        }
      } else if (adapter === 'gemini') {
        const srcFile = join(sourceRoot, 'adapters/gemini/GEMINI.md');
        const destFile = join(options.target, 'GEMINI.md');
        if (existsSync(srcFile)) {
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m GEMINI.md`);
        }
      } else if (adapter === 'antigravity') {
        const srcFile = join(sourceRoot, 'adapters/antigravity/.gemini/settings.json');
        const destDir = join(options.target, '.gemini');
        const destFile = join(destDir, 'settings.json');
        if (existsSync(srcFile)) {
          if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m .gemini/settings.json`);
        }
      }
    });

    // Dynamically enable selected adapters in the target .ai/config.yaml
    const targetConfigPath = join(options.target, '.ai/config.yaml');
    if (existsSync(targetConfigPath) && options.adapters.length > 0) {
      let configContent = readFileSync(targetConfigPath, 'utf8');
      options.adapters.forEach(adapter => {
        const regex = new RegExp(`${adapter}:\\s*false`, 'g');
        configContent = configContent.replace(regex, `${adapter}: true`);
      });
      writeFileSync(targetConfigPath, configContent, 'utf8');
      console.log(`  \x1b[32mUPDATE CONFIG:\x1b[0m Enabled selected adapters [${options.adapters.join(', ')}] in .ai/config.yaml`);
    }
  } else {
    // Dry run notes
    options.adapters.forEach(adapter => {
      if (adapter === 'cursor') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m .cursorrules`);
      else if (adapter === 'claude') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m CLAUDE.md`);
      else if (adapter === 'vscode') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m .vscode/settings.json`);
      else if (adapter === 'gemini') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m GEMINI.md`);
      else if (adapter === 'antigravity') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m .gemini/settings.json`);
    });
  }

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

  const rootFiles = ['AGENTS.md', 'MEMORY.md', 'TASKS.md', 'RUNBOOK.md', '.ai/config.yaml'];
  rootFiles.forEach(assertFile);

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

function handleDoctor(options) {
  console.log(`\n🩺 \x1b[36mRunning advisory doctor checkup in: ${options.target}\x1b[0m\n`);

  let warnings = 0;

  const warn = (msg) => {
    console.warn(`  \x1b[33m[WARNING]\x1b[0m ${msg}`);
    warnings++;
  };

  // 1. .gitignore checks
  const gitignorePath = join(options.target, '.gitignore');
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf8');
    if (!content.includes('node_modules')) {
      warn('.gitignore is missing node_modules! This will cause AI tools to choke by scanning dependencies.');
    }
    if (!content.includes('.env')) {
      warn('.gitignore is missing .env config boundaries! Secret tokens might get exposed to models.');
    }
  } else {
    warn('Missing .gitignore file in target workspace! AI tools might read large build artifacts.');
  }

  // 2. Build/test/lint presence inside AGENTS.md
  const agentsPath = join(options.target, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf8');
    if (!content.includes('build:') && !content.includes('build')) {
      warn('AGENTS.md is missing build command specifications.');
    }
    if (!content.includes('test:') && !content.includes('test')) {
      warn('AGENTS.md is missing test command specifications.');
    }
    if (!content.includes('lint:') && !content.includes('lint')) {
      warn('AGENTS.md is missing lint command specifications.');
    }
  } else {
    warn('AGENTS.md is missing from project root.');
  }

  // 3. Null placeholders check in MEMORY.md
  const memoryPath = join(options.target, 'MEMORY.md');
  if (existsSync(memoryPath)) {
    const content = readFileSync(memoryPath, 'utf8');
    const placeholdersCount = (content.match(/null/g) || []).length;
    if (placeholdersCount > 3) {
      warn(`MEMORY.md contains ${placeholdersCount} empty 'null' placeholders. Update project constraints.`);
    }
  }

  // 4. Tasks checklist status
  const tasksPath = join(options.target, 'TASKS.md');
  if (existsSync(tasksPath)) {
    const content = readFileSync(tasksPath, 'utf8');
    if (!content.includes('- [ ]') && !content.includes('- [/]')) {
      warn('TASKS.md has no active task section (no tasks marked as - [ ] or - [/]).');
    }
  } else {
    warn('TASKS.md is missing from project root.');
  }

  // 5. Active adapters files audit
  const configPath = join(options.target, '.ai', 'config.yaml');
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, 'utf8');
    const checkAdapter = (adapterName, filename) => {
      const regex = new RegExp(`${adapterName}:\\s*true`);
      if (regex.test(content)) {
        const filePath = join(options.target, filename);
        if (!existsSync(filePath)) {
          warn(`Adapter '${adapterName}' is enabled in .ai/config.yaml but matching adapter file '${filename}' is missing from root.`);
        }
      }
    };
    checkAdapter('cursor', '.cursorrules');
    checkAdapter('claude', 'CLAUDE.md');
    checkAdapter('gemini', 'GEMINI.md');
    checkAdapter('vscode', '.vscode/settings.json');
    checkAdapter('antigravity', '.gemini/settings.json');
  } else {
    warn('.ai/config.yaml is missing from project. Active adapters could not be audited.');
  }

  // 6. Token sinks audit
  const sinkFolders = ['node_modules', 'dist', 'build', '.next', '.git'];
  sinkFolders.forEach(folder => {
    const fullPath = join(options.target, folder);
    if (existsSync(fullPath)) {
      const gitignore = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
      if (!gitignore.includes(folder)) {
        warn(`Large token-sink directory '${folder}/' is present in workspace but not ignored in .gitignore. AI tools may read it.`);
      }
    }
  });

  console.log('\n==================================================');
  if (warnings > 0) {
    console.log(`\x1b[33mDoctor checkup complete. Found ${warnings} advisory warnings.\x1b[0m\n`);
  } else {
    console.log('\x1b[32m✔ Doctor checkup complete. Your project context layout is pristine!\x1b[0m\n');
  }
}

function handleValidate(options) {
  console.log(`\n🛡 \x1b[34mRunning strict schema validation in: ${options.target}\x1b[0m\n`);

  let errors = 0;

  const assertPath = (relPath, type) => {
    const fullPath = join(options.target, relPath);
    if (existsSync(fullPath)) {
      const stat = statSync(fullPath);
      const isOk = (type === 'file') ? stat.isFile() : stat.isDirectory();
      if (isOk) {
        console.log(`  \x1b[32m✓\x1b[0m ${relPath} (${type})`);
      } else {
        console.error(`  \x1b[31m✗ ${relPath} (expected to be a ${type})\x1b[0m`);
        errors++;
      }
    } else {
      console.error(`  \x1b[31m✗ ${relPath} (missing)\x1b[0m`);
      errors++;
    }
  };

  // 1. Assert Core files
  const core = ['AGENTS.md', 'MEMORY.md', 'TASKS.md', 'RUNBOOK.md', '.ai/config.yaml'];
  core.forEach(f => assertPath(f, 'file'));

  // 2. Assert Core folders (excluding agents first)
  const dirs = ['.ai/context', '.ai/skills', '.ai/session-logs'];
  dirs.forEach(d => assertPath(d, 'dir'));

  // 3. Assert .ai/agents exists OR global agent use is explained in AGENTS.md
  const agentsPath = join(options.target, '.ai/agents');
  const agentsExist = existsSync(agentsPath) && statSync(agentsPath).isDirectory();
  if (agentsExist) {
    console.log(`  \x1b[32m✓\x1b[0m .ai/agents (dir)`);
  } else {
    const agentsMdPath = join(options.target, 'AGENTS.md');
    let explained = false;
    if (existsSync(agentsMdPath)) {
      const agentsMdContent = readFileSync(agentsMdPath, 'utf8');
      if (
        agentsMdContent.includes('multimodel') ||
        agentsMdContent.includes('orchestrator') ||
        agentsMdContent.includes('global') ||
        agentsMdContent.includes('role') ||
        agentsMdContent.includes('Agent Roles')
      ) {
        explained = true;
      }
    }
    if (explained) {
      console.log(`  \x1b[32m✓\x1b[0m .ai/agents (missing, but global agent/orchestrator usage explained in AGENTS.md)`);
    } else {
      console.error(`  \x1b[31m✗ .ai/agents (missing and global agent use is not explained in AGENTS.md)\x1b[0m`);
      errors++;
    }
  }

  // 4. Assert Active adapters files (adapter references are not broken)
  const configPath = join(options.target, '.ai', 'config.yaml');
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, 'utf8');
    const assertAdapter = (adapterName, filename) => {
      const regex = new RegExp(`${adapterName}:\\s*true`);
      if (regex.test(content)) {
        const fullPath = join(options.target, filename);
        if (existsSync(fullPath)) {
          console.log(`  \x1b[32m✓\x1b[0m ${filename} (enabled adapter rules file verified)`);
        } else {
          console.error(`  \x1b[31m✗ ${filename} (adapter '${adapterName}' is enabled in .ai/config.yaml, but rule file is missing!)\x1b[0m`);
          errors++;
        }
      }
    };
    assertAdapter('cursor', '.cursorrules');
    assertAdapter('claude', 'CLAUDE.md');
    assertAdapter('gemini', 'GEMINI.md');
    assertAdapter('vscode', '.vscode/settings.json');
    assertAdapter('antigravity', '.gemini/settings.json');
  }

  console.log('\n==================================================');
  if (errors > 0) {
    console.error(`  \x1b[31mValidation FAILED. Found ${errors} strict structural compliance errors.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log('  \x1b[32m✔ Validation PASSED. Your project context structure is strictly compliant!\x1b[0m\n');
    process.exit(0);
  }
}
