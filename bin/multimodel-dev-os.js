#!/usr/bin/env node

/**
 * multimodel-dev-os CLI
 * Dependency-free local initialization, diagnostics, and validation utility.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sourceRoot = resolve(__dirname, '..');

let version = '2.0.1';
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
    help: false,
    tokens: false,
    modelPreset: null,
    agent: null,
    stack: null,
    mobile: null,
    aiApp: null,
    json: false,
    threshold: null,
    registry: null,
    allRegistries: false,
    release: false
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
    } else if (arg === '--tokens') {
      params.tokens = true;
    } else if (arg === '--all-registries') {
      params.allRegistries = true;
    } else if (arg === '--release') {
      params.release = true;
    } else if (arg === '--json') {
      params.json = true;
    } else if (arg === '--threshold') {
      params.threshold = args[++i];
    } else if (arg === '--registry') {
      params.registry = args[++i];
    } else if (arg === '--model-preset') {
      params.modelPreset = args[++i];
    } else if (arg === '--agent') {
      params.agent = args[++i];
    } else if (arg === '--stack') {
      params.stack = args[++i];
    } else if (arg === '--mobile') {
      params.mobile = args[++i];
    } else if (arg === '--ai-app') {
      params.aiApp = args[++i];
    } else if (!params.command && !arg.startsWith('-')) {
      params.command = arg;
    }
  }
  return params;
}

const params = parseArgs(ARGS);
const COMMAND = params.command;

function loadTemplates(customPath) {
  let path = customPath || join(sourceRoot, '.ai', 'templates', 'registry.yaml');
  try {
    if (existsSync(path)) {
      const templatesRegistry = parseYaml(readFileSync(path, 'utf8'));
      return templatesRegistry.templates || {};
    }
  } catch (e) {}
  return {
    'general-app': {
      name: 'general-app',
      description: 'Baseline generic fallback profile for standard backend systems.',
      stack: 'Universal backends baseline structure',
      skill: 'example-skill.md',
      skillDesc: 'Generic baseline instructions and coding standards.',
      status: 'stable',
      maturity: 'production-ready',
      required_files: ['AGENTS.md', 'MEMORY.md', 'TASKS.md', 'RUNBOOK.md', '.ai/config.yaml']
    }
  };
}

function loadAdapters(customPath) {
  let path = customPath || join(sourceRoot, '.ai', 'adapters', 'registry.yaml');
  try {
    if (existsSync(path)) {
      const adaptersRegistry = parseYaml(readFileSync(path, 'utf8'));
      return adaptersRegistry.adapters || {};
    }
  } catch (e) {}
  return {};
}

const TEMPLATES = loadTemplates(params.registry);
const ADAPTERS = loadAdapters(params.registry);

if (params.help || !COMMAND) {
  showHelp();
  process.exit(0);
}

if (COMMAND === 'init') {
  if (params.mobile === 'android') {
    params.template = 'expo-react-native-android';
  } else if (params.aiApp === 'rag') {
    params.template = 'rag-knowledge-base';
  }
  handleInit(params);
} else if (COMMAND === 'verify') {
  handleVerify(params);
} else if (COMMAND === 'scan') {
  handleScan(params);
} else if (COMMAND === 'memory') {
  const sub = ARGS[1];
  if (sub === 'build') {
    handleMemoryBuild(params);
  } else if (sub === 'refresh') {
    handleMemoryRefresh(params);
  } else if (sub === 'diff') {
    handleMemoryDiff(params);
  } else {
    console.error(`\x1b[31mError: Please specify a memory subcommand: build, refresh, or diff.\x1b[0m`);
    console.error(`Example: node bin/multimodel-dev-os.js memory build`);
    process.exit(1);
  }
} else if (COMMAND === 'templates' || COMMAND === 'list-templates') {
  handleListTemplates(params);
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
} else if (COMMAND === 'validate-template') {
  const tName = ARGS[1];
  if (!tName || tName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a template name. Example: node bin/multimodel-dev-os.js validate-template nextjs-saas\x1b[0m');
    process.exit(1);
  }
  handleValidateTemplate(tName);
} else if (COMMAND === 'validate-adapter') {
  const aName = ARGS[1];
  if (!aName || aName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify an adapter name. Example: node bin/multimodel-dev-os.js validate-adapter cursor\x1b[0m');
    process.exit(1);
  }
  handleValidateAdapter(aName);
} else if (COMMAND === 'validate-skill') {
  const sName = ARGS[1];
  if (!sName || sName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a skill name. Example: node bin/multimodel-dev-os.js validate-skill custom-skill.example\x1b[0m');
    process.exit(1);
  }
  handleValidateSkill(sName, params);
} else if (COMMAND === 'models') {
  handleListModels(params);
} else if (COMMAND === 'show-model') {
  const mName = ARGS[1];
  if (!mName || mName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a model name. Example: node bin/multimodel-dev-os.js show-model claude-sonnet-latest\x1b[0m');
    process.exit(1);
  }
  handleShowModel(mName);
} else if (COMMAND === 'providers') {
  handleListProviders();
} else if (COMMAND === 'route-model') {
  const taskName = ARGS[1];
  if (!taskName || taskName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a task. Example: node bin/multimodel-dev-os.js route-model planning\x1b[0m');
    process.exit(1);
  }
  handleRouteModel(taskName);
} else if (COMMAND === 'adapters') {
  handleListAdapters(params);
} else if (COMMAND === 'show-adapter') {
  const aName = ARGS[1];
  if (!aName || aName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify an adapter name. Example: node bin/multimodel-dev-os.js show-adapter cursor\x1b[0m');
    process.exit(1);
  }
  handleShowAdapter(aName);
} else if (COMMAND === 'skills') {
  handleListSkills(params);
} else if (COMMAND === 'show-skill') {
  const sName = ARGS[1];
  if (!sName || sName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a skill name. Example: node bin/multimodel-dev-os.js show-skill bug-fix\x1b[0m');
    process.exit(1);
  }
  handleShowSkill(sName, params);
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
  console.log('  scan              Scan project structure and framework signals');
  console.log('  memory <subcmd>   Manage hash-compressed codebase memory (subcmd: build, refresh, diff)');
  console.log('  verify            Validate structural integrity of an existing project');
  console.log('  templates         List all built-in template profiles with details');
  console.log('  list-templates    Alias for templates command');
  console.log('  show-template <t> Inspect detailed stack specifications of template <t>');
  console.log('  doctor            Advisory checkup of project compatibility loops and ignored folders');
  console.log('  validate          Strict validation checks to verify directory schema compliance');
  console.log('  validate-template Validate registry keys and source folder files for template');
  console.log('  validate-adapter  Validate registry keys and source assets for IDE adapter');
  console.log('  validate-skill    Verify custom skill conforms to core prompt structure');
  console.log('  models            List registered model aliases in the capabilities registry');
  console.log('  show-model <m>    View specifications of model <m> in registry');
  console.log('  providers         List configured AI provider API endpoints');
  console.log('  route-model <tsk> Suggest optimal model mapping for task <tsk>');
  console.log('  adapters          List IDE and terminal tool adapters');
  console.log('  show-adapter <a>  Inspect config specifications of adapter <a>');
  console.log('  skills            List active skills custom prompts in target workspace');
  console.log('  show-skill <s>    View prompt contents of target workspace skill <s>\n');
  console.log('Options:');
  console.log('  -t, --target <path>     Target folder destination (default: current working directory)');
  console.log('  --template <name>       Template profile: nextjs-saas, expo-react-native-android, etc.');
  console.log('  -a, --adapter <name>    Inject specific adapter: cursor, claude, vscode, gemini, etc.');
  console.log('  --caveman               Use minimal-token templates (~79% fewer tokens)');
  console.log('  --tokens                Run a deeper token-sink size analysis during doctor checkup');
  console.log('  --json                  Output raw JSON data for listing commands (models, adapters, templates)');
  console.log('  --threshold <val>       Set custom size threshold for doctor tokens checks (e.g. 50KB)');
  console.log('  --registry <path>       Override default registry (for templates/adapters list or check)');
  console.log('  -d, --dry-run           Preview planned file actions without modifying the filesystem');
  console.log('  -f, --force             Overwrite existing files without prompting\n');
}

function handleListTemplates(options) {
  if (options && options.json) {
    console.log(JSON.stringify(TEMPLATES, null, 2));
    return;
  }
  console.log(`\n🧠 \x1b[36mBuilt-in Template Profiles [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(TEMPLATES).forEach(key => {
    const t = TEMPLATES[key];
    const statusStr = t.status === 'planned' ? ' (Planned)' : t.status === 'experimental' ? ' (Experimental)' : '';
    console.log(`\n\x1b[32m* ${t.name}${statusStr}\x1b[0m`);
    console.log(`  \x1b[33mStack:\x1b[0m ${t.stack}`);
    console.log(`  \x1b[37mDescription:\x1b[0m ${t.description}`);
  });
  console.log('\nUse \x1b[36mshow-template <template-name>\x1b[0m to view detailed layout specifications.\n');
}

function handleShowTemplate(name) {
  const t = TEMPLATES[name];
  if (!t) {
    const available = Object.keys(TEMPLATES).join(', ');
    console.error(`\n\x1b[31mError: Template '${name}' does not exist. Available: ${available}\x1b[0m\n`);
    process.exit(1);
  }

  const statusStr = t.status === 'planned' ? ' (Planned)' : t.status === 'experimental' ? ' (Experimental)' : ' (Stable)';
  console.log(`\n🔍 \x1b[36mTemplate Profile: ${t.name}${statusStr}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mStack Blueprint:\x1b[0m ${t.stack}`);
  console.log(`\x1b[33mOverview:\x1b[0m ${t.description}`);
  if (t.skill) {
    console.log(`\x1b[33mHighlighted Skill:\x1b[0m .ai/skills/${t.skill}`);
    console.log(`  └─> ${t.skillDesc}`);
  }
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
  if (t.skill) {
    console.log(`          └── ${t.skill}     (Custom template skills code boiler)`);
  } else {
    console.log(`          └── [custom-skill].md   (Custom template skills code boiler)`);
  }
  console.log('\nUse \x1b[32minit --template ' + t.name + '\x1b[0m to bootstrap this profile.\n');
}

function handleInit(options) {
  console.log(`\n\x1b[34mInitializing multimodel-dev-os in: ${options.target}\x1b[0m`);
  
  // Check if requested template is planned
  const tInfo = TEMPLATES[options.template];
  if (tInfo && tInfo.status === 'planned') {
    console.warn(`  \x1b[33m[WARNING] Template '${options.template}' is planned for a future release and is not yet available.\x1b[0m`);
    console.warn(`  To view available templates, run: \x1b[36mnpx multimodel-dev-os templates\x1b[0m`);
    console.warn(`  Falling back to the stable \x1b[32m'general-app'\x1b[0m profile...\n`);
    options.template = 'general-app';
  }

  console.log(`Template profile: \x1b[32m${options.template}\x1b[0m`);
  if (options.caveman) console.log('Bone variant: \x1b[33mCaveman Mode Active\x1b[0m');
  if (options.dryRun) console.log('\x1b[36mDry Run active - no actual modifications will occur\x1b[0m');

  const operations = [];
  const conflicts = [];

  // Source path mapping for core files
  let templateDir = join(sourceRoot, 'examples', options.template);
  if (!existsSync(templateDir)) {
    console.warn(`  \x1b[33m[WARNING] Template '${options.template}' source files could not be found.\x1b[0m`);
    console.warn(`  To view available templates, run: \x1b[36mnpx multimodel-dev-os templates\x1b[0m`);
    console.warn(`  Falling back to the stable \x1b[32m'general-app'\x1b[0m profile...\n`);
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
      const a = ADAPTERS[adapter];
      if (a && a.rules_file) {
        const srcFile = join(sourceRoot, 'adapters', adapter, a.rules_file);
        const destFile = join(options.target, a.rules_file);
        const destDir = dirname(destFile);
        if (existsSync(srcFile)) {
          if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m ${a.rules_file}`);
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
      const a = ADAPTERS[adapter];
      if (a && a.rules_file) {
        console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m ${a.rules_file}`);
      }
    });
  }

  console.log(`\n\x1b[32m✔ Project initialized successfully! [Total Operations: ${operations.length}]\x1b[0m\n`);
  console.log(`\x1b[36mNext Steps to Complete Integration:\x1b[0m`);
  console.log(`  1. \x1b[1mEdit AGENTS.md\x1b[0m in your project root to document your stack context.`);
  console.log(`  2. \x1b[1mEdit .ai/config.yaml\x1b[0m to configure active model routing presets.`);
  if (options.adapters.length > 0) {
    console.log(`  3. \x1b[1mActivate IDE / Agent Rules:\x1b[0m`);
    console.log(`     Ensure adapter configuration files are copied or linked to the root of your workspace:`);
    options.adapters.forEach(adapter => {
      const a = ADAPTERS[adapter];
      if (a && a.rules_file) {
        console.log(`     - For \x1b[32m${a.name || adapter}\x1b[0m: Check the root-level \x1b[33m${a.rules_file}\x1b[0m file`);
      }
    });
  } else {
    console.log(`  3. \x1b[1mSelect IDE / Tool Adapters:\x1b[0m`);
    console.log(`     To generate rules for Cursor, Claude Code, etc., run:`);
    console.log(`     \x1b[36mnpx multimodel-dev-os init --adapter cursor --adapter claude\x1b[0m`);
  }
  console.log(`  4. \x1b[1mRun Diagnostics:\x1b[0m`);
  console.log(`     Verify your workspace structural compliance:`);
  console.log(`     \x1b[36mnpx multimodel-dev-os validate\x1b[0m`);
  console.log(`     \x1b[36mnpx multimodel-dev-os doctor\x1b[0m\n`);
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
  if (options.tokens) {
    handleDoctorTokens(options);
    return;
  }
  if (options.release) {
    handleDoctorRelease(options);
    return;
  }
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
  if (options && options.allRegistries) {
    handleValidateAllRegistries();
    return;
  }
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

  // Template-specific validation
  if (options.template) {
    const tInfo = TEMPLATES[options.template];
    if (tInfo && Array.isArray(tInfo.required_files)) {
      console.log(`\n📋 Validating required files for template '${options.template}':`);
      tInfo.required_files.forEach(f => assertPath(f, 'file'));
    } else if (options.template === 'expo-react-native-android') {
      const mobileFiles = [
        'app.json',
        'eas.json',
        'app.config.ts',
        'jest.config.js',
        'src/app/_layout.tsx',
        'src/lib/secure-storage.ts',
        'src/services/api-client.ts'
      ];
      mobileFiles.forEach(f => assertPath(f, 'file'));
    }
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
    console.warn(`\x1b[33m[WARNING] Failed to parse YAML: ${e.message}\x1b[0m`);
    return {};
  }
}

// --- Command Handler Functions ---
function handleListModels(options) {
  const registryPath = join(sourceRoot, '.ai', 'models', 'registry.yaml');
  if (!existsSync(registryPath)) {
    console.error('Error: Model registry not found.');
    process.exit(1);
  }
  const registry = parseYaml(readFileSync(registryPath, 'utf8'));
  const models = registry.models || {};
  if (options && options.json) {
    console.log(JSON.stringify(models, null, 2));
    return;
  }
  console.log(`\n🤖 \x1b[36mModel Registry [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(models).forEach(name => {
    const m = models[name];
    console.log(`\n\x1b[32m* ${name}\x1b[0m (${m.alias || ''})`);
    console.log(`  \x1b[33mProvider:\x1b[0m ${m.provider}`);
    console.log(`  \x1b[33mOfficial ID:\x1b[0m ${m.official_id}`);
    console.log(`  \x1b[33mContext Window:\x1b[0m ${m.context_window} tokens`);
    console.log(`  \x1b[33mTiers:\x1b[0m Cost: ${m.tiers?.cost}, Reasoning: ${m.tiers?.reasoning}, Coding: ${m.tiers?.coding}`);
  });
  console.log('\nUse \x1b[36mshow-model <model-alias>\x1b[0m to view detailed model capabilities.\n');
}

function handleShowModel(name) {
  const registryPath = join(sourceRoot, '.ai', 'models', 'registry.yaml');
  if (!existsSync(registryPath)) {
    console.error('Error: Model registry not found.');
    process.exit(1);
  }
  const registry = parseYaml(readFileSync(registryPath, 'utf8'));
  const models = registry.models || {};
  const m = models[name];
  if (!m) {
    console.error(`\x1b[31mError: Model alias '${name}' not found in registry.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n🔍 \x1b[36mModel: ${name}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mProvider:\x1b[0m ${m.provider}`);
  console.log(`\x1b[33mAlias:\x1b[0m ${m.alias}`);
  console.log(`\x1b[33mOfficial ID:\x1b[0m ${m.official_id}`);
  console.log(`\x1b[33mContext Window:\x1b[0m ${m.context_window} tokens`);
  console.log(`\x1b[33mCapabilities:\x1b[0m`);
  console.log(`  ├─ Vision: ${m.capabilities?.vision ? 'Yes' : 'No'}`);
  console.log(`  └─ Tool Use: ${m.capabilities?.tool_use ? 'Yes' : 'No'}`);
  console.log(`\x1b[33mTiers:\x1b[0m`);
  console.log(`  ├─ Cost: ${m.tiers?.cost}`);
  console.log(`  ├─ Speed: ${m.tiers?.speed}`);
  console.log(`  ├─ Reasoning: ${m.tiers?.reasoning}`);
  console.log(`  └─ Coding: ${m.tiers?.coding}`);
  console.log();
}

function handleListProviders() {
  const providersPath = join(sourceRoot, '.ai', 'models', 'providers.yaml');
  if (!existsSync(providersPath)) {
    console.error('Error: Providers registry not found.');
    process.exit(1);
  }
  const reg = parseYaml(readFileSync(providersPath, 'utf8'));
  const providers = reg.providers || {};
  console.log(`\n🔌 \x1b[36mAI Providers [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(providers).forEach(name => {
    const p = providers[name];
    console.log(`\n\x1b[32m* ${p.name || name}\x1b[0m (${name})`);
    console.log(`  \x1b[33mEndpoint:\x1b[0m ${p.api_endpoint || 'Local'}`);
    console.log(`  \x1b[33mEnv Key:\x1b[0m ${p.env_key || 'None'}`);
  });
  console.log();
}

function handleRouteModel(task) {
  const presetsPath = join(sourceRoot, '.ai', 'models', 'routing-presets.yaml');
  if (!existsSync(presetsPath)) {
    console.error('Error: Routing presets not found.');
    process.exit(1);
  }
  const reg = parseYaml(readFileSync(presetsPath, 'utf8'));
  const presets = reg.presets || {};
  const preset = presets[task];
  if (!preset) {
    console.error(`\x1b[31mError: Routing preset for task '${task}' not found. Available: ${Object.keys(presets).join(', ')}\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n🎯 \x1b[36mRouting Suggestion for: ${task}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mPrimary Model:\x1b[0m \x1b[32m${preset.primary}\x1b[0m`);
  console.log(`\x1b[33mFallback Model:\x1b[0m \x1b[33m${preset.fallback}\x1b[0m`);
  console.log();
}

function handleListAdapters(options) {
  const adaptersPath = join(sourceRoot, '.ai', 'adapters', 'registry.yaml');
  if (!existsSync(adaptersPath)) {
    console.error('Error: Adapters registry not found.');
    process.exit(1);
  }
  const reg = parseYaml(readFileSync(adaptersPath, 'utf8'));
  const adapters = reg.adapters || {};
  if (options && options.json) {
    console.log(JSON.stringify(adapters, null, 2));
    return;
  }
  console.log(`\n🔌 \x1b[36mIDE & Agent Adapters [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(adapters).forEach(name => {
    const a = adapters[name];
    console.log(`\n\x1b[32m* ${a.name || name}\x1b[0m (${name})`);
    console.log(`  \x1b[33mRules File:\x1b[0m ${a.rules_file}`);
    console.log(`  \x1b[33mAdapter Type:\x1b[0m ${a.type}`);
    console.log(`  \x1b[33mRule Format:\x1b[0m ${a.format}`);
  });
  console.log('\nUse \x1b[36mshow-adapter <adapter-name>\x1b[0m to view detailed adapter metadata.\n');
}

function handleShowAdapter(name) {
  const adaptersPath = join(sourceRoot, '.ai', 'adapters', 'registry.yaml');
  if (!existsSync(adaptersPath)) {
    console.error('Error: Adapters registry not found.');
    process.exit(1);
  }
  const reg = parseYaml(readFileSync(adaptersPath, 'utf8'));
  const adapters = reg.adapters || {};
  const a = adapters[name];
  if (!a) {
    console.error(`\x1b[31mError: Adapter '${name}' not found in registry.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n🔍 \x1b[36mAdapter: ${a.name || name}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mRules File:\x1b[0m ${a.rules_file}`);
  console.log(`\x1b[33mType:\x1b[0m ${a.type}`);
  console.log(`\x1b[33mFormat:\x1b[0m ${a.format}`);
  console.log();
}

function handleListSkills(options) {
  const skillsDir = join(options.target, '.ai', 'skills');
  if (!existsSync(skillsDir)) {
    console.log('\n\x1b[33m[Notice] .ai/skills directory is not initialized in the target workspace.\x1b[0m\n');
    return;
  }
  const files = readdirSync(skillsDir).filter(f => f.endsWith('.md'));
  console.log(`\n🧠 \x1b[36mAvailable Skills in Target [v${version}]\x1b[0m`);
  console.log('==================================================');
  files.forEach(f => {
    console.log(`  \x1b[32m- ${f.replace('.md', '')}\x1b[0m (file: .ai/skills/${f})`);
  });
  console.log('\nUse \x1b[36mshow-skill <skill-name>\x1b[0m to read a skill\'s prompt text.\n');
}

function handleShowSkill(name, options) {
  const skillsDir = join(options.target, '.ai', 'skills');
  const skillFile = join(skillsDir, name.endsWith('.md') ? name : `${name}.md`);
  if (!existsSync(skillFile)) {
    console.error(`\x1b[31mError: Skill '${name}' not found in target .ai/skills/.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n📖 \x1b[36mSkill Prompt: ${name}\x1b[0m`);
  console.log('==================================================');
  console.log(readFileSync(skillFile, 'utf8'));
  console.log();
}

function parseThresholdToBytes(val) {
  if (!val) return 100 * 1024; // Default 100KB
  const matches = val.match(/^(\d+)(KB|MB|B)?$/i);
  if (!matches) return 100 * 1024;
  const num = parseInt(matches[1], 10);
  const unit = (matches[2] || '').toUpperCase();
  if (unit === 'MB') return num * 1024 * 1024;
  if (unit === 'KB') return num * 1024;
  return num;
}

function handleDoctorTokens(options) {
  console.log(`\n🪙 \x1b[36mRunning Token Budget & Sink Audit in: ${options.target}\x1b[0m\n`);
  
  const filesFound = [];
  const ignoredDirs = ['.git', 'node_modules', 'dist', 'build', '.next', '.expo', 'bin', 'assets', 'docs', 'web-build', 'out', 'coverage', '.nuxt', '.svelte-kit', 'bower_components', 'vendor'];
  
  function scan(dir) {
    if (!existsSync(dir)) return;
    const items = readdirSync(dir);
    for (const item of items) {
      if (ignoredDirs.includes(item)) continue;
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (stat.isFile()) {
          filesFound.push({
            relPath: replaceBackslashes(fullPath.replace(options.target, '')),
            size: stat.size
          });
        }
      } catch (e) {}
    }
  }

  function replaceBackslashes(p) {
    let clean = p.replace(/\\/g, '/');
    if (clean.startsWith('/')) clean = clean.substring(1);
    return clean;
  }

  scan(options.target);
  
  filesFound.sort((a, b) => b.size - a.size);
  
  const thresholdBytes = parseThresholdToBytes(options.threshold);
  const thresholdStr = options.threshold || '100KB';

  console.log('Top 10 Largest Files in Scanned Workspace:');
  filesFound.slice(0, 10).forEach(f => {
    let sizeDesc = `${f.size} bytes`;
    if (f.size > 1024 * 1024) sizeDesc = `${(f.size / (1024 * 1024)).toFixed(2)} MB`;
    else if (f.size > 1024) sizeDesc = `${(f.size / 1024).toFixed(2)} KB`;
    
    let color = '\x1b[32m';
    if (f.size > thresholdBytes) color = '\x1b[31m';
    else if (f.size > thresholdBytes * 0.3) color = '\x1b[33m';
    
    console.log(`  ${color}* ${f.relPath}\x1b[0m (${sizeDesc})`);
  });
  
  console.log('\n==================================================');
  console.log(`Total Scanned Files: ${filesFound.length}`);
  console.log(`Recommendation: Exclude files in red (>${thresholdStr}) from active coding prompts or add them to your adapter ignore rules.`);
  console.log();
}

function handleValidateTemplate(name) {
  const t = TEMPLATES[name];
  if (!t) {
    console.error(`\x1b[31mError: Template '${name}' not found in registry.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n📋 \x1b[34mValidating Template: ${name}\x1b[0m`);
  
  let errors = 0;
  const reqKeys = ['name', 'description', 'stack', 'category', 'status', 'maturity', 'required_files'];
  reqKeys.forEach(k => {
    if (t[k] === undefined || t[k] === null) {
      console.error(`  \x1b[31m✗ Missing registry key: ${k}\x1b[0m`);
      errors++;
    } else {
      console.log(`  \x1b[32m✓\x1b[0m Registry key: ${k}`);
    }
  });

  const templateDir = join(sourceRoot, 'examples', name);
  if (!existsSync(templateDir)) {
    console.error(`  \x1b[31m✗ Source folder missing: examples/${name}\x1b[0m`);
    errors++;
  } else {
    console.log(`  \x1b[32m✓\x1b[0m Source folder: examples/${name}`);
    if (Array.isArray(t.required_files)) {
      t.required_files.forEach(f => {
        const filePath = join(templateDir, f);
        const globalPath = join(sourceRoot, f);
        if (existsSync(filePath)) {
          console.log(`  \x1b[32m✓\x1b[0m Required file (template override): ${f}`);
        } else if (existsSync(globalPath)) {
          console.log(`  \x1b[32m✓\x1b[0m Required file (global fallback): ${f}`);
        } else {
          console.error(`  \x1b[31m✗ Required file missing: ${f}\x1b[0m`);
          errors++;
        }
      });
    }
  }

  if (errors > 0) {
    console.error(`\n\x1b[31mValidation FAILED with ${errors} errors.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\n\x1b[32m✔ Template '${name}' is fully valid and compliant!\x1b[0m\n`);
    process.exit(0);
  }
}

function handleValidateAdapter(name) {
  const a = ADAPTERS[name];
  if (!a) {
    console.error(`\x1b[31mError: Adapter '${name}' not found in registry.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n📋 \x1b[34mValidating Adapter: ${name}\x1b[0m`);
  
  let errors = 0;
  const reqKeys = ['name', 'rules_file', 'format', 'type'];
  reqKeys.forEach(k => {
    if (!a[k]) {
      console.error(`  \x1b[31m✗ Missing registry key: ${k}\x1b[0m`);
      errors++;
    } else {
      console.log(`  \x1b[32m✓\x1b[0m Registry key: ${k}`);
    }
  });

  const adapterDir = join(sourceRoot, 'adapters', name);
  if (!existsSync(adapterDir)) {
    console.error(`  \x1b[31m✗ Source folder missing: adapters/${name}\x1b[0m`);
    errors++;
  } else {
    console.log(`  \x1b[32m✓\x1b[0m Source folder: adapters/${name}`);
    const setupFile = join(adapterDir, 'setup.md');
    if (existsSync(setupFile)) {
      console.log(`  \x1b[32m✓\x1b[0m Required file: setup.md`);
    } else {
      console.error(`  \x1b[31m✗ Required file missing: adapters/${name}/setup.md\x1b[0m`);
      errors++;
    }

    if (a.rules_file) {
      const rulesFile = join(adapterDir, a.rules_file);
      if (existsSync(rulesFile)) {
        console.log(`  \x1b[32m✓\x1b[0m Rules file: ${a.rules_file}`);
      } else {
        console.error(`  \x1b[31m✗ Rules file missing: adapters/${name}/${a.rules_file}\x1b[0m`);
        errors++;
      }
    }
  }

  if (errors > 0) {
    console.error(`\n\x1b[31mValidation FAILED with ${errors} errors.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\n\x1b[32m✔ Adapter '${name}' is fully valid and compliant!\x1b[0m\n`);
    process.exit(0);
  }
}

function handleValidateSkill(name, options) {
  const skillsDir = join(options.target, '.ai', 'skills');
  let skillFile = join(skillsDir, name.endsWith('.md') ? name : `${name}.md`);
  if (!existsSync(skillFile)) {
    skillFile = join(sourceRoot, '.ai', 'skills', name.endsWith('.md') ? name : `${name}.md`);
  }

  if (!existsSync(skillFile)) {
    console.error(`\x1b[31mError: Skill '${name}' not found.\x1b[0m`);
    process.exit(1);
  }

  console.log(`\n📋 \x1b[34mValidating Skill: ${name}\x1b[0m`);
  const content = readFileSync(skillFile, 'utf8');
  let errors = 0;

  const reqHeaders = [
    { header: '# Purpose', regex: /^#\s+Purpose/mi },
    { header: '# Activation Trigger', regex: /^#\s+Activation\s+Trigger/mi },
    { header: '# Input Context', regex: /^#\s+Input\s+Context/mi },
    { header: '# Output Contract', regex: /^#\s+Output\s+Contract/mi },
    { header: '# Token Budget', regex: /^#\s+Token\s+Budget/mi }
  ];

  reqHeaders.forEach(req => {
    if (req.regex.test(content)) {
      console.log(`  \x1b[32m✓\x1b[0m Found required header: ${req.header}`);
    } else {
      console.error(`  \x1b[31m✗ Missing required header: ${req.header}\x1b[0m`);
      errors++;
    }
  });

  if (errors > 0) {
    console.error(`\n\x1b[31mValidation FAILED with ${errors} errors.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\n\x1b[32m✔ Skill '${name}' is fully valid and compliant!\x1b[0m\n`);
    process.exit(0);
  }
}

function handleValidateAllRegistries() {
  console.log(`\n🛡 \x1b[34mValidating All Registry Entries\x1b[0m\n`);
  let errors = 0;

  // Validate all templates
  console.log('--- Templates Registry Validation ---');
  Object.keys(TEMPLATES).forEach(name => {
    const t = TEMPLATES[name];
    console.log(`\nValidating Template: ${name}`);
    const reqKeys = ['name', 'description', 'stack', 'category', 'status', 'maturity'];
    if (t.status !== 'planned') {
      reqKeys.push('required_files');
    }
    reqKeys.forEach(k => {
      if (t[k] === undefined || t[k] === null) {
        console.error(`  \x1b[31m✗ Missing registry key: ${k}\x1b[0m`);
        errors++;
      }
    });

    const templateDir = join(sourceRoot, 'examples', name);
    if (t.status === 'stable' && !existsSync(templateDir)) {
      console.error(`  \x1b[31m✗ Stable template source folder missing: examples/${name}\x1b[0m`);
      errors++;
    }
  });

  // Validate all adapters
  console.log('\n--- Adapters Registry Validation ---');
  Object.keys(ADAPTERS).forEach(name => {
    const a = ADAPTERS[name];
    console.log(`Validating Adapter: ${name}`);
    const reqKeys = ['name', 'rules_file', 'format', 'type'];
    reqKeys.forEach(k => {
      if (!a[k]) {
        console.error(`  \x1b[31m✗ Missing registry key: ${k}\x1b[0m`);
        errors++;
      }
    });
  });

  console.log('\n==================================================');
  if (errors > 0) {
    console.error(`  \x1b[31mAll Registries validation FAILED. Found ${errors} schema errors.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log('  \x1b[32m✔ All Registries validation PASSED. All templates and adapters are valid.\x1b[0m\n');
    process.exit(0);
  }
}

function handleDoctorRelease(options) {
  console.log(`\n🩺 \x1b[36mRunning release audit doctor in: ${sourceRoot}\x1b[0m\n`);
  let warnings = 0;

  // 1. Version checks
  let packageVersion = 'unknown';
  try {
    const pkg = JSON.parse(readFileSync(join(sourceRoot, 'package.json'), 'utf8'));
    packageVersion = pkg.version;
    console.log(`  \x1b[32m✓\x1b[0m package.json version: ${packageVersion}`);
  } catch (e) {
    console.warn('  \x1b[31m✗\x1b[0m Failed to parse package.json');
    warnings++;
  }

  const checkInstallScript = (filename, regex) => {
    const filePath = join(sourceRoot, filename);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8');
      const match = content.match(regex);
      if (match && match[1] === packageVersion) {
        console.log(`  \x1b[32m✓\x1b[0m ${filename} version aligns: ${match[1]}`);
      } else {
        console.warn(`  \x1b[33m[WARNING]\x1b[0m ${filename} version mismatch (found ${match ? match[1] : 'none'}, expected ${packageVersion})`);
        warnings++;
      }
    }
  };

  checkInstallScript('scripts/install.sh', /VERSION="([^"]+)"/i);
  checkInstallScript('scripts/install.ps1', /\$VERSION\s*=\s*"([^"]+)"/i);

  // 2. Blacklisted files audit
  const blacklist = ['.npmrc'];
  blacklist.forEach(file => {
    const fullPath = join(sourceRoot, file);
    if (existsSync(fullPath)) {
      console.warn(`  \x1b[33m[WARNING]\x1b[0m Blacklisted file found in release root: ${file}`);
      warnings++;
    } else {
      console.log(`  \x1b[32m✓\x1b[0m No root blacklisted file: ${file}`);
    }
  });

  // Recursively scan examples/ for .env and keystores
  const scanSafety = (dir) => {
    if (!existsSync(dir)) return;
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scanSafety(fullPath);
        } else if (stat.isFile()) {
          if (item === '.env' || item.endsWith('.keystore') || item.endsWith('.jks')) {
            console.warn(`  \x1b[33m[WARNING]\x1b[0m Unsafe file inside templates/examples: ${fullPath.replace(sourceRoot, '')}`);
            warnings++;
          }
        }
      } catch (e) {}
    }
  };
  scanSafety(join(sourceRoot, 'examples'));

  console.log('\n==================================================');
  if (warnings > 0) {
    console.warn(`  \x1b[33mRelease doctor complete with ${warnings} warnings.\x1b[0m\n`);
  } else {
    console.log('  \x1b[32m✔ Release hygiene checks PASSED successfully!\x1b[0m\n');
  }
}

// ==========================================
// --- v2.2.0 Intelligence Layer Helpers & Handlers ---
// ==========================================

function hashFile(filePath) {
  try {
    const data = readFileSync(filePath);
    return createHash('sha256').update(data).digest('hex');
  } catch (e) {
    return '';
  }
}

function shouldIgnorePath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  
  // Ignored folders
  const ignoredFolders = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
  for (const seg of segments) {
    if (ignoredFolders.includes(seg)) return true;
  }
  
  // Special check for docs/.vitepress/dist and docs/.vitepress/cache
  if (normalized.includes('docs/.vitepress/dist') || normalized.includes('docs/.vitepress/cache')) {
    return true;
  }
  
  // Ignore generated memory files
  if (normalized.endsWith('memory.hash.json') || normalized.endsWith('memory.summary.md')) {
    return true;
  }
  
  // Skip secret-like files/patterns
  const lower = normalized.toLowerCase();
  const filePart = segments[segments.length - 1];
  if (
    lower.endsWith('.env') ||
    lower.includes('.env.') ||
    lower.endsWith('.npmrc') ||
    lower.endsWith('.keystore') ||
    lower.endsWith('.jks') ||
    lower.endsWith('.key') ||
    lower.endsWith('.pem') ||
    lower.endsWith('credentials.json') ||
    filePart === 'id_rsa' ||
    filePart === 'id_dsa' ||
    filePart === 'id_ecdsa' ||
    filePart === 'id_ed25519'
  ) {
    return true;
  }
  
  return false;
}

function scanTarget(targetDir) {
  const files = [];
  let ignoredCount = 0;
  
  function walk(dir) {
    if (!existsSync(dir)) return;
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const relPath = relative(targetDir, fullPath).replace(/\\/g, '/');
      
      if (shouldIgnorePath(relPath)) {
        ignoredCount++;
        continue;
      }
      
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (stat.isFile()) {
          files.push({
            relPath,
            fullPath,
            size: stat.size,
            mtime: stat.mtime.toISOString()
          });
        }
      } catch (e) {
        // Skip inaccessible files or broken links
      }
    }
  }
  
  walk(targetDir);
  return { files, ignoredCount };
}

function detectFrameworkSignals(files, targetDir) {
  const signals = [];
  const hasFile = (name) => files.some(f => f.relPath.toLowerCase() === name.toLowerCase());
  
  if (hasFile('next.config.js') || hasFile('next.config.mjs')) signals.push('Next.js');
  if (hasFile('nuxt.config.js') || hasFile('nuxt.config.ts')) signals.push('Nuxt.js');
  if (hasFile('wp-config.php') || hasFile('index.php')) signals.push('WordPress/PHP');
  if (hasFile('tsconfig.json')) signals.push('TypeScript');
  if (hasFile('package.json')) {
    signals.push('Node.js');
    try {
      const pkg = JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['react']) signals.push('React');
      if (deps['vue']) signals.push('Vue');
      if (deps['svelte']) signals.push('Svelte');
      if (deps['expo']) signals.push('Expo');
      if (deps['react-native']) signals.push('React Native');
      if (deps['vite']) signals.push('Vite');
      if (deps['express']) signals.push('Express');
      if (deps['angular']) signals.push('Angular');
    } catch (e) {}
  }
  if (hasFile('requirements.txt') || hasFile('pyproject.toml')) signals.push('Python');
  if (hasFile('cargo.toml')) signals.push('Rust');
  if (hasFile('gemfile')) signals.push('Ruby');
  if (hasFile('go.mod')) signals.push('Go');
  
  if (signals.length === 0) signals.push('Generic/Unknown');
  return [...new Set(signals)];
}

function detectDependencySignals(files, targetDir) {
  const signals = [];
  const hasFile = (name) => files.some(f => f.relPath.toLowerCase() === name.toLowerCase());
  
  if (hasFile('package-lock.json')) signals.push('npm');
  else if (hasFile('yarn.lock')) signals.push('Yarn');
  else if (hasFile('pnpm-lock.yaml')) signals.push('pnpm');
  else if (hasFile('bun.lockb')) signals.push('Bun');
  
  if (hasFile('requirements.txt')) signals.push('pip');
  if (hasFile('poetry.lock')) signals.push('Poetry');
  if (hasFile('cargo.lock')) signals.push('Cargo');
  
  return signals;
}

function detectAiDevOsSignals(files) {
  const signals = [];
  const hasFile = (name) => files.some(f => f.relPath.toLowerCase() === name.toLowerCase());
  
  if (hasFile('agents.md')) signals.push('AGENTS.md');
  if (hasFile('memory.md')) signals.push('MEMORY.md');
  if (hasFile('tasks.md')) signals.push('TASKS.md');
  if (hasFile('runbook.md')) signals.push('RUNBOOK.md');
  if (hasFile('.ai/config.yaml')) signals.push('.ai/config.yaml');
  
  const hasPrefix = (prefix) => files.some(f => f.relPath.startsWith(prefix));
  if (hasPrefix('.ai/templates/')) signals.push('Templates Registry');
  if (hasPrefix('.ai/adapters/')) signals.push('Adapters Registry');
  if (hasPrefix('.ai/skills/')) signals.push('Skills Registry');
  if (hasPrefix('.ai/intelligence/')) signals.push('Intelligence Layer');
  if (hasPrefix('.ai/policies/')) signals.push('Policy Layer');
  if (hasPrefix('.ai/registries/')) signals.push('Registry Layer');
  
  return signals;
}

function detectRisks(files, targetDir) {
  const risks = [];
  const gitignorePath = join(targetDir, '.gitignore');
  const gitignoreContent = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
  
  const hasFolder = (name) => files.some(f => f.relPath.split('/')[0] === name);
  
  if (hasFolder('node_modules') && !gitignoreContent.includes('node_modules')) {
    risks.push({
      file_pattern: 'node_modules/',
      risk_description: 'Large token-sink directory node_modules/ is present but not ignored in .gitignore.',
      severity: 'high'
    });
  }
  
  files.forEach(f => {
    if (f.relPath.endsWith('.json') && f.relPath.toLowerCase().includes('config') && f.size > 50000) {
      risks.push({
        file_pattern: f.relPath,
        risk_description: `Large config file (${(f.size / 1024).toFixed(1)} KB) might contain sensitive parameters or inflate prompt context.`,
        severity: 'medium'
      });
    }
  });
  
  return risks;
}

function buildMemoryIndex(targetDir) {
  const { files, ignoredCount } = scanTarget(targetDir);
  const framework_signals = detectFrameworkSignals(files, targetDir);
  const dependency_signals = detectDependencySignals(files, targetDir);
  const ai_dev_os_signals = detectAiDevOsSignals(files);
  const risks = detectRisks(files, targetDir);
  
  const file_fingerprints = {};
  files.forEach(f => {
    file_fingerprints[f.relPath] = {
      hash: hashFile(f.fullPath),
      size: f.size,
      last_modified: f.mtime
    };
  });
  
  const recommended_next_steps = [];
  if (ai_dev_os_signals.length === 0) {
    recommended_next_steps.push('Run init to bootstrap MultiModel Dev OS.');
  }
  if (risks.some(r => r.severity === 'high')) {
    recommended_next_steps.push('Address Gitignore configuration to exclude large directories (node_modules/ or build artifacts).');
  }
  recommended_next_steps.push('Use validate or doctor to check structural integrity.');
  recommended_next_steps.push('Commit the .ai/ intelligence policies to share constraints across AI agents.');
  
  return {
    generated_at: new Date().toISOString(),
    project_root: targetDir.replace(/\\/g, '/'),
    file_count: files.length,
    ignored_count: ignoredCount,
    file_fingerprints,
    framework_signals,
    dependency_signals,
    ai_dev_os_signals,
    risks,
    recommended_next_steps
  };
}

function writeMemoryFiles(targetDir, index) {
  const intelDir = join(targetDir, '.ai', 'intelligence');
  if (!existsSync(intelDir)) {
    mkdirSync(intelDir, { recursive: true });
  }
  
  const hashJsonPath = join(intelDir, 'memory.hash.json');
  writeFileSync(hashJsonPath, JSON.stringify(index, null, 2), 'utf8');
  
  const summaryMdPath = join(intelDir, 'memory.summary.md');
  
  let md = `# MultiModel Dev OS Repository Memory Summary\n\n`;
  md += `**Generated At:** ${index.generated_at}\n`;
  md += `**Project Root:** ${index.project_root}\n`;
  md += `**Total Files:** ${index.file_count} (Ignored: ${index.ignored_count})\n\n`;
  
  md += `## Framework & Environment Signals\n`;
  md += `- **Frameworks/Languages:** ${index.framework_signals.join(', ') || 'None'}\n`;
  md += `- **Package Manager/Build:** ${index.dependency_signals.join(', ') || 'None'}\n`;
  md += `- **AI Dev OS Integration:** ${index.ai_dev_os_signals.join(', ') || 'None'}\n\n`;
  
  md += `## Codebase Fingerprints\n`;
  md += `| File Path | Size (Bytes) | Hash (SHA-256) |\n`;
  md += `|---|---|---|\n`;
  
  const entries = Object.entries(index.file_fingerprints);
  entries.forEach(([filePath, fp]) => {
    md += `| ${filePath} | ${fp.size} | \`${fp.hash.substring(0, 12)}...\` |\n`;
  });
  md += `\n`;
  
  if (index.risks.length > 0) {
    md += `## Detected Risks\n`;
    index.risks.forEach(r => {
      md += `- **[${r.severity.toUpperCase()}]** \`${r.file_pattern}\`: ${r.risk_description}\n`;
    });
    md += `\n`;
  }
  
  md += `## Recommended Next Steps\n`;
  index.recommended_next_steps.forEach(step => {
    md += `- ${step}\n`;
  });
  
  writeFileSync(summaryMdPath, md, 'utf8');
}

function diffMemory(targetDir) {
  const hashJsonPath = join(targetDir, '.ai', 'intelligence', 'memory.hash.json');
  if (!existsSync(hashJsonPath)) {
    return null;
  }
  
  let existing;
  try {
    existing = JSON.parse(readFileSync(hashJsonPath, 'utf8'));
  } catch (e) {
    return null;
  }
  
  const currentScan = buildMemoryIndex(targetDir);
  
  const added = [];
  const removed = [];
  const changed = [];
  let unchangedCount = 0;
  
  const currentFp = currentScan.file_fingerprints;
  const existingFp = existing.file_fingerprints || {};
  
  Object.keys(currentFp).forEach(file => {
    if (!existingFp[file]) {
      added.push(file);
    } else if (existingFp[file].hash !== currentFp[file].hash || existingFp[file].size !== currentFp[file].size) {
      changed.push(file);
    } else {
      unchangedCount++;
    }
  });
  
  Object.keys(existingFp).forEach(file => {
    if (!currentFp[file]) {
      removed.push(file);
    }
  });
  
  return { added, removed, changed, unchangedCount, currentScan };
}

function handleScan(options) {
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

function handleMemoryBuild(options) {
  console.log(`\n🧠 \x1b[36mBuilding Codebase Memory in: ${options.target}\x1b[0m`);
  console.log('==================================================');
  
  const index = buildMemoryIndex(options.target);
  writeMemoryFiles(options.target, index);
  
  console.log(`  \x1b[32mCREATE:\x1b[0m .ai/intelligence/memory.hash.json`);
  console.log(`  \x1b[32mCREATE:\x1b[0m .ai/intelligence/memory.summary.md`);
  console.log(`\n✔ Memory index built successfully! [Files indexed: ${index.file_count}]`);
  
  console.log(`\n\x1b[33mRecommended Next Steps:\x1b[0m`);
  index.recommended_next_steps.forEach(step => console.log(`  - ${step}`));
  console.log();
}

function handleMemoryRefresh(options) {
  console.log(`\n🧠 \x1b[36mRefreshing Codebase Memory in: ${options.target}\x1b[0m`);
  console.log('==================================================');
  
  const diff = diffMemory(options.target);
  if (!diff) {
    console.log('  No existing memory index found. Building fresh index...');
    handleMemoryBuild(options);
    return;
  }
  
  writeMemoryFiles(options.target, diff.currentScan);
  
  console.log(`  \x1b[32mUPDATE:\x1b[0m .ai/intelligence/memory.hash.json`);
  console.log(`  \x1b[32mUPDATE:\x1b[0m .ai/intelligence/memory.summary.md`);
  
  console.log(`\n✔ Memory index refreshed successfully!`);
  console.log(`  Added:     ${diff.added.length}`);
  console.log(`  Removed:   ${diff.removed.length}`);
  console.log(`  Changed:   ${diff.changed.length}`);
  console.log(`  Unchanged: ${diff.unchangedCount}`);
  console.log();
}

function handleMemoryDiff(options) {
  console.log(`\n🧠 \x1b[36mDiffing Codebase State against Memory in: ${options.target}\x1b[0m`);
  console.log('==================================================');
  
  const diff = diffMemory(options.target);
  if (!diff) {
    console.error(`\x1b[31mError: No existing memory index found. Run 'memory build' first.\x1b[0m\n`);
    process.exit(1);
  }
  
  console.log(`\n\x1b[33mMemory Diff Summary:\x1b[0m`);
  console.log(`  Added Files:   ${diff.added.length}`);
  console.log(`  Removed Files: ${diff.removed.length}`);
  console.log(`  Changed Files: ${diff.changed.length}`);
  console.log(`  Unchanged:     ${diff.unchangedCount}`);
  
  if (diff.added.length > 0) {
    console.log(`\n\x1b[32mAdded Files:\x1b[0m`);
    diff.added.forEach(f => console.log(`  + ${f}`));
  }
  if (diff.removed.length > 0) {
    console.log(`\n\x1b[31mRemoved Files:\x1b[0m`);
    diff.removed.forEach(f => console.log(`  - ${f}`));
  }
  if (diff.changed.length > 0) {
    console.log(`\n\x1b[33mChanged Files:\x1b[0m`);
    diff.changed.forEach(f => console.log(`  M ${f}`));
  }
  
  console.log();
}

