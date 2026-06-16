#!/usr/bin/env node

/**
 * multimodel-dev-os CLI
 * Dependency-free local initialization, diagnostics, and validation utility.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative, isAbsolute, basename } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import readline from 'readline';
import { execSync } from 'child_process';

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
    release: false,
    type: 'unknown',
    tags: '',
    files: '',
    title: null,
    approved: false,
    intelligence: false,
    onboarding: false,
    listActions: false,
    category: null
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
    } else if (arg === '--list-actions') {
      params.listActions = true;
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
    } else if (arg === '--intelligence') {
      params.intelligence = true;
    } else if (arg === '--onboarding') {
      params.onboarding = true;
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
    } else if (arg === '--type') {
      params.type = args[++i];
    } else if (arg === '--tags') {
      params.tags = args[++i];
    } else if (arg === '--files') {
      params.files = args[++i];
    } else if (arg === '--title') {
      params.title = args[++i];
    } else if (arg === '--approved') {
      params.approved = true;
    } else if (arg === '--category') {
      params.category = args[++i];
    } else if (!params.command && !arg.startsWith('-')) {
      params.command = arg;
    }
  }
  return params;
}

function getPositionalArgs(args) {
  const positionalArgs = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' || arg === '-t' || arg === '--template' || arg === '--adapter' || arg === '-a' ||
        arg === '--threshold' || arg === '--registry' || arg === '--model-preset' || arg === '--agent' ||
        arg === '--stack' || arg === '--mobile' || arg === '--type' || arg === '--tags' || arg === '--files' ||
        arg === '--title' || arg === '--category') {
      i++; // skip next arg (its value)
    } else if (arg.startsWith('-')) {
      // it's a flag, skip
    } else {
      positionalArgs.push(arg);
    }
  }
  return positionalArgs;
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
} else if (COMMAND === 'feedback') {
  const sub = ARGS[1];
  if (sub === 'add') {
    handleFeedbackAdd(params);
  } else if (sub === 'list') {
    handleFeedbackList(params);
  } else if (sub === 'summarize') {
    handleFeedbackSummarize(params);
  } else {
    console.error(`\x1b[31mError: Please specify a feedback subcommand: add, list, or summarize.\x1b[0m`);
    console.log(`Example: node bin/multimodel-dev-os.js feedback add "Prefer CSS Modules"`);
    process.exit(1);
  }
} else if (COMMAND === 'improve') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === 'propose') {
    handleImprovePropose(params);
  } else if (sub === 'review') {
    handleImproveReview(params);
  } else if (sub === 'status') {
    handleImproveStatus(params);
  } else if (sub === 'validate') {
    const proposalFile = positional[2];
    if (!proposalFile) {
      console.error(`\x1b[31mError: Please specify a proposal file path.\x1b[0m`);
      console.log(`Example: node bin/multimodel-dev-os.js improve validate .ai/proposals/proposal-xxxx.md`);
      process.exit(1);
    }
    handleImproveValidate(proposalFile, params);
  } else if (sub === 'diff') {
    const proposalFile = positional[2];
    if (!proposalFile) {
      console.error(`\x1b[31mError: Please specify a proposal file path.\x1b[0m`);
      console.log(`Example: node bin/multimodel-dev-os.js improve diff .ai/proposals/proposal-xxxx.md`);
      process.exit(1);
    }
    handleImproveDiff(proposalFile, params);
  } else if (sub === 'apply') {
    const proposalFile = positional[2];
    if (!proposalFile) {
      console.error(`\x1b[31mError: Please specify a proposal file path.\x1b[0m`);
      console.log(`Example: node bin/multimodel-dev-os.js improve apply .ai/proposals/proposal-xxxx.md --approved`);
      process.exit(1);
    }
    handleImproveApply(proposalFile, params);
  } else if (sub === 'log') {
    handleImproveLog(params);
  } else {
    console.error(`\x1b[31mError: Please specify an improve subcommand: propose, review, status, validate, diff, apply, or log.\x1b[0m`);
    console.log(`Example: node bin/multimodel-dev-os.js improve validate .ai/proposals/proposal-xxxx.md`);
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
} else if (COMMAND === 'status') {
  handleStatus(params);
} else if (COMMAND === 'workflow') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === 'list') {
    handleWorkflowList(params);
  } else if (sub === 'show') {
    const wName = positional[2];
    if (!wName) {
      console.error('\x1b[31mError: Please specify a workflow name.\x1b[0m');
      console.log('Example: node bin/multimodel-dev-os.js workflow show repo-health');
      process.exit(1);
    }
    handleWorkflowShow(wName, params);
  } else if (sub === 'plan') {
    const wName = positional[2];
    if (!wName) {
      console.error('\x1b[31mError: Please specify a workflow name.\x1b[0m');
      console.log('Example: node bin/multimodel-dev-os.js workflow plan repo-health');
      process.exit(1);
    }
    handleWorkflowPlan(wName, params);
  } else if (sub === 'run') {
    const wName = positional[2];
    if (!wName) {
      console.error('\x1b[31mError: Please specify a workflow name.\x1b[0m');
      console.log('Example: node bin/multimodel-dev-os.js workflow run repo-health');
      process.exit(1);
    }
    handleWorkflowRun(wName, params);
  } else {
    console.error('\x1b[31mError: Please specify a workflow subcommand: list, show, plan, or run.\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js workflow list');
    process.exit(1);
  }
} else if (COMMAND === 'handoff') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === 'build') {
    handleHandoffBuild(params);
  } else if (sub === 'show') {
    handleHandoffShow(params);
  } else {
    console.error('\x1b[31mError: Please specify a handoff subcommand: build or show.\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js handoff build');
    process.exit(1);
  }
} else if (COMMAND === 'onboard') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === 'analyze') {
    handleOnboardAnalyze(params);
  } else if (sub === 'recommend') {
    handleOnboardRecommend(params);
  } else if (sub === 'plan') {
    handleOnboardPlan(params);
  } else if (sub === 'apply') {
    handleOnboardApply(params);
  } else if (sub === 'status') {
    handleOnboardStatus(params);
  } else {
    console.error('\x1b[31mError: Please specify an onboard subcommand: analyze, recommend, plan, apply, or status.\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js onboard analyze');
    process.exit(1);
  }
} else if (COMMAND === 'adapter') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === 'status') {
    handleAdapterStatus(params);
  } else if (sub === 'diff') {
    const aName = positional[2];
    if (!aName) {
      console.error('\x1b[31mError: Please specify an adapter name (e.g. cursor, claude) or "all".\x1b[0m');
      process.exit(1);
    }
    handleAdapterDiff(aName, params);
  } else if (sub === 'sync') {
    const aName = positional[2];
    if (!aName) {
      console.error('\x1b[31mError: Please specify an adapter name or "all" to sync.\x1b[0m');
      process.exit(1);
    }
    handleAdapterSync(aName, params);
  } else {
    console.error('\x1b[31mError: Please specify an adapter subcommand: status, diff, or sync.\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js adapter status');
    process.exit(1);
  }
} else if (COMMAND === 'dashboard' || COMMAND === 'ui') {
  handleDashboard(params);
} else if (COMMAND === 'plugin') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === 'list') {
    handlePluginList(params);
  } else if (sub === 'show') {
    const pSlug = positional[2];
    if (!pSlug) {
      console.error('\x1b[31mError: Please specify a plugin name/slug.\x1b[0m');
      process.exit(1);
    }
    handlePluginShow(pSlug, params);
  } else if (sub === 'validate') {
    const pPath = positional[2];
    if (!pPath) {
      console.error('\x1b[31mError: Please specify a plugin configuration file path.\x1b[0m');
      process.exit(1);
    }
    handlePluginValidate(pPath, params);
  } else if (sub === 'install') {
    const pPath = positional[2];
    if (!pPath) {
      console.error('\x1b[31mError: Please specify a plugin configuration file path to install.\x1b[0m');
      process.exit(1);
    }
    handlePluginInstall(pPath, params);
  } else if (sub === 'status') {
    handlePluginStatus(params);
  } else {
    console.error('\x1b[31mError: Please specify a plugin subcommand: list, show, validate, install, or status.\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js plugin list');
    process.exit(1);
  }
} else if (COMMAND === 'catalog') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === 'list') {
    handleCatalogList(params);
  } else if (sub === 'search') {
    const query = positional[2];
    if (!query) {
      console.error('\x1b[31mError: Please specify a search query.\x1b[0m');
      process.exit(1);
    }
    handleCatalogSearch(query, params);
  } else if (sub === 'show') {
    const slug = positional[2];
    if (!slug) {
      console.error('\x1b[31mError: Please specify a catalog plugin slug.\x1b[0m');
      process.exit(1);
    }
    handleCatalogShow(slug, params);
  } else if (sub === 'categories') {
    handleCatalogCategories(params);
  } else if (sub === 'recommend') {
    handleCatalogRecommend(params);
  } else if (sub === 'install') {
    const slug = positional[2];
    if (!slug) {
      console.error('\x1b[31mError: Please specify a catalog plugin slug to install.\x1b[0m');
      process.exit(1);
    }
    handleCatalogInstall(slug, params);
  } else if (sub === 'status') {
    handleCatalogStatus(params);
  } else {
    console.error('\x1b[31mError: Please specify a catalog subcommand: list, search, show, categories, recommend, install, or status.\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js catalog list');
    process.exit(1);
  }
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
  console.log('  status            Show compact dashboard summarizing repository intelligence state');
  console.log('  dashboard         Launch the interactive terminal command center (alias: ui)');
  console.log('  memory <subcmd>   Manage hash-compressed codebase memory (subcmd: build, refresh, diff)');
  console.log('  feedback <subcmd> Manage developer feedback loops (subcmd: add, list, summarize)');
  console.log('  improve <subcmd>  Manage codebase self-improvement proposals (subcmd: propose, review, status, validate, diff, apply, log)');
  console.log('  workflow <subcmd> Orchestrate read-only development workflow pipelines (subcmd: list, show, plan, run)');
  console.log('  handoff <subcmd>  Compile or print token-compressed agent session summaries (subcmd: build, show)');
  console.log('  onboard <subcmd>  Safely integrate MultiModel Dev OS into existing repo (subcmd: analyze, recommend, plan, apply, status)');
  console.log('  adapter <subcmd>  Manage and sync rule/settings files for IDE adapters (subcmd: status, diff, sync)');
  console.log('  plugin <subcmd>   Manage declarative plugins (subcmd: list, show, validate, install, status)');
  console.log('  catalog <subcmd>  Manage Workflow Marketplace & Plugin Catalog (subcmd: list, search, show, categories, recommend, install, status)');
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
  console.log('  --type <type>           Feedback classification (correction, preference, bug, etc.)');
  console.log('  --tags <list>           Comma-separated descriptor tags for feedback');
  console.log('  --files <list>          Comma-separated target files for feedback');
  console.log('  --category <name>       Filter catalog plugins list by category');
  console.log('  --title <text>          Specifies title for codebase improvement proposal');
  console.log('  --approved              Explicitly approve and execute proposal/onboarding/adapter sync writes');
  console.log('  --template <name>       Template profile: nextjs-saas, expo-react-native-android, etc.');
  console.log('  -a, --adapter <name>    Inject specific adapter: cursor, claude, vscode, gemini, etc.');
  console.log('  --caveman               Use minimal-token templates (~79% fewer tokens)');
  console.log('  --tokens                Run a deeper token-sink size analysis during doctor checkup');
  console.log('  --intelligence          Run diagnostic checkup of repository intelligence config');
  console.log('  --onboarding            Run diagnostic checkup of repository onboarding setup');
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
  const globalAiSubdirs = ['context', 'agents', 'skills', 'prompts', 'checks', 'templates', 'session-logs', 'registries', 'proposals', 'intelligence'];
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
    if (options && options.noExit) return false;
    process.exit(1);
  } else {
    console.log(`  \x1b[32mVerification PASSED. [All ${passed} files present]\x1b[0m\n`);
    if (options && options.noExit) return true;
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
  if (options.intelligence) {
    handleDoctorIntelligence(options);
    return;
  }
  if (options.onboarding) {
    handleDoctorOnboarding(options);
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
    warn('MultiModel Dev OS is not initialized (.ai/config.yaml is missing). Run "npx multimodel-dev-os init" to bootstrap configuration.');
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
          let val = trimmed;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          parent.obj.push(val);
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
  
  // Ignore generated memory and intelligence runtime files
  if (
    normalized.endsWith('memory.hash.json') ||
    normalized.endsWith('memory.summary.md') ||
    normalized.endsWith('feedback-log.jsonl') ||
    normalized.endsWith('learning-rules.md') ||
    normalized.endsWith('apply-log.jsonl') ||
    normalized.includes('.ai/proposals/')
  ) {
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
    if (options && options.noExit) return false;
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

function handleFeedbackAdd(options) {
  const intelDir = join(options.target, '.ai', 'intelligence');
  if (!options.dryRun && !existsSync(intelDir)) {
    mkdirSync(intelDir, { recursive: true });
  }

  const addIdx = process.argv.indexOf('add');
  const text = (addIdx !== -1 && process.argv[addIdx + 1] && !process.argv[addIdx + 1].startsWith('-')) ? process.argv[addIdx + 1] : null;

  if (!text) {
    console.error(`\x1b[31mError: Please provide feedback text.\x1b[0m`);
    console.log(`Example: node bin/multimodel-dev-os.js feedback add "Prefer CSS modules"`);
    process.exit(1);
  }

  const uuid = createHash('md5').update(new Date().toISOString() + Math.random().toString()).digest('hex').substring(0, 16);
  const tagsStr = options.tags || '';
  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
  const filesStr = options.files || '';
  const related_files = filesStr ? filesStr.split(',').map(f => f.trim()) : [];

  const rawRecord = {
    id: `fb-${uuid}`,
    created_at: new Date().toISOString(),
    source: 'user',
    type: options.type || 'unknown',
    text: text,
    tags: tags,
    related_files: related_files
  };

  rawRecord.hash = createHash('sha256').update(JSON.stringify(rawRecord)).digest('hex');

  const recordLine = JSON.stringify(rawRecord) + '\n';
  const feedbackLogPath = join(intelDir, 'feedback-log.jsonl');

  if (options.dryRun) {
    console.log(`\x1b[36m[DRY-RUN] WOULD APPEND TO ${feedbackLogPath}:\x1b[0m`);
    console.log(recordLine.trim());
  } else {
    try {
      let isDuplicate = false;
      if (existsSync(feedbackLogPath)) {
        const lines = readFileSync(feedbackLogPath, 'utf8').split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line);
            if (entry.text === text && JSON.stringify(entry.related_files) === JSON.stringify(related_files)) {
              isDuplicate = true;
              break;
            }
          } catch (e) {}
        }
      }
      if (isDuplicate) {
        console.log(`\x1b[33mFeedback already exists. Skipping duplicate entry.\x1b[0m`);
        return;
      }

      writeFileSync(feedbackLogPath, recordLine, { flag: 'a', encoding: 'utf8' });
      console.log(`✔ Feedback successfully added (ID: ${rawRecord.id})`);
    } catch (e) {
      console.error(`\x1b[31mError: Failed to write to feedback-log.jsonl: ${e.message}\x1b[0m`);
      process.exit(1);
    }
  }
}

function handleFeedbackList(options) {
  const feedbackLogPath = join(options.target, '.ai', 'intelligence', 'feedback-log.jsonl');
  if (!existsSync(feedbackLogPath)) {
    console.log('No feedback logged yet.');
    return;
  }

  try {
    const content = readFileSync(feedbackLogPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) {
      console.log('No feedback logged yet.');
      return;
    }

    console.log(`\n🧠 \x1b[36mLogged Feedback Entries\x1b[0m`);
    console.log('==================================================');
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        console.log(`\n\x1b[32m* [${entry.type || 'unknown'}] (${entry.id})\x1b[0m`);
        console.log(`  \x1b[37mText:\x1b[0m ${entry.text}`);
        if (entry.tags && entry.tags.length > 0) {
          console.log(`  \x1b[33mTags:\x1b[0m ${entry.tags.join(', ')}`);
        }
        if (entry.related_files && entry.related_files.length > 0) {
          console.log(`  \x1b[33mFiles:\x1b[0m ${entry.related_files.join(', ')}`);
        }
        console.log(`  \x1b[33mLogged:\x1b[0m ${entry.created_at}`);
      } catch (e) {}
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError: Failed to read feedback log: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}

function handleFeedbackSummarize(options) {
  const intelDir = join(options.target, '.ai', 'intelligence');
  const feedbackLogPath = join(intelDir, 'feedback-log.jsonl');
  if (!existsSync(feedbackLogPath)) {
    console.log('No feedback logs found to compile.');
    return;
  }

  try {
    const content = readFileSync(feedbackLogPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) {
      console.log('No feedback logs found to compile.');
      return;
    }

    const categories = {};
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        const cat = entry.type || 'general';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(entry);
      } catch (e) {}
    });

    let md = `# Compiled Learning Rules\n\n`;
    md += `*Generated automatically by MultiModel Dev OS. Do not modify manually.*\n\n`;
    md += `**Last compiled:** ${new Date().toISOString()}\n`;
    md += `**Total source feedback items:** ${lines.length}\n\n`;
    md += `## Active Instructions\n\n`;

    Object.keys(categories).forEach(cat => {
      md += `### Category: ${cat}\n`;
      categories[cat].forEach(entry => {
        const pattern = entry.related_files && entry.related_files.length > 0 ? entry.related_files.join(', ') : '*';
        md += `*   **Pattern:** \`${pattern}\`\n`;
        md += `    *   **Rule:** ${entry.text}\n`;
        md += `    *   **Source ID:** \`${entry.id}\`\n\n`;
      });
    });

    const targetRulesPath = join(intelDir, 'learning-rules.md');
    if (options.dryRun) {
      console.log(`\x1b[36m[DRY-RUN] WOULD WRITE TO ${targetRulesPath}:\x1b[0m`);
      console.log(md);
    } else {
      writeFileSync(targetRulesPath, md, 'utf8');
      console.log(`✔ Compiled ${lines.length} feedback items into learning rules in .ai/intelligence/learning-rules.md`);
    }
  } catch (e) {
    console.error(`\x1b[31mError: Failed to compile learning rules: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}

function handleImprovePropose(options) {
  const proposalsDir = join(options.target, '.ai', 'proposals');
  if (!options.dryRun && !existsSync(proposalsDir)) {
    mkdirSync(proposalsDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const timestamp = `${dateStr}-${timeStr}`;
  const id = `proposal-${timestamp}`;

  const title = options.title || 'Auto-detected codebase optimization';
  let problem = 'No specific problems detected.';
  let evidence = 'N/A';
  let riskLevel = 'low';
  let affectedFiles = [];
  let suggestedChange = 'No code suggestions compiled.';
  let verifyCommand = 'npm run verify';
  let rollbackPlan = 'git checkout -- .';

  const gitignorePath = join(options.target, '.gitignore');
  const agentsPath = join(options.target, 'AGENTS.md');

  if (!existsSync(gitignorePath)) {
    problem = 'Missing .gitignore file in target workspace. AI agents may scan large build directories and run out of token context.';
    evidence = `.gitignore file is not present at root directory: ${options.target}`;
    affectedFiles = ['.gitignore'];
    suggestedChange = 'Create a standard .gitignore file to exclude node_modules, build/ and dist/ directories.';
    rollbackPlan = 'git clean -fd .gitignore';
  } else if (!existsSync(agentsPath)) {
    problem = 'Missing AGENTS.md document in target workspace. Models will lack stack-specific implementation blueprints.';
    evidence = `AGENTS.md file is not present at root directory: ${options.target}`;
    affectedFiles = ['AGENTS.md'];
    suggestedChange = 'Create an AGENTS.md document specifying the codebase development guidelines and framework profiles.';
    rollbackPlan = 'git clean -fd AGENTS.md';
  } else {
    problem = 'Outdated codebase memory index. Memory files need to be refreshed to sync with recent local changes.';
    evidence = 'Current memory.hash.json represents a previous commit state.';
    affectedFiles = ['.ai/intelligence/memory.hash.json', '.ai/intelligence/memory.summary.md'];
    suggestedChange = 'Refresh codebase memory index using multimodel-dev-os memory refresh CLI command.';
    riskLevel = 'low';
    verifyCommand = 'node bin/multimodel-dev-os.js memory refresh';
    rollbackPlan = 'git checkout -- .ai/intelligence/';
  }

  let md = `---
id: ${id}
created_at: ${now.toISOString()}
title: ${title}
problem: ${problem}
evidence: ${evidence}
risk_level: ${riskLevel}
affected_files:
`;
  affectedFiles.forEach(f => {
    md += `  - ${f}\n`;
  });
  md += `suggested_change: ${suggestedChange}
verify_command: ${verifyCommand}
rollback_plan: ${rollbackPlan}
approval_status: pending
---

# Codebase Improvement Proposal: ${title}

> [!WARNING]
> Manual approval is required before implementing this proposal. Edit the frontmatter metadata block to change \`approval_status\` to \`approved\` to authorize modifications.

## 1. Problem Description
${problem}

## 2. Evidence
${evidence}

## 3. Suggested Modifications
${suggestedChange}

## 4. Safety & Rollback Parameters
*   **Risk Level**: ${riskLevel.toUpperCase()}
*   **Verification Command**: \`${verifyCommand}\`
*   **Rollback Command**: \`${rollbackPlan}\`
*   **Approval Status**: PENDING (Manual approval required before implementation)
`;

  const proposalFile = join(proposalsDir, `${id}.md`);
  if (options.dryRun) {
    console.log(`\x1b[36m[DRY-RUN] WOULD WRITE PROPOSAL TO ${proposalFile}:\x1b[0m`);
    console.log(md);
  } else {
    writeFileSync(proposalFile, md, 'utf8');
    console.log(`✔ Created codebase improvement proposal: .ai/proposals/${id}.md`);
  }
}

function handleImproveReview(options) {
  const proposalsDir = join(options.target, '.ai', 'proposals');
  if (!existsSync(proposalsDir)) {
    console.log('No improvement proposals found.');
    return;
  }

  try {
    const files = readdirSync(proposalsDir).filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
    if (files.length === 0) {
      console.log('No improvement proposals found.');
      return;
    }

    console.log(`\n📋 \x1b[36mCodebase Improvement Proposals\x1b[0m`);
    console.log('==================================================');
    
    files.forEach(file => {
      const fullPath = join(proposalsDir, file);
      const content = readFileSync(fullPath, 'utf8');
      
      const fmMatch = content.match(/^---([\s\S]*?)---/);
      if (!fmMatch) return;
      
      const fmContent = fmMatch[1];
      const metadata = parseYaml(fmContent) || {};
      
      const statusColor = metadata.approval_status === 'approved' ? '\x1b[32m' : metadata.approval_status === 'rejected' ? '\x1b[31m' : '\x1b[33m';
      console.log(`\n\x1b[34m* [${metadata.id || file.replace('.md', '')}] ${metadata.title || 'Untitled'}\x1b[0m`);
      console.log(`  \x1b[37mRisk Level:\x1b[0m ${metadata.risk_level || 'unknown'}`);
      console.log(`  \x1b[37mStatus:\x1b[0m ${statusColor}${metadata.approval_status || 'pending'}\x1b[0m`);
      console.log(`  \x1b[37mProblem:\x1b[0m ${metadata.problem || 'N/A'}`);
      if (metadata.affected_files && metadata.affected_files.length > 0) {
        console.log(`  \x1b[37mAffected Files:\x1b[0m ${metadata.affected_files.join(', ')}`);
      }
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError: Failed to review proposals: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}

function handleImproveStatus(options) {
  const proposalsDir = join(options.target, '.ai', 'proposals');
  if (!existsSync(proposalsDir)) {
    console.log('Improvement Proposal Engine Status:');
    console.log('  Total Proposals:  0');
    console.log('  Pending Approval: 0');
    return;
  }

  try {
    const files = readdirSync(proposalsDir).filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    files.forEach(file => {
      const content = readFileSync(join(proposalsDir, file), 'utf8');
      const fmMatch = content.match(/^---([\s\S]*?)---/);
      if (fmMatch) {
        const metadata = parseYaml(fmMatch[1]) || {};
        const status = metadata.approval_status || 'pending';
        if (status === 'approved') approved++;
        else if (status === 'rejected') rejected++;
        else pending++;
      }
    });

    console.log(`\n⚙ \x1b[36mImprovement Proposals Engine Status\x1b[0m`);
    console.log('==================================================');
    console.log(`  Total Proposals:  ${files.length}`);
    console.log(`  Pending Approval: \x1b[33m${pending}\x1b[0m`);
    console.log(`  Approved:         \x1b[32m${approved}\x1b[0m`);
    console.log(`  Rejected:         \x1b[31m${rejected}\x1b[0m`);
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError: Failed to fetch status: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}

function getSha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function validatePath(targetRoot, relPath) {
  const normalizedRel = relPath.replace(/\\/g, '/');
  
  if (normalizedRel.startsWith('/') || normalizedRel.includes('..')) {
    return { valid: false, reason: `Path '${relPath}' contains directory traversal or is absolute.`, type: 'outside' };
  }

  const resolved = resolve(targetRoot, relPath);
  const relativeFromRoot = relative(targetRoot, resolved);
  
  if (relativeFromRoot.startsWith('..') || isAbsolute(relativeFromRoot) || resolved === targetRoot) {
    return { valid: false, reason: `Path '${relPath}' resolves outside the target root.`, type: 'outside' };
  }

  const parts = relativeFromRoot.replace(/\\/g, '/').split('/');
  
  const protectedFolders = [
    '.git',
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage'
  ];
  for (const part of parts) {
    if (protectedFolders.includes(part)) {
      return { valid: false, reason: `Path '${relPath}' attempts to access protected directory '${part}/'.`, type: 'protected' };
    }
  }

  const cleanRelativeFromRoot = relativeFromRoot.replace(/\\/g, '/');
  if (cleanRelativeFromRoot.startsWith('docs/.vitepress/dist') || cleanRelativeFromRoot.startsWith('docs/.vitepress/cache')) {
    return { valid: false, reason: `Path '${relPath}' attempts to access protected vitepress path.`, type: 'protected' };
  }

  const filename = parts[parts.length - 1];
  if (filename === '.env' || filename.startsWith('.env.') || filename === '.npmrc' || filename === 'credentials.json' || filename === 'package-lock.json' || filename === 'apply-log.jsonl') {
    return { valid: false, reason: `Path '${relPath}' targets a protected config/secret file.`, type: 'protected' };
  }
  if (filename.endsWith('.pem') || filename.endsWith('.key') || filename.endsWith('.jks') || filename.endsWith('.keystore')) {
    return { valid: false, reason: `Path '${relPath}' targets a protected key/certificate file.`, type: 'protected' };
  }

  return { valid: true, resolved };
}

function validateProposal(proposalFile, targetRoot) {
  const gates = {
    frontmatter: { status: 'skip' },
    approval: { status: 'skip' },
    json: { status: 'skip' },
    types: { status: 'skip' },
    boundaries: { status: 'skip' },
    permissions: { status: 'skip' },
    constraints: { status: 'skip' }
  };

  if (!existsSync(proposalFile)) {
    gates.frontmatter = { status: 'fail', reason: 'missing frontmatter' };
    return { valid: false, reason: 'missing frontmatter', gates };
  }

  const content = readFileSync(proposalFile, 'utf8');
  const fmMatch = content.match(/^---([\s\S]*?)---/);
  if (!fmMatch) {
    gates.frontmatter = { status: 'fail', reason: 'missing frontmatter' };
    return { valid: false, reason: 'missing frontmatter', gates };
  }
  const fmContent = fmMatch[1];
  const metadata = parseYaml(fmContent);
  if (!metadata || typeof metadata !== 'object') {
    gates.frontmatter = { status: 'fail', reason: 'missing frontmatter' };
    return { valid: false, reason: 'missing frontmatter', gates };
  }

  gates.frontmatter = { status: 'pass' };
  const proposalId = metadata.id || basename(proposalFile, '.md');
  const proposalTitle = metadata.title || 'Untitled Proposal';
  const proposalStatus = metadata.approval_status || 'pending';

  const isApproved = (metadata.approval_status === 'approved');
  gates.approval = isApproved ? { status: 'pass' } : { status: 'fail', reason: 'approval_status not approved' };

  const body = content.substring(fmMatch[0].length);
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n\s*```/;
  const jsonMatch = body.match(jsonBlockRegex);
  
  let operationsData = null;
  if (!jsonMatch) {
    gates.json = { status: 'fail', reason: 'no operations block' };
  } else {
    try {
      operationsData = JSON.parse(jsonMatch[1]);
      if (!operationsData || !Array.isArray(operationsData.operations) || operationsData.operations.length === 0) {
        gates.json = { status: 'fail', reason: 'no operations block' };
      } else {
        gates.json = { status: 'pass' };
      }
    } catch (e) {
      gates.json = { status: 'fail', reason: 'invalid JSON operations block' };
    }
  }

  if (gates.json.status !== 'pass') {
    const gateOrder = ['frontmatter', 'approval', 'json', 'types', 'boundaries', 'permissions', 'constraints'];
    let firstFailReason = null;
    for (const g of gateOrder) {
      if (gates[g].status === 'fail') {
        firstFailReason = gates[g].reason;
        break;
      }
    }
    return {
      valid: false,
      reason: firstFailReason,
      gates,
      proposalId,
      proposalTitle,
      proposalStatus,
      operations: []
    };
  }

  let typesStatus = 'pass';
  let typesReason = '';
  let boundariesStatus = 'pass';
  let boundariesReason = '';
  let permissionsStatus = 'pass';
  let permissionsReason = '';
  let constraintsStatus = 'pass';
  let constraintsReason = '';

  const validatedOperations = [];
  const operations = operationsData.operations;

  for (let idx = 0; idx < operations.length; idx++) {
    const op = operations[idx];
    if (!op || typeof op !== 'object' || !op.type) {
      if (typesStatus === 'pass') {
        typesStatus = 'fail';
        typesReason = `unsupported operation type`;
      }
      continue;
    }
    
    const allowedTypes = ['create_file', 'append_line', 'replace_text'];
    if (!allowedTypes.includes(op.type)) {
      if (typesStatus === 'pass') {
        typesStatus = 'fail';
        typesReason = `unsupported operation type`;
      }
      continue;
    }
    
    if (typeof op.path !== 'string' || !op.path.trim()) {
      if (boundariesStatus === 'pass') {
        boundariesStatus = 'fail';
        boundariesReason = `path outside target`;
      }
      continue;
    }
    
    const pathVal = validatePath(targetRoot, op.path);
    if (!pathVal.valid) {
      if (pathVal.type === 'outside') {
        if (boundariesStatus === 'pass') {
          boundariesStatus = 'fail';
          boundariesReason = `path outside target`;
        }
      } else if (pathVal.type === 'protected') {
        if (permissionsStatus === 'pass') {
          permissionsStatus = 'fail';
          permissionsReason = `protected path`;
        }
      }
      continue;
    }
    const resolvedPath = pathVal.resolved;
    
    if (op.type === 'create_file') {
      if (typeof op.content !== 'string') {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `unsupported operation type`; // Treated as malformed/unsupported or type logic error
        }
      } else if (existsSync(resolvedPath) && !op.overwrite) {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `create_file target exists without overwrite`;
        }
      }
    } else if (op.type === 'append_line') {
      if (typeof op.line !== 'string') {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `unsupported operation type`;
        }
      }
    } else if (op.type === 'replace_text') {
      if (typeof op.find !== 'string' || typeof op.replace !== 'string') {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `unsupported operation type`;
        }
      } else if (!existsSync(resolvedPath)) {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `replace_text zero matches`; // file does not exist, so zero matches
        }
      } else {
        const fileContent = readFileSync(resolvedPath, 'utf8');
        let count = 0;
        let pos = fileContent.indexOf(op.find);
        while (pos !== -1) {
          count++;
          pos = fileContent.indexOf(op.find, pos + op.find.length);
        }
        
        if (count === 0) {
          if (constraintsStatus === 'pass') {
            constraintsStatus = 'fail';
            constraintsReason = `replace_text zero matches`;
          }
        } else if (count > 1 && !op.allow_multiple) {
          if (constraintsStatus === 'pass') {
            constraintsStatus = 'fail';
            constraintsReason = `replace_text multiple matches without allow_multiple`;
          }
        }
      }
    }
    
    validatedOperations.push({
      ...op,
      resolvedPath
    });
  }

  gates.types = { status: typesStatus, reason: typesReason };
  gates.boundaries = { status: boundariesStatus, reason: boundariesReason };
  gates.permissions = { status: permissionsStatus, reason: permissionsReason };
  gates.constraints = { status: constraintsStatus, reason: constraintsReason };

  const gateOrder = ['frontmatter', 'approval', 'json', 'types', 'boundaries', 'permissions', 'constraints'];
  let firstFailReason = null;
  for (const g of gateOrder) {
    if (gates[g].status === 'fail') {
      firstFailReason = gates[g].reason;
      break;
    }
  }

  const valid = (firstFailReason === null);
  return {
    valid,
    reason: firstFailReason,
    gates,
    proposalId,
    proposalTitle,
    proposalStatus,
    operations: valid ? validatedOperations : []
  };
}

function handleImproveValidate(proposalFile, options) {
  console.log(`🛡  \x1b[34mValidating improvement proposal: ${proposalFile}\x1b[0m\n`);
  const validation = validateProposal(proposalFile, options.target);
  
  if (validation.proposalId) {
    console.log(`Proposal ID: \x1b[33m${validation.proposalId}\x1b[0m`);
    console.log(`Title:       \x1b[37m${validation.proposalTitle}\x1b[0m`);
    console.log(`Status:      ${validation.proposalStatus === 'approved' ? '\x1b[32m' : '\x1b[31m'}${validation.proposalStatus}\x1b[0m\n`);
  }

  console.log(`Safety Gate Checklist:`);
  
  const gateLabels = {
    frontmatter: 'Frontmatter Metadata',
    approval: 'Approval Status',
    json: 'Operations JSON Block',
    types: 'Operation Type Safety',
    boundaries: 'Path Boundaries (Within Target Root)',
    permissions: 'Path Permissions (No Protected Paths)',
    constraints: 'Operation Constraints (Overwrites & Replacements)'
  };

  const gateOrder = ['frontmatter', 'approval', 'json', 'types', 'boundaries', 'permissions', 'constraints'];

  gateOrder.forEach(g => {
    const gate = validation.gates[g];
    const label = gateLabels[g];
    if (gate.status === 'pass') {
      console.log(`  \x1b[32m[✓]\x1b[0m ${label}`);
    } else if (gate.status === 'fail') {
      console.log(`  \x1b[31m[✗]\x1b[0m ${label} - \x1b[31m${gate.reason}\x1b[0m`);
    } else {
      console.log(`  \x1b[37m[-]\x1b[0m ${label}`);
    }
  });
  console.log();

  if (!validation.valid) {
    console.error(`\x1b[31mValidation FAILED: ${validation.reason}\x1b[0m`);
    console.error(`\x1b[33mActionable Fix:\x1b[0m`);
    if (validation.reason === 'missing frontmatter') {
      console.error(`  Please verify that the proposal file contains a valid YAML frontmatter block at the very top delimited by '---'.`);
    } else if (validation.reason === 'approval_status not approved') {
      console.error(`  The proposal approval status is not set to 'approved'. Edit the frontmatter block and set 'approval_status: approved'.`);
    } else if (validation.reason === 'no operations block') {
      console.error(`  No valid operations JSON block was found. Ensure a \`\`\`json block exists containing an "operations" array.`);
    } else if (validation.reason === 'invalid JSON operations block') {
      console.error(`  The operations block inside \`\`\`json is not valid JSON. Run it through a JSON validator to fix syntax errors.`);
    } else if (validation.reason === 'unsupported operation type') {
      console.error(`  An operation type is disallowed. Allowed types are: 'create_file', 'append_line', 'replace_text'.`);
    } else if (validation.reason === 'protected path') {
      console.error(`  An operation targets a protected directory (like .git, node_modules) or configuration file (like .env, .npmrc, apply-log.jsonl).`);
    } else if (validation.reason === 'path outside target') {
      console.error(`  An operation path tries to escape the target directory using directory traversal (..) or absolute paths.`);
    } else if (validation.reason === 'replace_text zero matches') {
      console.error(`  The 'find' text specified in a replace_text operation was not found in the target file.`);
    } else if (validation.reason === 'replace_text multiple matches without allow_multiple') {
      console.error(`  The 'find' text matched multiple times. Set 'allow_multiple: true' if you want to replace all occurrences.`);
    } else if (validation.reason === 'create_file target exists without overwrite') {
      console.error(`  The target file already exists. Set 'overwrite: true' in the operation to allow overwriting.`);
    } else {
      console.error(`  Check the proposal constraints and make sure all target files and fields are correct.`);
    }
    console.error();
    process.exit(1);
  }

  console.log(`\x1b[32m✔ Proposal is VALID and ready to be applied. ${validation.operations.length} operations parsed successfully.\x1b[0m\n`);
  process.exit(0);
}

function handleImproveDiff(proposalFile, options) {
  console.log(`🔍 \x1b[36mGenerating diff for proposal: ${proposalFile}\x1b[0m\n`);
  const validation = validateProposal(proposalFile, options.target);
  if (!validation.valid) {
    console.error(`\x1b[31mValidation FAILED: ${validation.reason}\x1b[0m`);
    process.exit(1);
  }
  
  const operations = validation.operations;
  
  let createCount = 0;
  let appendCount = 0;
  let replaceCount = 0;
  const affectedFilesSet = new Set();
  
  operations.forEach(op => {
    affectedFilesSet.add(op.path);
    if (op.type === 'create_file') createCount++;
    else if (op.type === 'append_line') appendCount++;
    else if (op.type === 'replace_text') replaceCount++;
  });
  
  console.log(`Summary of Planned Changes:`);
  console.log(`---------------------------`);
  console.log(`Total Operations: \x1b[33m${operations.length}\x1b[0m`);
  console.log(`Operations Count: \x1b[32m${createCount} Create\x1b[0m, \x1b[33m${appendCount} Append\x1b[0m, \x1b[35m${replaceCount} Replace\x1b[0m`);
  console.log(`Affected Files (${affectedFilesSet.size}):`);
  affectedFilesSet.forEach(f => console.log(`  - ${f}`));
  console.log();

  const printTruncatedLines = (content, prefix, colorCode) => {
    const lines = content.split(/\r?\n/);
    const maxLines = 5;
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      console.log(`${colorCode}${prefix} ${lines[i]}\x1b[0m`);
    }
    if (lines.length > maxLines) {
      console.log(`${colorCode}${prefix} ... (${lines.length - maxLines} more lines)\x1b[0m`);
    }
  };

  const types = ['create_file', 'append_line', 'replace_text'];
  const typeHeaders = {
    create_file: '--- CREATE_FILE OPERATIONS ---',
    append_line: '--- APPEND_LINE OPERATIONS ---',
    replace_text: '--- REPLACE_TEXT OPERATIONS ---'
  };

  types.forEach(type => {
    const typeOps = operations.filter(op => op.type === type);
    if (typeOps.length === 0) return;

    console.log(`\x1b[36m\x1b[1m${typeHeaders[type]}\x1b[0m`);
    typeOps.forEach(op => {
      const idx = operations.indexOf(op);
      console.log(`\n\x1b[33m[Operation #${idx + 1}] Target: ${op.path}\x1b[0m`);

      if (type === 'create_file') {
        const exists = existsSync(op.resolvedPath);
        if (exists) {
          console.log(`  \x1b[31m⚠️  [Overwriting existing file]\x1b[0m`);
        } else {
          console.log(`  \x1b[32m+ [Creating new file]\x1b[0m`);
        }
        const linesCount = op.content.split(/\r?\n/).length;
        console.log(`  + [File content: ${linesCount} line(s), overwrite: ${!!op.overwrite}]`);
        printTruncatedLines(op.content, '  +', '\x1b[32m');
      } else if (type === 'append_line') {
        const exists = existsSync(op.resolvedPath);
        let currentFileContent = '';
        if (exists) {
          currentFileContent = readFileSync(op.resolvedPath, 'utf8');
        }
        const fileLines = currentFileContent.split(/\r?\n/);
        const lineExists = fileLines.some(l => l.trim() === op.line.trim());
        if (lineExists) {
          console.log(`  \x1b[33m[IDEMPOTENT] Line already exists in file. No changes will be made.\x1b[0m`);
        } else {
          console.log(`  \x1b[32m+ Appending line:\x1b[0m`);
          console.log(`  \x1b[32m+ ${op.line}\x1b[0m`);
        }
      } else if (type === 'replace_text') {
        console.log(`  --- a/${op.path}`);
        console.log(`  +++ b/${op.path}`);
        console.log(`  \x1b[31m- Removing:\x1b[0m`);
        printTruncatedLines(op.find, '  -', '\x1b[31m');
        console.log(`  \x1b[32m+ Inserting:\x1b[0m`);
        printTruncatedLines(op.replace, '  +', '\x1b[32m');
      }
    });
    console.log();
  });
}

function handleImproveApply(proposalFile, options) {
  if (!options.approved) {
    console.error(`\x1b[31mError: Proposal cannot be applied without explicit user approval. Pass the --approved flag.\x1b[0m`);
    console.error(`Example: node bin/multimodel-dev-os.js improve apply ${proposalFile} --approved`);
    process.exit(1);
  }

  console.log(`🚀 \x1b[34mApplying proposal: ${proposalFile}\x1b[0m`);
  const validation = validateProposal(proposalFile, options.target);
  if (!validation.valid) {
    console.error(`\x1b[31mValidation FAILED: ${validation.reason}\x1b[0m`);
    
    // Log the refusal
    const applyId = `apply-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;
    const logDir = join(options.target, '.ai', 'proposals');
    if (!existsSync(logDir)) {
      try { mkdirSync(logDir, { recursive: true }); } catch (e) {}
    }
    const logFile = join(logDir, 'apply-log.jsonl');
    const record = {
      id: applyId,
      proposal_id: validation.proposalId || basename(proposalFile, '.md'),
      applied_at: new Date().toISOString(),
      target: options.target,
      operations_count: 0,
      files_changed: [],
      before_hashes: {},
      after_hashes: {},
      status: 'refused',
      refused_reason: validation.reason,
      notes: `Validation failed: ${validation.reason}`
    };
    try {
      writeFileSync(logFile, JSON.stringify(record) + '\n', { flag: 'a', encoding: 'utf8' });
    } catch (err) {}
    process.exit(1);
  }

  const operations = validation.operations;
  const proposalId = validation.proposalId;

  // Print compact operations summary
  const createCount = operations.filter(op => op.type === 'create_file').length;
  const appendCount = operations.filter(op => op.type === 'append_line').length;
  const replaceCount = operations.filter(op => op.type === 'replace_text').length;
  console.log(`Summary of Operations:`);
  console.log(`  - ${createCount} file(s) to create`);
  console.log(`  - ${appendCount} file(s) to append`);
  console.log(`  - ${replaceCount} file(s) to modify (replace)`);
  console.log(`\nApplying changes...`);

  const filesChanged = [];
  const beforeHashes = {};
  const afterHashes = {};
  let status = 'success';
  let notes = '';

  const applyId = `apply-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;

  try {
    operations.forEach(op => {
      const relPath = relative(options.target, op.resolvedPath).replace(/\\/g, '/');
      if (!filesChanged.includes(relPath)) {
        filesChanged.push(relPath);
      }
      if (existsSync(op.resolvedPath)) {
        const fileContent = readFileSync(op.resolvedPath, 'utf8');
        beforeHashes[relPath] = getSha256(fileContent);
      } else {
        beforeHashes[relPath] = null;
      }
    });

    operations.forEach((op, idx) => {
      const relPath = relative(options.target, op.resolvedPath).replace(/\\/g, '/');
      console.log(`  Executing Operation #${idx + 1} (${op.type}) on '${relPath}'...`);

      if (op.type === 'create_file') {
        const dir = dirname(op.resolvedPath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        const exists = existsSync(op.resolvedPath);
        writeFileSync(op.resolvedPath, op.content, 'utf8');
        if (exists) {
          console.log(`    [OVERWRITTEN] Overwrote existing file '${relPath}'.`);
        } else {
          console.log(`    [CREATED] Created new file '${relPath}'.`);
        }
      } else if (op.type === 'append_line') {
        let content = '';
        if (existsSync(op.resolvedPath)) {
          content = readFileSync(op.resolvedPath, 'utf8');
        }
        const fileLines = content.split(/\r?\n/);
        const lineExists = fileLines.some(l => l.trim() === op.line.trim());
        if (!lineExists) {
          let newContent = content;
          if (content.length > 0 && !content.endsWith('\n') && !content.endsWith('\r')) {
            newContent += '\n';
          }
          newContent += op.line + '\n';
          const dir = dirname(op.resolvedPath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(op.resolvedPath, newContent, 'utf8');
          console.log(`    [APPENDED] Appended 1 line to '${relPath}'.`);
        } else {
          console.log(`    [IDEMPOTENT] Line already exists in '${relPath}'. Skipping append.`);
        }
      } else if (op.type === 'replace_text') {
        const fileContent = readFileSync(op.resolvedPath, 'utf8');
        let count = 0;
        let pos = fileContent.indexOf(op.find);
        while (pos !== -1) {
          count++;
          pos = fileContent.indexOf(op.find, pos + op.find.length);
        }

        let newContent;
        if (op.allow_multiple) {
          newContent = fileContent.split(op.find).join(op.replace);
        } else {
          newContent = fileContent.replace(op.find, op.replace);
          if (count > 0) count = 1;
        }
        writeFileSync(op.resolvedPath, newContent, 'utf8');
        console.log(`    [REPLACED] Replaced ${count} occurrence(s) of find text in '${relPath}'.`);
      }
    });

    filesChanged.forEach(relPath => {
      const fullPath = resolve(options.target, relPath);
      if (existsSync(fullPath)) {
        const fileContent = readFileSync(fullPath, 'utf8');
        afterHashes[relPath] = getSha256(fileContent);
      } else {
        afterHashes[relPath] = null;
      }
    });

    notes = `Successfully applied ${operations.length} operations.`;
  } catch (e) {
    status = 'failed';
    notes = `Execution error: ${e.message}`;
    console.error(`\x1b[31mError applying proposal: ${e.message}\x1b[0m`);
  }

  const logDir = join(options.target, '.ai', 'proposals');
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  const logFile = join(logDir, 'apply-log.jsonl');
  
  const record = {
    id: applyId,
    proposal_id: proposalId,
    applied_at: new Date().toISOString(),
    target: options.target,
    operations_count: operations.length,
    files_changed: filesChanged,
    before_hashes: beforeHashes,
    after_hashes: afterHashes,
    status,
    refused_reason: status === 'failed' ? notes : undefined,
    notes
  };

  try {
    writeFileSync(logFile, JSON.stringify(record) + '\n', { flag: 'a', encoding: 'utf8' });
  } catch (err) {
    console.error(`\x1b[31mFailed to write to audit log: ${err.message}\x1b[0m`);
  }

  if (status === 'success') {
    console.log(`\n\x1b[32m✔ Proposal applied successfully!\x1b[0m`);
    console.log(`Files changed:`);
    filesChanged.forEach(f => console.log(`  - ${f}`));
    console.log(`Audit log recorded to: ${logFile}`);
  } else {
    process.exit(1);
  }
}

function handleImproveLog(options) {
  const logFile = join(options.target, '.ai', 'proposals', 'apply-log.jsonl');
  if (!existsSync(logFile)) {
    console.log('No apply log found.');
    return;
  }

  try {
    const lines = readFileSync(logFile, 'utf8').trim().split(/\r?\n/);
    console.log(`\n📜 \x1b[36mApplied Proposals Audit Log\x1b[0m`);
    console.log('==================================================');
    lines.forEach(line => {
      if (!line.trim()) return;
      const record = JSON.parse(line);
      const statusColor = record.status === 'success' ? '\x1b[32m' : '\x1b[31m';
      console.log(`\n\x1b[34m* [${record.id}] Proposal: ${record.proposal_id}\x1b[0m`);
      console.log(`  \x1b[37mApplied At:\x1b[0m ${record.applied_at}`);
      console.log(`  \x1b[37mOperations:\x1b[0m ${record.operations_count}`);
      console.log(`  \x1b[37mFiles Changed:\x1b[0m ${record.files_changed.join(', ')}`);
      console.log(`  \x1b[37mStatus:\x1b[0m ${statusColor}${record.status}\x1b[0m`);
      console.log(`  \x1b[37mNotes:\x1b[0m ${record.notes}`);
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError reading audit log: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}

// ==================================================
// v2.5.0 Repository Intelligence Command Center
// ==================================================

function handleStatus(options) {
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
          const metadata = parseYaml(fmMatch[1]) || {};
          const status = metadata.approval_status || 'pending';
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

function getWorkflowsPath(target) {
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

function handleWorkflowList(options) {
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

function handleWorkflowShow(wName, options) {
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

function handleWorkflowPlan(wName, options) {
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
    console.log(`\n📝 \x1b[36mExecution Plan for Workflow: ${name}\x1b[0m`);
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

function handleWorkflowRun(wName, options) {
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
      'scan': () => handleScan(options),
      'doctor': () => handleDoctor(options),
      'verify': () => handleVerify({ ...options, noExit: true }),
      'memory diff': () => handleMemoryDiff({ ...options, noExit: true }),
      'memory refresh': () => handleMemoryRefresh(options),
      'memory build': () => handleMemoryBuild(options),
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

function handleHandoffBuild(options) {
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

function handleHandoffShow(options) {
  const handoffPath = join(options.target, '.ai', 'intelligence', 'handoff.md');
  if (!existsSync(handoffPath)) {
    console.log('No compiled handoff file exists. Building first...');
    handleHandoffBuild(options);
  }
  try {
    const content = readFileSync(handoffPath, 'utf8');
    console.log('\n' + content);
  } catch (e) {
    console.error(`\x1b[31mError reading handoff: ${e.message}\x1b[0m`);
  }
}

function handleDoctorIntelligence(options) {
  console.log(`\n🩺 \x1b[36mRunning advisory intelligence doctor checkup in: ${options.target}\x1b[0m\n`);

  let warnings = 0;
  const warn = (msg) => {
    console.warn(`  \x1b[33m[WARNING]\x1b[0m ${msg}`);
    warnings++;
  };

  // 1. Memory checks
  const memoryHashPath = join(options.target, '.ai', 'intelligence', 'memory.hash.json');
  if (!existsSync(memoryHashPath)) {
    warn('Memory hash index (.ai/intelligence/memory.hash.json) is MISSING. Run `memory build` first.');
  } else {
    try {
      const diff = diffMemory(options.target);
      if (!diff) {
        warn('Memory hash index is present but corrupt.');
      } else if (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0) {
        warn(`Memory hash index is STALE. Delts: +${diff.added.length}, -${diff.removed.length}, ~${diff.changed.length}. Run \`memory refresh\`.`);
      }
    } catch (e) {
      warn('Failed to diff memory index.');
    }
  }

  // 2. Feedback checks
  const feedbackPath = join(options.target, '.ai', 'intelligence', 'feedback-log.jsonl');
  if (!existsSync(feedbackPath)) {
    warn('Feedback log (.ai/intelligence/feedback-log.jsonl) is MISSING.');
  }
  const rulesPath = join(options.target, '.ai', 'intelligence', 'learning-rules.md');
  if (!existsSync(rulesPath)) {
    warn('Learning rules (.ai/intelligence/learning-rules.md) are MISSING. Run `feedback summarize` to compile logs.');
  }

  // 3. Proposals checks
  const proposalsDir = join(options.target, '.ai', 'proposals');
  if (!existsSync(proposalsDir)) {
    warn('Proposals directory (.ai/proposals) is MISSING.');
  } else {
    try {
      const files = readdirSync(proposalsDir).filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
      let pending = 0;
      files.forEach(file => {
        const content = readFileSync(join(proposalsDir, file), 'utf8');
        const fmMatch = content.match(/^---([\s\S]*?)---/);
        if (fmMatch) {
          const metadata = parseYaml(fmMatch[1]) || {};
          if ((metadata.approval_status || 'pending') === 'pending') {
            pending++;
          }
        }
      });
      if (pending > 0) {
        warn(`Found ${pending} pending improvement proposals waiting for approval.`);
      }
    } catch (e) {}
  }

  // 4. Apply log check
  const applyLogPath = join(options.target, '.ai', 'proposals', 'apply-log.jsonl');
  if (!existsSync(applyLogPath)) {
    warn('Apply audit log (.ai/proposals/apply-log.jsonl) is MISSING.');
  }

  // 5. Gitignore ignores intelligence checks
  const gitignorePath = join(options.target, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignoreContent = readFileSync(gitignorePath, 'utf8');
    const checkIgnore = (pattern) => {
      if (!gitignoreContent.includes(pattern)) {
        warn(`.gitignore is missing rules ignoring: ${pattern}`);
      }
    };
    checkIgnore('.ai/intelligence/handoff.md');
    checkIgnore('.ai/intelligence/status.snapshot.json');
    checkIgnore('.ai/intelligence/feedback-log.jsonl');
    checkIgnore('.ai/intelligence/learning-rules.md');
    checkIgnore('.ai/proposals/apply-log.jsonl');
  } else {
    warn('.gitignore file is missing in target root.');
  }

  // 6. Danger files check inside memory index
  if (existsSync(memoryHashPath)) {
    try {
      const memObj = JSON.parse(readFileSync(memoryHashPath, 'utf8'));
      const fingerprints = memObj.file_fingerprints || {};
      Object.keys(fingerprints).forEach(file => {
        const name = file.toLowerCase();
        if (name.includes('.env') || name.includes('id_rsa') || name.includes('credential') || name.endsWith('.pem') || name.endsWith('.p12') || name.endsWith('.key') || name.endsWith('.keystore') || name.endsWith('.jks')) {
          warn(`Memory index contains potentially sensitive file: ${file}`);
        }
      });
    } catch (e) {}
  }

  console.log('\n==================================================');
  if (warnings > 0) {
    console.log(`\x1b[33mDoctor intelligence check complete. Found ${warnings} warnings.\x1b[0m\n`);
  } else {
    console.log('\x1b[32m✔ Doctor intelligence check complete. Your intelligence setup is pristine!\x1b[0m\n');
  }
}

function getAnalysis(target) {
  const { files, ignoredCount } = scanTarget(target);
  const frameworks = detectFrameworkSignals(files, target);
  const packageManagers = detectDependencySignals(files, target);
  const aiSignals = detectAiDevOsSignals(files);

  let jsCount = 0, tsCount = 0, phpCount = 0, pyCount = 0, mdCount = 0;
  files.forEach(f => {
    const ext = f.relPath.substring(f.relPath.lastIndexOf('.')).toLowerCase();
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') jsCount++;
    else if (ext === '.ts' || ext === '.tsx') tsCount++;
    else if (ext === '.php') phpCount++;
    else if (ext === '.py') pyCount++;
    else if (ext === '.md') mdCount++;
  });

  let language = 'mixed';
  if (tsCount > jsCount && tsCount > phpCount && tsCount > pyCount && tsCount > mdCount) language = 'TS';
  else if (jsCount > tsCount && jsCount > phpCount && jsCount > pyCount && jsCount > mdCount) language = 'JS';
  else if (phpCount > jsCount && phpCount > tsCount && phpCount > pyCount && phpCount > mdCount) language = 'PHP';
  else if (pyCount > jsCount && pyCount > tsCount && phpCount > pyCount && phpCount > mdCount) language = 'Python';
  else if (mdCount > jsCount && mdCount > tsCount && mdCount > phpCount && mdCount > pyCount) language = 'Markdown-heavy';

  let repoType = 'app';
  if (files.some(f => f.relPath.includes('wp-content/themes') || f.relPath.includes('wp-content/plugins'))) {
    repoType = 'WordPress theme/plugin';
  } else if (files.some(f => f.relPath.includes('app.json') || f.relPath.includes('eas.json'))) {
    repoType = 'mobile app';
  } else if (files.some(f => f.relPath.includes('lerna.json') || f.relPath.includes('pnpm-workspace.yaml'))) {
    repoType = 'monorepo';
  } else if (files.some(f => f.relPath.includes('docs/')) && mdCount > (files.length * 0.4)) {
    repoType = 'docs';
  } else if (files.some(f => f.relPath === 'package.json')) {
    try {
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      if (pkg.main && (pkg.main.includes('dist/') || pkg.main.includes('lib/'))) {
        repoType = 'library';
      }
    } catch (e) {}
  }

  const existingTools = [];
  if (files.some(f => f.relPath === '.cursorrules')) existingTools.push('Cursor');
  if (files.some(f => f.relPath === 'CLAUDE.md')) existingTools.push('Claude');
  if (files.some(f => f.relPath === 'GEMINI.md')) existingTools.push('Gemini');
  if (files.some(f => f.relPath.startsWith('.vscode/'))) existingTools.push('VS Code');
  if (files.some(f => f.relPath.startsWith('.gemini/'))) existingTools.push('Antigravity');

  const packageScripts = [];
  if (files.some(f => f.relPath === 'package.json')) {
    try {
      const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
      if (pkg.scripts) {
        Object.keys(pkg.scripts).forEach(k => packageScripts.push(k));
      }
    } catch (e) {}
  }

  const githubWorkflows = [];
  const githubDir = join(target, '.github', 'workflows');
  if (existsSync(githubDir)) {
    try {
      readdirSync(githubDir).forEach(f => {
        if (f.endsWith('.yml') || f.endsWith('.yaml')) githubWorkflows.push(f);
      });
    } catch (e) {}
  }

  const envRiskMarkers = [];
  files.forEach(f => {
    const name = f.relPath.toLowerCase();
    if (name.includes('.env') || name.includes('id_rsa') || name.includes('credential') || name.endsWith('.pem') || name.endsWith('.key') || name.endsWith('.keystore') || name.endsWith('.jks')) {
      envRiskMarkers.push(f.relPath);
    }
  });

  return {
    packageManagers,
    frameworks,
    language,
    repoType,
    existingTools,
    packageScripts,
    githubWorkflows,
    envRiskMarkers,
    aiSignals,
    filesCount: files.length,
    ignoredCount
  };
}

function getRecommendation(analysis) {
  const scores = {
    'nextjs-saas': 0.0,
    'expo-react-native-android': 0.0,
    'wordpress-site': 0.0,
    'ecommerce-store': 0.0,
    'seo-landing-page': 0.0,
    'general-app': 0.1
  };

  if (analysis.frameworks.includes('Next.js')) scores['nextjs-saas'] += 0.6;
  if (analysis.frameworks.includes('React')) scores['nextjs-saas'] += 0.2;
  if (analysis.frameworks.includes('TypeScript')) scores['nextjs-saas'] += 0.1;

  if (analysis.repoType === 'mobile app') scores['expo-react-native-android'] += 0.6;
  if (analysis.frameworks.includes('Expo') || analysis.frameworks.includes('React Native')) scores['expo-react-native-android'] += 0.3;

  if (analysis.repoType === 'WordPress theme/plugin') scores['wordpress-site'] += 0.6;
  if (analysis.frameworks.includes('WordPress/PHP')) scores['wordpress-site'] += 0.3;

  if (analysis.frameworks.includes('Vite') || analysis.frameworks.includes('React')) scores['seo-landing-page'] += 0.3;

  let recommended = 'general-app';
  let maxScore = 0.0;
  Object.keys(scores).forEach(k => {
    if (scores[k] > maxScore) {
      maxScore = scores[k];
      recommended = k;
    }
  });

  const suggestedAdapters = ['cursor', 'claude', 'gemini', 'vscode', 'antigravity'];

  return {
    template: recommended,
    confidence: Math.min(1.0, maxScore === 0.1 ? 0.5 : maxScore),
    suggestedAdapters,
    riskNotes: analysis.envRiskMarkers.length > 0 ? 'Workspace contains unignored credentials or key files. Ensure .gitignore covers them.' : 'None'
  };
}

function handleOnboardAnalyze(options) {
  console.log(`\n🔍 \x1b[36mAnalyzing Workspace for Onboarding: ${options.target}\x1b[0m`);
  console.log('==================================================');
  const analysis = getAnalysis(options.target);

  console.log(`  Package Manager:       ${analysis.packageManagers.join(', ') || 'None'}`);
  console.log(`  Detected Frameworks:   ${analysis.frameworks.join(', ') || 'None'}`);
  console.log(`  Dominant Language:     ${analysis.language}`);
  console.log(`  Repository Type:       ${analysis.repoType}`);
  console.log(`  Existing AI Tools:     ${analysis.existingTools.join(', ') || 'None'}`);
  console.log(`  GitHub Workflows:      ${analysis.githubWorkflows.join(', ') || 'None'}`);
  console.log(`  Security Risk Markers: ${analysis.envRiskMarkers.length} files found`);
  if (analysis.envRiskMarkers.length > 0) {
    analysis.envRiskMarkers.forEach(m => console.log(`    └─> ${m} (potential secrets exposure risk)`));
  }
  console.log();
}

function handleOnboardRecommend(options) {
  const analysis = getAnalysis(options.target);
  const rec = getRecommendation(analysis);

  console.log(`\n💡 \x1b[36mOnboarding Recommendation for: ${options.target}\x1b[0m`);
  console.log('==================================================');
  console.log(`  Recommended Template:  \x1b[32m${rec.template}\x1b[0m`);
  console.log(`  Confidence Score:      ${(rec.confidence * 100).toFixed(0)}%`);
  console.log(`  Suggested Adapters:    ${rec.suggestedAdapters.join(', ')}`);
  console.log(`  Risk Notes:            ${rec.riskNotes}`);
  console.log(`  Suggested Next Command:`);
  console.log(`    npx multimodel-dev-os onboard plan --target .`);
  console.log();
}

function handleOnboardPlan(options) {
  console.log(`\n📋 \x1b[36mGenerating Onboarding Plan: ${options.target}\x1b[0m`);
  console.log('==================================================');
  const analysis = getAnalysis(options.target);
  const rec = getRecommendation(analysis);

  const planPath = join(options.target, '.ai', 'intelligence', 'onboarding.plan.json');
  const reportPath = join(options.target, '.ai', 'intelligence', 'onboarding.report.md');

  const plannedFiles = [
    { action: 'CREATE', path: 'AGENTS.md', source_template: `examples/${rec.template}/AGENTS.md` },
    { action: 'CREATE', path: 'MEMORY.md', source_template: `examples/${rec.template}/MEMORY.md` },
    { action: 'CREATE', path: 'TASKS.md', source_template: `examples/${rec.template}/TASKS.md` },
    { action: 'CREATE', path: 'RUNBOOK.md', source_template: `RUNBOOK.md` },
    { action: 'CREATE', path: '.ai/config.yaml', source_template: `examples/${rec.template}/.ai/config.yaml` }
  ];

  const planData = {
    generated_at: new Date().toISOString(),
    target_path: options.target,
    project_analysis: {
      package_manager: analysis.packageManagers.join(', ') || 'npm',
      framework: analysis.frameworks.join(', ') || 'Generic',
      language: analysis.language,
      repo_type: analysis.repoType,
      has_existing_ai_config: analysis.aiSignals.includes('.ai/config.yaml'),
      risk_markers: analysis.envRiskMarkers
    },
    recommendation: {
      template: rec.template,
      confidence: rec.confidence,
      suggested_adapters: rec.suggestedAdapters,
      reasons: [`Detected dominant language ${analysis.language}`, `Detected framework ${analysis.frameworks.join(', ')}`]
    },
    planned_files: plannedFiles
  };

  let reportMd = `# MultiModel Dev OS Onboarding Report\n\n`;
  reportMd += `**Generated At:** ${planData.generated_at}\n`;
  reportMd += `**Target Path:** ${planData.target_path}\n\n`;
  reportMd += `## 1. Project Analysis Details\n`;
  reportMd += `- **Package Manager:** ${planData.project_analysis.package_manager}\n`;
  reportMd += `- **Frameworks:** ${planData.project_analysis.framework}\n`;
  reportMd += `- **Language:** ${planData.project_analysis.language}\n`;
  reportMd += `- **Repo Type:** ${planData.project_analysis.repo_type}\n\n`;

  reportMd += `## 2. Onboarding Recommendation\n`;
  reportMd += `- **Recommended Profile:** **${planData.recommendation.template}** (Confidence: ${(planData.recommendation.confidence * 100).toFixed(0)}%)\n`;
  reportMd += `- **Suggested Adapters:** ${planData.recommendation.suggested_adapters.join(', ')}\n\n`;

  reportMd += `## 3. Planned File Operations\n`;
  reportMd += `| Action | Target Path | Source Template |\n`;
  reportMd += `|---|---|---|\n`;
  plannedFiles.forEach(f => {
    reportMd += `| ${f.action} | ${f.path} | ${f.source_template} |\n`;
  });
  reportMd += `\n`;

  reportMd += `## 4. Next Step\n`;
  reportMd += `To safely apply this plan, run:\n`;
  reportMd += `\`\`\`bash\n`;
  reportMd += `npx multimodel-dev-os onboard apply --target . --approved\n`;
  reportMd += `\`\`\`\n`;

  try {
    const intelDir = join(options.target, '.ai', 'intelligence');
    if (!options.dryRun && !existsSync(intelDir)) {
      mkdirSync(intelDir, { recursive: true });
    }
    if (!options.dryRun) {
      writeFileSync(planPath, JSON.stringify(planData, null, 2), 'utf8');
      writeFileSync(reportPath, reportMd, 'utf8');
    }

    console.log(`  [SUCCESS] Onboarding plan generated:`);
    console.log(`    - Plan JSON:   .ai/intelligence/onboarding.plan.json`);
    console.log(`    - Report MD:   .ai/intelligence/onboarding.report.md`);
    console.log(`\nReview the plan and run "npx multimodel-dev-os onboard apply --target . --approved" to execute.\n`);
  } catch (e) {
    console.error(`\x1b[31mError writing plan: ${e.message}\x1b[0m`);
  }
}

function handleOnboardApply(options) {
  if (!options.approved) {
    console.error('\x1b[31mError: Onboarding apply requires explicit approval flag: --approved\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js onboard apply --approved');
    process.exit(1);
  }

  const planPath = join(options.target, '.ai', 'intelligence', 'onboarding.plan.json');
  if (!existsSync(planPath)) {
    console.error('\x1b[31mError: Onboarding plan not found. Run "npx multimodel-dev-os onboard plan" first.\x1b[0m');
    process.exit(1);
  }

  let plan;
  try {
    plan = JSON.parse(readFileSync(planPath, 'utf8'));
  } catch (e) {
    console.error(`\x1b[31mError reading plan JSON: ${e.message}\x1b[0m`);
    process.exit(1);
  }

  console.log(`\n🚀 \x1b[36mApplying Onboarding Scaffolding: ${options.target}\x1b[0m`);
  console.log('==================================================');

  const template = plan.recommendation.template;
  options.template = template;

  const operations = [];

  plan.planned_files.forEach(f => {
    let srcFile;
    if (f.source_template === 'RUNBOOK.md') {
      srcFile = join(sourceRoot, 'RUNBOOK.md');
    } else {
      srcFile = join(sourceRoot, f.source_template);
    }
    operations.push({ dest: f.path, src: srcFile });
  });

  const templateDir = join(sourceRoot, 'examples', template);
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

  const globalAiSubdirs = ['context', 'agents', 'skills', 'prompts', 'checks', 'templates', 'session-logs', 'registries', 'proposals', 'intelligence'];
  globalAiSubdirs.forEach(sub => {
    const globalPath = join(sourceRoot, '.ai', sub);
    if (existsSync(globalPath)) {
      readdirSync(globalPath).forEach(file => {
        const destRel = join('.ai', sub, file);
        if (!operations.some(op => op.dest === destRel)) {
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

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  operations.forEach(op => {
    const destPath = join(options.target, op.dest);
    const destDir = dirname(destPath);

    if (existsSync(destPath)) {
      if (options.force) {
        if (!options.dryRun) {
          const backupPath = destPath + '.bak';
          writeFileSync(backupPath, readFileSync(destPath));
          if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
          writeFileSync(destPath, readFileSync(op.src));
          console.log(`  \x1b[33mOVERWRITE (BACKUP CREATED):\x1b[0m ${op.dest} -> ${op.dest}.bak`);
        } else {
          console.log(`  \x1b[36m[DRY-RUN] WOULD OVERWRITE & BACKUP:\x1b[0m ${op.dest}`);
        }
        updatedCount++;
      } else {
        console.log(`  \x1b[37m[SKIP] Already exists:\x1b[0m ${op.dest}`);
        skippedCount++;
      }
    } else {
      if (!options.dryRun) {
        if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
        writeFileSync(destPath, readFileSync(op.src));
        console.log(`  \x1b[32mCREATE:\x1b[0m ${op.dest}`);
      } else {
        console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE:\x1b[0m ${op.dest}`);
      }
      createdCount++;
    }
  });

  console.log(`\n✔ Onboarding apply complete! Created: ${createdCount}, Skipped: ${skippedCount}, Overwritten (with backup): ${updatedCount}\n`);
}

function handleOnboardStatus(options) {
  console.log(`\n📊 \x1b[36mOnboarding Status Dashboard: ${options.target}\x1b[0m`);
  console.log('==================================================');

  const crucialFiles = [
    'AGENTS.md',
    'MEMORY.md',
    'TASKS.md',
    'RUNBOOK.md',
    '.ai/config.yaml'
  ];

  let presentCount = 0;
  crucialFiles.forEach(f => {
    const fullPath = join(options.target, f);
    const exists = existsSync(fullPath);
    if (exists) presentCount++;
    console.log(`  [${exists ? '✔' : ' '}] ${f}`);
  });

  const percentage = (presentCount / crucialFiles.length) * 100;
  console.log(`\n  Completeness Score: ${percentage.toFixed(0)}%`);
  if (percentage === 100) {
    console.log('  Status: \x1b[32mREADY (Onboarding complete)\x1b[0m\n');
  } else if (percentage > 0) {
    console.log('  Status: \x1b[33mIN_PROGRESS (Run "onboard apply --approved" to initialize remaining files)\x1b[0m\n');
  } else {
    console.log('  Status: \x1b[31mMISSING (Run "onboard plan" and "onboard apply" to onboard this repo)\x1b[0m\n');
  }
}

function getEnabledAdapters(target) {
  const configPath = join(target, '.ai', 'config.yaml');
  if (existsSync(configPath)) {
    try {
      const config = parseYaml(readFileSync(configPath, 'utf8')) || {};
      return config.adapters || {};
    } catch (e) {}
  }
  return {};
}

function handleAdapterStatus(options) {
  console.log(`\n🔌 \x1b[36mIDE & Agent Adapters Status: ${options.target}\x1b[0m`);
  console.log('==================================================');

  const enabled = getEnabledAdapters(options.target);

  Object.keys(ADAPTERS).forEach(name => {
    const a = ADAPTERS[name];
    const isEnabled = enabled[name] || false;
    const rulesFile = a.rules_file;
    const exists = existsSync(join(options.target, rulesFile));

    let statusStr = '\x1b[31mMISSING\x1b[0m';
    if (exists) {
      statusStr = '\x1b[32mINSTALLED\x1b[0m';
    }

    console.log(`\n\x1b[33m* ${a.name || name}\x1b[0m (${name})`);
    console.log(`  Config Status: ${isEnabled ? '\x1b[32mENABLED\x1b[0m' : '\x1b[37mDISABLED\x1b[0m'}`);
    console.log(`  File Status:   ${statusStr} (${rulesFile})`);
  });
  console.log();
}

function printDiff(srcContent, destContent, filename) {
  console.log(`\nDiff for ${filename}:`);
  console.log('--------------------------------------------------');
  if (srcContent === destContent) {
    console.log('  Pristine (No differences detected)');
    return;
  }
  const srcLines = srcContent.split(/\r?\n/);
  const destLines = destContent.split(/\r?\n/);

  let i = 0;
  while (i < Math.max(srcLines.length, destLines.length)) {
    const sLine = srcLines[i];
    const dLine = destLines[i];
    if (sLine !== dLine) {
      if (dLine !== undefined) console.log(`\x1b[31m- ${dLine}\x1b[0m`);
      if (sLine !== undefined) console.log(`\x1b[32m+ ${sLine}\x1b[0m`);
    } else {
      if (sLine !== undefined) console.log(`  ${sLine}`);
    }
    i++;
  }
}

function handleAdapterDiff(aName, options) {
  const adaptersToDiff = [];
  if (aName === 'all') {
    const enabled = getEnabledAdapters(options.target);
    Object.keys(ADAPTERS).forEach(name => {
      if (enabled[name]) adaptersToDiff.push(name);
    });
  } else {
    if (!ADAPTERS[aName]) {
      console.error(`\x1b[31mError: Adapter '${aName}' not found in registry.\x1b[0m`);
      process.exit(1);
    }
    adaptersToDiff.push(aName);
  }

  if (adaptersToDiff.length === 0) {
    console.log('No enabled adapters found to diff.');
    return;
  }

  adaptersToDiff.forEach(name => {
    const a = ADAPTERS[name];
    const srcFile = join(sourceRoot, 'adapters', name, a.rules_file);
    const destFile = join(options.target, a.rules_file);

    if (!existsSync(srcFile)) {
      console.warn(`Warning: Source file for adapter '${name}' is missing at: ${srcFile}`);
      return;
    }

    const srcContent = readFileSync(srcFile, 'utf8');
    if (existsSync(destFile)) {
      const destContent = readFileSync(destFile, 'utf8');
      printDiff(srcContent, destContent, a.rules_file);
    } else {
      console.log(`\nFile: ${a.rules_file} \x1b[31m(MISSING)\x1b[0m`);
      console.log('--------------------------------------------------');
      srcContent.split(/\r?\n/).forEach(l => console.log(`\x1b[32m+ ${l}\x1b[0m`));
    }
  });
}

function handleAdapterSync(aName, options) {
  if (!options.approved) {
    console.error('\x1b[31mError: Adapter sync requires explicit approval flag: --approved\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js adapter sync cursor --approved');
    process.exit(1);
  }

  const adaptersToSync = [];
  if (aName === 'all') {
    const enabled = getEnabledAdapters(options.target);
    Object.keys(ADAPTERS).forEach(name => {
      if (enabled[name]) adaptersToSync.push(name);
    });
  } else {
    if (!ADAPTERS[aName]) {
      console.error(`\x1b[31mError: Adapter '${aName}' not found in registry.\x1b[0m`);
      process.exit(1);
    }
    adaptersToSync.push(aName);
  }

  if (adaptersToSync.length === 0) {
    console.log('No adapters found to sync.');
    return;
  }

  console.log(`\n🔄 \x1b[36mSynchronizing IDE Adapters in: ${options.target}\x1b[0m`);
  console.log('==================================================');

  adaptersToSync.forEach(name => {
    const a = ADAPTERS[name];
    const srcFile = join(sourceRoot, 'adapters', name, a.rules_file);
    const destFile = join(options.target, a.rules_file);
    const destDir = dirname(destFile);

    if (!existsSync(srcFile)) {
      console.warn(`Warning: Source file for adapter '${name}' is missing at: ${srcFile}`);
      return;
    }

    if (existsSync(destFile)) {
      if (options.force) {
        if (!options.dryRun) {
          const backupPath = destFile + '.bak';
          writeFileSync(backupPath, readFileSync(destFile));
          if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[33mOVERWRITE (BACKUP CREATED):\x1b[0m ${a.rules_file} -> ${a.rules_file}.bak`);
        } else {
          console.log(`  \x1b[36m[DRY-RUN] WOULD OVERWRITE & BACKUP:\x1b[0m ${a.rules_file}`);
        }
      } else {
        console.log(`  \x1b[37m[SKIP] Already exists:\x1b[0m ${a.rules_file}`);
      }
    } else {
      if (!options.dryRun) {
        if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
        writeFileSync(destFile, readFileSync(srcFile));
        console.log(`  \x1b[32mCREATE:\x1b[0m ${a.rules_file}`);
      } else {
        console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE:\x1b[0m ${a.rules_file}`);
      }
    }
  });

  console.log();
}

function handleDoctorOnboarding(options) {
  console.log(`\n🩺 \x1b[36mRunning advisory onboarding doctor checkup in: ${options.target}\x1b[0m\n`);

  let warnings = 0;
  const warn = (msg) => {
    console.warn(`  \x1b[33m[WARNING]\x1b[0m ${msg}`);
    warnings++;
  };

  const crucialFiles = [
    'AGENTS.md',
    'MEMORY.md',
    'TASKS.md',
    'RUNBOOK.md'
  ];

  crucialFiles.forEach(f => {
    if (!existsSync(join(options.target, f))) {
      warn(`Crucial onboarding file '${f}' is missing from project root.`);
    }
  });

  const configPath = join(options.target, '.ai', 'config.yaml');
  if (!existsSync(configPath)) {
    warn('MultiModel Dev OS configuration file (.ai/config.yaml) is missing.');
  }

  const registriesDir = join(options.target, '.ai', 'registries');
  if (!existsSync(registriesDir)) {
    warn('Registries directory (.ai/registries) is missing.');
  }

  const proposalsDir = join(options.target, '.ai', 'proposals');
  if (!existsSync(proposalsDir)) {
    warn('Proposals directory (.ai/proposals) is missing.');
  }

  const intelligenceDir = join(options.target, '.ai', 'intelligence');
  if (!existsSync(intelligenceDir)) {
    warn('Intelligence directory (.ai/intelligence) is missing.');
  }

  const gitignorePath = join(options.target, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignoreContent = readFileSync(gitignorePath, 'utf8');
    const checkIgnore = (pattern) => {
      if (!gitignoreContent.includes(pattern)) {
        warn(`Generated runtime file '${pattern}' is not ignored in .gitignore.`);
      }
    };
    checkIgnore('onboarding.plan.json');
    checkIgnore('onboarding.report.md');
  }

  const { files } = scanTarget(options.target);
  const packageManagers = detectDependencySignals(files, options.target);
  if (packageManagers.length === 0) {
    warn('No package manager lockfile detected in project root.');
  }

  console.log('\n==================================================');
  if (warnings > 0) {
    console.log(`\x1b[33mDoctor onboarding check complete. Found ${warnings} warnings.\x1b[0m\n`);
  } else {
    console.log('\x1b[32m✔ Doctor onboarding check complete. Your workspace onboarding setup is pristine!\x1b[0m\n');
  }
}

// --- Phase 3 & 4 & 5 & 6: TUI Dashboard & Plugin Hooks System ---

function selectMenu(title, items, callback) {
  let cursor = 0;
  
  const draw = () => {
    console.clear();
    console.log(`\n🧠 \x1b[36m${title}\x1b[0m`);
    console.log('==================================================');
    items.forEach((item, index) => {
      if (index === cursor) {
        console.log(`  \x1b[32m❯ ${item.name}\x1b[0m`);
      } else {
        console.log(`    ${item.name}`);
      }
    });
    console.log('\n\x1b[90m(Use Arrow keys to navigate, Enter to select, Esc/Ctrl+C to exit)\x1b[0m\n');
  };

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  const onKeypress = (str, key) => {
    if (!key) return;
    if (key.name === 'up') {
      cursor = (cursor - 1 + items.length) % items.length;
      draw();
    } else if (key.name === 'down') {
      cursor = (cursor + 1) % items.length;
      draw();
    } else if (key.name === 'return') {
      cleanup();
      callback(items[cursor]);
    } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
      cleanup();
      process.exit(0);
    }
  };

  const cleanup = () => {
    process.stdin.removeListener('keypress', onKeypress);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  };

  process.stdin.on('keypress', onKeypress);
  draw();
}

function handleDashboard(options) {
  const mainMenu = [
    { name: 'Active Workspace Status', action: 'command', command: 'status' },
    { name: 'Codebase Scan Analysis', action: 'command', command: 'scan' },
    { name: 'Onboarding Operations...', action: 'submenu', menu: 'onboard' },
    { name: 'Adapter Synchronization...', action: 'submenu', menu: 'adapter' },
    { name: 'Memory & Intelligence...', action: 'submenu', menu: 'memory' },
    { name: 'Developer Feedback Loops...', action: 'submenu', menu: 'feedback' },
    { name: 'Workflow Marketplace Catalog...', action: 'submenu', menu: 'catalog' },
    { name: 'Quality Gates & Diagnostics...', action: 'submenu', menu: 'quality' },
    { name: 'Plugins Status Overview', action: 'command', command: 'plugin status' },
    { name: 'Exit Command Center', action: 'exit' }
  ];

  const submenus = {
    onboard: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Onboard: Analyze Repository', action: 'command', command: 'onboard analyze' },
      { name: 'Onboard: Recommendation Summary', action: 'command', command: 'onboard recommend' },
      { name: 'Onboard: Generate Integration Plan', action: 'command', command: 'onboard plan' },
      { name: 'Onboard: Apply Configs (Dry Run)', action: 'command', command: 'onboard apply --dry-run' },
      { name: 'Onboard: View Status Heuristics', action: 'command', command: 'onboard status' }
    ],
    adapter: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Adapters: Check Sync Status', action: 'command', command: 'adapter status' },
      { name: 'Adapters: Sync All rule files (Dry Run)', action: 'command', command: 'adapter sync all --dry-run' },
      { name: 'Adapters: Diff Cursor rules', action: 'command', command: 'adapter diff cursor' },
      { name: 'Adapters: Diff Claude rules', action: 'command', command: 'adapter diff claude' }
    ],
    memory: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Memory: Build index', action: 'command', command: 'memory build' },
      { name: 'Memory: Refresh changes', action: 'command', command: 'memory refresh' },
      { name: 'Memory: Diff index status', action: 'command', command: 'memory diff' },
      { name: 'Handoff: Build session summary', action: 'command', command: 'handoff build' },
      { name: 'Handoff: Print summary to terminal', action: 'command', command: 'handoff show' }
    ],
    feedback: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Feedback: List developer corrections', action: 'command', command: 'feedback list' },
      { name: 'Feedback: Summarize to learning rules', action: 'command', command: 'feedback summarize' },
      { name: 'Proposals: Propose improvement proposal', action: 'command', command: 'improve propose' },
      { name: 'Proposals: Review active proposals list', action: 'command', command: 'improve review' }
    ],
    catalog: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Catalog: List bundled plugins', action: 'command', command: 'catalog list' },
      { name: 'Catalog: Recommend for current repo', action: 'command', command: 'catalog recommend' },
      { name: 'Catalog: Show installed catalog status', action: 'command', command: 'catalog status' }
    ],
    quality: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Doctor: Run Advisory Diagnostics', action: 'command', command: 'doctor' },
      { name: 'Validate: Strict Schema Compliance', action: 'command', command: 'validate' },
      { name: 'Verify: Run Release verification tests', action: 'command', command: 'verify' }
    ]
  };

  if (!process.stdout.isTTY || !process.stdin.isTTY || options.dryRun || options.listActions) {
    console.log(`\n📊 \x1b[36mMultiModel Dev OS Command Center (Headless/CI Preview)\x1b[0m`);
    console.log(`Target Workspace: \x1b[32m${options.target}\x1b[0m`);
    console.log('==================================================');
    
    const targetFlag = options.target === process.cwd() ? '' : ` --target "${options.target}"`;

    mainMenu.forEach(item => {
      if (item.action === 'command') {
        console.log(`  \x1b[33m•\x1b[0m ${item.name.padEnd(30)} → \x1b[36mnpx multimodel-dev-os ${item.command}${targetFlag}\x1b[0m`);
      } else if (item.action === 'submenu') {
        console.log(`\n  \x1b[35m[${item.name.replace('...', '')}]\x1b[0m`);
        submenus[item.menu].forEach(sub => {
          if (sub.action === 'command') {
            console.log(`    └─ ${sub.name.padEnd(35)} → \x1b[36mnpx multimodel-dev-os ${sub.command}${targetFlag}\x1b[0m`);
          }
        });
      }
    });
    console.log('\n\x1b[90m(Run with -t or --target to specify another workspace directory)\x1b[0m\n');
    return;
  }

  const runCommandWrapper = (cmdStr) => {
    console.clear();
    const targetFlag = options.target === process.cwd() ? '' : ` --target "${options.target}"`;
    console.log(`\n\x1b[36mRunning Command:\x1b[0m npx multimodel-dev-os ${cmdStr}${targetFlag}`);
    console.log('--------------------------------------------------\n');
    try {
      const cliPath = join(sourceRoot, 'bin', 'multimodel-dev-os.js');
      execSync(`node "${cliPath}" ${cmdStr} --target "${options.target}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`\n\x1b[31mCommand failed with error: ${e.message}\x1b[0m`);
    }
    console.log('\n--------------------------------------------------');
    console.log('Press any key to return to menu...');
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    return new Promise(resolve => {
      process.stdin.once('keypress', () => {
        resolve();
      });
    });
  };

  const showMenu = (menuItems, title) => {
    selectMenu(title, menuItems, async (selected) => {
      if (selected.action === 'exit') {
        process.exit(0);
      } else if (selected.action === 'back') {
        showMenu(mainMenu, 'MultiModel Dev OS Command Center');
      } else if (selected.action === 'submenu') {
        showMenu(submenus[selected.menu], selected.name);
      } else if (selected.action === 'command') {
        await runCommandWrapper(selected.command);
        showMenu(menuItems, title);
      }
    });
  };

  showMenu(mainMenu, 'MultiModel Dev OS Command Center');
}

function getPluginsDir(targetDir) {
  return join(targetDir, '.ai', 'plugins');
}

function handlePluginList(options) {
  const pluginsDir = getPluginsDir(options.target);
  const rawRelPath = relative(process.cwd(), join(sourceRoot, '.ai', 'plugins', 'plugin.example.yaml')).replace(/\\/g, '/');
  const examplePath = rawRelPath.startsWith('.') ? rawRelPath : `./${rawRelPath}`;

  if (!existsSync(pluginsDir)) {
    if (options.json) {
      console.log('[]');
      return;
    }
    console.log(`\n🔌 \x1b[36mInstalled Plugins in: ${options.target}\x1b[0m`);
    console.log('==================================================');
    console.log('  No plugins installed. Try:');
    console.log(`  npx multimodel-dev-os plugin install ${examplePath} --approved`);
    console.log('');
    return;
  }
  
  let files = [];
  try {
    files = readdirSync(pluginsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  } catch (e) {}

  const plugins = [];
  files.forEach(f => {
    try {
      const p = parseYaml(readFileSync(join(pluginsDir, f), 'utf8'));
      if (p && p.name && p.slug) {
        plugins.push(p);
      }
    } catch (e) {}
  });

  if (options.json) {
    console.log(JSON.stringify(plugins, null, 2));
    return;
  }

  console.log(`\n🔌 \x1b[36mInstalled Plugins in: ${options.target} (${plugins.length})\x1b[0m`);
  console.log('==================================================');
  if (plugins.length === 0) {
    console.log('  No plugins installed. Try:');
    console.log(`  npx multimodel-dev-os plugin install ${examplePath} --approved`);
  } else {
    plugins.forEach(p => {
      console.log(`\n\x1b[32m* ${p.name} (v${p.version || '1.0.0'})\x1b[0m [slug: \x1b[33m${p.slug}\x1b[0m]`);
      console.log(`  Description: ${p.description || 'No description'}`);
      console.log(`  Author:      ${p.author || 'Unknown'}`);
    });
  }
  console.log('\nUse \x1b[36mplugin show <slug>\x1b[0m to view detailed plugin capabilities.\n');
}

function handlePluginShow(slug, options) {
  if (!/^[a-z0-9-_]+$/i.test(slug)) {
    console.error(`\x1b[31mError: Invalid plugin slug '${slug}'. Slugs must be alphanumeric with dashes or underscores only.\x1b[0m`);
    process.exit(1);
  }

  const pluginsDir = getPluginsDir(options.target);
  let p = null;
  if (existsSync(pluginsDir)) {
    const files = readdirSync(pluginsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const f of files) {
      try {
        const parsed = parseYaml(readFileSync(join(pluginsDir, f), 'utf8'));
        if (parsed && parsed.slug === slug) {
          p = parsed;
          break;
        }
      } catch (e) {}
    }
  }

  if (!p) {
    console.error(`\x1b[31mError: Plugin with slug '${slug}' is not installed.\x1b[0m`);
    console.error(`  Run \x1b[36mplugin list\x1b[0m to see installed plugins, or validate a new plugin config using \x1b[36mplugin validate <path>\x1b[0m.`);
    process.exit(1);
  }

  console.log(`\n🔍 \x1b[36mPlugin Specifications: ${p.name} (v${p.version})\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mSlug:\x1b[0m        ${p.slug}`);
  console.log(`\x1b[33mAuthor:\x1b[0m      ${p.author}`);
  console.log(`\x1b[33mDescription:\x1b[0m ${p.description}`);
  if (p.safety_notes) {
    console.log(`\x1b[33mSafety Notes:\x1b[0m ${p.safety_notes}`);
  }
  
  if (p.allowed_file_patterns) {
    console.log('\n\x1b[33mAllowed Write Subdirectories:\x1b[0m');
    p.allowed_file_patterns.forEach(pat => console.log(`  - ${pat}`));
  }
  
  if (p.templates) {
    console.log('\n\x1b[33mCustom Templates:\x1b[0m');
    Object.keys(p.templates).forEach(k => {
      console.log(`  - \x1b[32m${k}\x1b[0m: ${p.templates[k].description || p.templates[k].name}`);
    });
  }

  if (p.workflows) {
    console.log('\n\x1b[33mCustom Workflows:\x1b[0m');
    Object.keys(p.workflows).forEach(k => {
      console.log(`  - \x1b[32m${k}\x1b[0m: ${p.workflows[k].description || p.workflows[k].name}`);
    });
  }

  if (p.adapters) {
    console.log('\n\x1b[33mCustom Adapters:\x1b[0m');
    Object.keys(p.adapters).forEach(k => {
      console.log(`  - \x1b[32m${k}\x1b[0m: ${p.adapters[k].targetFile}`);
    });
  }
  console.log('');
}

function handlePluginValidate(pluginPath, options) {
  const fullPath = resolve(process.cwd(), pluginPath);
  if (!existsSync(fullPath)) {
    console.error(`\x1b[31mError: Plugin file not found at: ${pluginPath}\x1b[0m`);
    process.exit(1);
  }
  
  console.log(`\n📋 \x1b[34mValidating Plugin: ${pluginPath}\x1b[0m`);
  console.log('==================================================');
  
  let errors = 0;
  let plugin = null;
  try {
    plugin = parseYaml(readFileSync(fullPath, 'utf8'));
  } catch (e) {
    console.error(`  \x1b[31m✗ [SYNTAX] Failed to parse YAML: ${e.message}\x1b[0m`);
    errors++;
  }

  if (plugin) {
    const reqKeys = ['name', 'slug', 'version', 'description', 'author'];
    reqKeys.forEach(k => {
      if (plugin[k] === undefined || plugin[k] === null) {
        console.error(`  \x1b[31m✗ [METADATA] Missing required key: ${k}\x1b[0m`);
        errors++;
      } else if (typeof plugin[k] !== 'string') {
        console.error(`  \x1b[31m✗ [METADATA] Key '${k}' must be a string (found: ${typeof plugin[k]})\x1b[0m`);
        errors++;
      } else if (k === 'slug') {
        if (!/^[a-z0-9-_]+$/i.test(plugin[k])) {
          console.error(`  \x1b[31m✗ [METADATA] Key 'slug' must be alphanumeric with dashes or underscores only (found: "${plugin[k]}")\x1b[0m`);
          errors++;
        } else {
          console.log(`  \x1b[32m✓ [METADATA] Key: slug ("${plugin[k]}")`);
        }
      } else {
        console.log(`  \x1b[32m✓ [METADATA] Key: ${k} ("${plugin[k]}")`);
      }
    });

    if (plugin.allowed_file_patterns !== undefined) {
      if (!Array.isArray(plugin.allowed_file_patterns)) {
        console.error(`  \x1b[31m✗ [SAFETY] allowed_file_patterns must be an array\x1b[0m`);
        errors++;
      } else {
        plugin.allowed_file_patterns.forEach(pat => {
          if (typeof pat !== 'string') {
            console.error(`  \x1b[31m✗ [SAFETY] allowed_file_patterns item must be a string: ${pat}\x1b[0m`);
            errors++;
            return;
          }
          const normPattern = pat.replace(/\\/g, '/').trim();
          const isSafeSubdir = [
            '.ai/plugins/',
            '.ai/registries/',
            '.ai/templates/',
            '.ai/skills/',
            '.ai/checks/',
            '.ai/prompts/',
            '.ai/adapters/'
          ].some(prefix => normPattern.startsWith(prefix));

          const hasTraversal = normPattern.includes('..') || normPattern.startsWith('/');
          const isBlacklisted = [
            '.env',
            '.npmrc',
            '.git/',
            'node_modules/',
            'package.json',
            'package-lock.json'
          ].some(black => normPattern.includes(black));

          if (!isSafeSubdir || hasTraversal || isBlacklisted) {
            console.error(`  \x1b[31m✗ [SAFETY] File pattern '${pat}' violates safety boundaries (must reside under .ai/ or adapters/, contain no '..', and exclude blacklisted files)\x1b[0m`);
            errors++;
          }
        });
        if (errors === 0) {
          console.log(`  \x1b[32m✓ [SAFETY] allowed_file_patterns verified: ${plugin.allowed_file_patterns.length} items`);
        }
      }
    }

    if (plugin.denied_file_patterns !== undefined) {
      if (!Array.isArray(plugin.denied_file_patterns)) {
        console.error(`  \x1b[31m✗ [SAFETY] denied_file_patterns must be an array\x1b[0m`);
        errors++;
      } else {
        plugin.denied_file_patterns.forEach(pat => {
          if (typeof pat !== 'string') {
            console.error(`  \x1b[31m✗ [SAFETY] denied_file_patterns item must be a string: ${pat}\x1b[0m`);
            errors++;
          }
        });
        console.log(`  \x1b[32m✓ [SAFETY] denied_file_patterns verified: ${plugin.denied_file_patterns.length} items`);
      }
    }

    if (plugin.workflows !== undefined) {
      if (typeof plugin.workflows !== 'object' || Array.isArray(plugin.workflows)) {
        console.error(`  \x1b[31m✗ [CAPABILITIES] workflows must be an object\x1b[0m`);
        errors++;
      } else {
        console.log(`  \x1b[32m✓ [CAPABILITIES] workflows verified`);
      }
    }

    if (plugin.templates !== undefined) {
      if (typeof plugin.templates !== 'object' || Array.isArray(plugin.templates)) {
        console.error(`  \x1b[31m✗ [CAPABILITIES] templates must be an object\x1b[0m`);
        errors++;
      } else {
        console.log(`  \x1b[32m✓ [CAPABILITIES] templates verified`);
      }
    }

    if (plugin.adapters !== undefined) {
      if (typeof plugin.adapters !== 'object' || Array.isArray(plugin.adapters)) {
        console.error(`  \x1b[31m✗ [CAPABILITIES] adapters must be an object\x1b[0m`);
        errors++;
      } else {
        console.log(`  \x1b[32m✓ [CAPABILITIES] adapters verified`);
      }
    }

    if (plugin.safety_notes !== undefined) {
      if (typeof plugin.safety_notes !== 'string') {
        console.error(`  \x1b[31m✗ [SAFETY] safety_notes must be a string\x1b[0m`);
        errors++;
      } else {
        console.log(`  \x1b[32m✓ [SAFETY] safety_notes verified`);
      }
    }
  }

  if (errors > 0) {
    console.error(`\n\x1b[31mPlugin validation FAILED with ${errors} errors.\x1b[0m\n`);
    if (options && options.noExit) return false;
    process.exit(1);
  } else {
    console.log(`\n\x1b[32m✔ Plugin '${plugin.slug || plugin.name}' is fully valid and compliant!\x1b[0m`);
    console.log(`\n\x1b[35mRecommended Next Command:\x1b[0m`);
    console.log(`    npx multimodel-dev-os plugin install ${pluginPath} --approved\n`);
    if (options && options.noExit) return true;
    return true;
  }
}

function handlePluginInstall(pluginPath, options) {
  const fullPath = resolve(process.cwd(), pluginPath);
  if (!existsSync(fullPath)) {
    console.error(`\x1b[31mError: Plugin file not found at: ${pluginPath}\x1b[0m`);
    process.exit(1);
  }

  const isValid = handlePluginValidate(pluginPath, { noExit: true });
  if (!isValid) {
    console.error(`\x1b[31mError: Plugin validation failed. Installation aborted.\x1b[0m`);
    process.exit(1);
  }

  const pluginContent = readFileSync(fullPath, 'utf8');
  const plugin = parseYaml(pluginContent);
  const slug = plugin.slug;
  const sourceDir = dirname(fullPath);

  console.log(`\n📥 \x1b[34mInstalling Plugin: ${plugin.name} [slug: ${slug}]\x1b[0m`);

  const filesToCopy = [];
  filesToCopy.push({
    src: fullPath,
    dest: join('.ai', 'plugins', `${slug}.yaml`),
    description: 'Plugin Manifest'
  });

  if (Array.isArray(plugin.allowed_file_patterns)) {
    plugin.allowed_file_patterns.forEach(pattern => {
      const normPattern = pattern.replace(/\\/g, '/').trim();
      
      const isSafeSubdir = [
        '.ai/plugins/',
        '.ai/registries/',
        '.ai/templates/',
        '.ai/skills/',
        '.ai/checks/',
        '.ai/prompts/',
        '.ai/adapters/'
      ].some(prefix => normPattern.startsWith(prefix));

      const hasTraversal = normPattern.includes('..') || normPattern.startsWith('/');
      const isBlacklisted = [
        '.env',
        '.npmrc',
        '.git/',
        'node_modules/',
        'package.json',
        'package-lock.json'
      ].some(black => normPattern.includes(black));

      if (!isSafeSubdir || hasTraversal || isBlacklisted) {
        console.error(`\x1b[31mError: Path pattern '${pattern}' violates safety boundaries. Installation aborted.\x1b[0m`);
        process.exit(1);
      }

      const srcFile = join(sourceDir, normPattern);
      if (existsSync(srcFile) && statSync(srcFile).isFile()) {
        filesToCopy.push({
          src: srcFile,
          dest: normPattern,
          description: `Plugin asset: ${normPattern}`
        });
      }
    });
  }

  let conflicts = false;
  filesToCopy.forEach(item => {
    const destPath = join(options.target, item.dest);
    if (existsSync(destPath)) {
      if (!options.force) {
        console.error(`  \x1b[31mConflict:\x1b[0m File already exists at destination: ${item.dest}`);
        conflicts = true;
      }
    }
  });

  if (conflicts) {
    console.error(`\n\x1b[31mInstallation aborted due to overwrite conflicts. Run with --force to overwrite (creates .bak backups).\x1b[0m\n`);
    process.exit(1);
  }

  if (!options.approved) {
    console.error(`\x1b[31mError: Plugin cannot be installed without explicit user approval. Pass the --approved flag.\x1b[0m`);
    console.log(`\n\x1b[33mPlanned Installation Actions:\x1b[0m`);
    filesToCopy.forEach(item => {
      const exists = existsSync(join(options.target, item.dest));
      const suffix = exists ? ' \x1b[33m(will overwrite)\x1b[0m' : '';
      console.log(`  - \x1b[36m[WOULD COPY]\x1b[0m ${item.src} -> ${item.dest}${suffix}`);
    });
    console.error(`\n\x1b[31mError: Installation refused. Run with --approved to apply these changes.\x1b[0m\n`);
    process.exit(1);
  }

  filesToCopy.forEach(item => {
    const destPath = join(options.target, item.dest);
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    if (existsSync(destPath)) {
      const bakPath = `${destPath}.bak`;
      writeFileSync(bakPath, readFileSync(destPath));
      console.log(`  \x1b[33mBACKUP:\x1b[0m Created backup: ${item.dest}.bak`);
    }

    writeFileSync(destPath, readFileSync(item.src));
    console.log(`  \x1b[32mCOPY:\x1b[0m ${item.dest}`);
  });

  console.log(`\n\x1b[32m✔ Plugin '${plugin.name}' installed successfully!\x1b[0m`);
  console.log(`\nSummary of actions:`);
  console.log(`  - Manifest registered: .ai/plugins/${slug}.yaml`);
  const assetCount = filesToCopy.length - 1;
  console.log(`  - Synced assets:       ${assetCount} file(s)`);
  
  console.log(`\n\x1b[35mRecommended Next Commands:\x1b[0m`);
  console.log(`    • View plugin details: npx multimodel-dev-os plugin show ${slug}`);
  console.log(`    • Audit plugin health:  npx multimodel-dev-os plugin status --target .`);
  if (plugin.workflows) {
    const wfKeys = Object.keys(plugin.workflows);
    if (wfKeys.length > 0) {
      console.log(`    • Run custom workflow:  npx multimodel-dev-os workflow run ${wfKeys[0]}`);
    }
  }
  console.log('');
}

function handlePluginStatus(options) {
  const pluginsDir = getPluginsDir(options.target);
  console.log(`\n🔌 \x1b[36mAuditing Plugins Status in: ${options.target}\x1b[0m`);
  console.log('==================================================');

  if (!existsSync(pluginsDir)) {
    console.log('  No plugins directory found. 0 plugins installed.\n');
    return;
  }

  let files = [];
  try {
    files = readdirSync(pluginsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  } catch (e) {}

  if (files.length === 0) {
    console.log('  No plugins installed.\n');
    return;
  }

  files.forEach(f => {
    try {
      const pPath = join(pluginsDir, f);
      const p = parseYaml(readFileSync(pPath, 'utf8'));
      if (p && p.name) {
        console.log(`\n* \x1b[32m${p.name}\x1b[0m (v${p.version || '1.0.0'})`);
        let missingCount = 0;
        let presentCount = 0;

        if (Array.isArray(p.allowed_file_patterns)) {
          p.allowed_file_patterns.forEach(pat => {
            const destPath = join(options.target, pat);
            if (existsSync(destPath) && statSync(destPath).isFile()) {
              presentCount++;
            } else {
              missingCount++;
            }
          });
        }

        const total = presentCount + missingCount;
        if (total === 0) {
          console.log(`  Status: \x1b[32mHealthy\x1b[0m (Declarative only)`);
        } else if (missingCount === 0) {
          console.log(`  Status: \x1b[32mHealthy\x1b[0m (All ${presentCount}/${total} assets present)`);
        } else {
          console.log(`  Status: \x1b[33mIncomplete\x1b[0m (${presentCount}/${total} assets present, ${missingCount} missing)`);
          console.log(`  Missing Assets:`);
          p.allowed_file_patterns.forEach(pat => {
            const destPath = join(options.target, pat);
            if (!existsSync(destPath) || !statSync(destPath).isFile()) {
              console.log(`    \x1b[31m✗\x1b[0m ${pat}`);
            }
          });
          console.log(`  To fix: Reinstall the plugin or validate the configuration:`);
          console.log(`    npx multimodel-dev-os plugin validate <path-to-plugin-source.yaml>`);
        }
      }
    } catch (e) {
      console.log(`  - \x1b[31mError reading: ${f}\x1b[0m (${e.message})`);
    }
  });
  console.log('');
}

// --- Phase 8: Workflow Marketplace / Plugin Catalog ---

function loadCatalog() {
  const path = join(sourceRoot, '.ai', 'plugins', 'catalog.yaml');
  try {
    if (existsSync(path)) {
      const reg = parseYaml(readFileSync(path, 'utf8'));
      return reg.catalog || { plugins: [] };
    }
  } catch (e) {}
  return { plugins: [] };
}

function handleCatalogList(options) {
  const catalog = loadCatalog();
  const plugins = catalog.plugins || [];
  
  const filtered = options.category
    ? plugins.filter(p => p.category.toLowerCase() === options.category.toLowerCase())
    : plugins;

  if (options.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }

  console.log(`\n📚 \x1b[36mWorkflow Marketplace & Plugin Catalog [v${version}]\x1b[0m`);
  console.log('==================================================');
  if (options.category) {
    console.log(`Filtering by category: \x1b[33m${options.category}\x1b[0m`);
  }
  
  const installedSlugs = new Set();
  const pluginsDir = getPluginsDir(options.target);
  if (existsSync(pluginsDir)) {
    try {
      const files = readdirSync(pluginsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      files.forEach(f => {
        try {
          const parsed = parseYaml(readFileSync(join(pluginsDir, f), 'utf8'));
          if (parsed && parsed.slug) {
            installedSlugs.add(parsed.slug);
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  filtered.forEach(p => {
    const isInst = installedSlugs.has(p.slug) ? ' \x1b[90m(Installed)\x1b[0m' : '';
    console.log(`\n\x1b[32m* ${p.name}\x1b[0m (v${p.version})${isInst} [slug: \x1b[33m${p.slug}\x1b[0m]`);
    console.log(`  Category:    ${p.category}`);
    console.log(`  Description: ${p.description}`);
    console.log(`  Safety Tiers: ${p.safety_level || 'sandboxed'}`);
  });

  console.log('\nUse \x1b[36mcatalog show <slug>\x1b[0m to inspect capabilities and installation manifest preview.');
  console.log('Use \x1b[36mcatalog install <slug> --approved\x1b[0m to install a plugin.\n');
}

function handleCatalogSearch(query, options) {
  const catalog = loadCatalog();
  const plugins = catalog.plugins || [];
  const lcQuery = query.toLowerCase();

  const matches = plugins.filter(p => {
    return p.slug.toLowerCase().includes(lcQuery) ||
      p.name.toLowerCase().includes(lcQuery) ||
      p.description.toLowerCase().includes(lcQuery) ||
      p.category.toLowerCase().includes(lcQuery) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(lcQuery)));
  });

  if (options.json) {
    console.log(JSON.stringify(matches, null, 2));
    return;
  }

  console.log(`\n🔍 \x1b[36mSearch Catalog Results for query: "${query}" (${matches.length} matches)\x1b[0m`);
  console.log('==================================================');

  if (matches.length === 0) {
    console.log('  No matching plugins found.');
  } else {
    matches.forEach(p => {
      console.log(`\n\x1b[32m* ${p.name}\x1b[0m (v${p.version}) [slug: \x1b[33m${p.slug}\x1b[0m]`);
      console.log(`  Category:    ${p.category}`);
      console.log(`  Description: ${p.description}`);
    });
  }
  console.log('');
}

function handleCatalogShow(slug, options) {
  const catalog = loadCatalog();
  const plugins = catalog.plugins || [];
  const p = plugins.find(item => item.slug === slug);

  if (!p) {
    console.error(`\x1b[31mError: Plugin with slug '${slug}' not found in catalog.\x1b[0m`);
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify(p, null, 2));
    return;
  }

  console.log(`\n🔍 \x1b[36mCatalog Plugin: ${p.name} (v${p.version})\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mSlug:\x1b[0m        ${p.slug}`);
  console.log(`\x1b[33mCategory:\x1b[0m    ${p.category}`);
  console.log(`\x1b[33mDescription:\x1b[0m ${p.description}`);
  console.log(`\x1b[33mRecommended:\x1b[0m ${p.recommended_for}`);
  console.log(`\x1b[33mSafety Level:\x1b[0m ${p.safety_level}`);
  console.log(`\x1b[33mScope:\x1b[0m        ${p.install_scope}`);

  if (p.use_cases) {
    console.log('\n\x1b[33mUse Cases:\x1b[0m');
    p.use_cases.forEach(uc => console.log(`  - ${uc}`));
  }

  if (p.provided_workflows) {
    console.log('\n\x1b[33mProvided Workflows:\x1b[0m');
    p.provided_workflows.forEach(w => console.log(`  - \x1b[32m${w}\x1b[0m`));
  }

  if (p.files_preview) {
    console.log('\n\x1b[33mPlanned Write Files:\x1b[0m');
    p.files_preview.forEach(f => console.log(`  - \x1b[36m${f.dest}\x1b[0m`));
  }

  console.log(`\nTo install this plugin, run:`);
  console.log(`  \x1b[36mnpx multimodel-dev-os catalog install ${p.slug} --approved\x1b[0m\n`);
}

function handleCatalogCategories(options) {
  const catalog = loadCatalog();
  const plugins = catalog.plugins || [];
  const categories = Array.from(new Set(plugins.map(p => p.category))).sort();

  if (options.json) {
    console.log(JSON.stringify(categories, null, 2));
    return;
  }

  console.log(`\n📚 \x1b[36mMarketplace Categories (${categories.length})\x1b[0m`);
  console.log('==================================================');
  categories.forEach(c => console.log(`  - ${c}`));
  console.log('\nUse \x1b[36mcatalog list --category <category>\x1b[0m to list plugins in a category.\n');
}

function handleCatalogInstall(slug, options) {
  const catalog = loadCatalog();
  const plugins = catalog.plugins || [];
  const p = plugins.find(item => item.slug === slug);

  if (!p) {
    console.error(`\x1b[31mError: Plugin with slug '${slug}' not found in catalog.\x1b[0m`);
    process.exit(1);
  }

  const srcPath = join(sourceRoot, '.ai', 'plugins', 'catalog', `${slug}.yaml`);
  if (!existsSync(srcPath)) {
    console.error(`\x1b[31mError: Packed plugin manifest not found at: ${srcPath}\x1b[0m`);
    process.exit(1);
  }

  handlePluginInstall(srcPath, options);
}

function handleCatalogStatus(options) {
  const catalog = loadCatalog();
  const plugins = catalog.plugins || [];
  const pluginsDir = getPluginsDir(options.target);

  console.log(`\n📊 \x1b[36mAuditing Catalog Plugins in: ${options.target}\x1b[0m`);
  console.log('==================================================');

  if (plugins.length === 0) {
    console.log('  No catalog entries found.');
    return;
  }

  plugins.forEach(p => {
    const slug = p.slug;
    const destManifest = join(pluginsDir, `${slug}.yaml`);
    if (!existsSync(destManifest)) {
      console.log(`  - \x1b[33m${p.name}\x1b[0m (v${p.version}): \x1b[90mNot installed\x1b[0m`);
      console.log(`    Install via: \x1b[36mnpx multimodel-dev-os catalog install ${slug} --approved\x1b[0m`);
    } else {
      let missingCount = 0;
      let presentCount = 0;

      try {
        const targetP = parseYaml(readFileSync(destManifest, 'utf8'));
        if (Array.isArray(targetP.allowed_file_patterns)) {
          targetP.allowed_file_patterns.forEach(pat => {
            const destPath = join(options.target, pat);
            if (existsSync(destPath) && statSync(destPath).isFile()) {
              presentCount++;
            } else {
              missingCount++;
            }
          });
        }

        const total = presentCount + missingCount;
        if (total === 0 || missingCount === 0) {
          console.log(`  - \x1b[32m${p.name}\x1b[0m (v${p.version}): \x1b[32mInstalled (Healthy)\x1b[0m`);
        } else {
          console.log(`  - \x1b[33m${p.name}\x1b[0m (v${p.version}): \x1b[33mInstalled (Incomplete)\x1b[0m (${presentCount}/${total} files present)`);
        }
      } catch (e) {
        console.log(`  - \x1b[31m${p.name}\x1b[0m (v${p.version}): \x1b[31mInstalled (Read error: ${e.message})\x1b[0m`);
      }
    }
  });
  console.log('');
}

function handleCatalogRecommend(options) {
  const analysis = getAnalysis(options.target);
  const catalog = loadCatalog();
  const plugins = catalog.plugins || [];
  
  const recs = [];

  plugins.forEach(p => {
    let conf = 0.5;
    let reason = 'General codebase utility';
    const signals = [];

    if (p.slug === 'git-workflows') {
      conf = 0.8;
      signals.push('Generic repository template matched');
      if (analysis.githubWorkflows && analysis.githubWorkflows.length > 0) {
        conf = 0.95;
        signals.push('Existing GitHub Actions workflows detected');
        reason = 'Enforces git pre-push and pre-commit checks locally before executing remote pipeline checks.';
      } else {
        reason = 'Standard git repository quality and branch cleanliness checks.';
      }
    } else if (p.slug === 'nextjs-workflows') {
      if (analysis.frameworks && analysis.frameworks.some(f => f.toLowerCase().includes('next'))) {
        conf = 0.95;
        signals.push('Next.js framework framework signals detected');
        reason = 'Integrates routing checking and server actions verification rules for App Router.';
      } else if (analysis.packageScripts && analysis.packageScripts.some(s => s.includes('next'))) {
        conf = 0.9;
        signals.push('Next package scripts detected in package.json');
        reason = 'Configures Next.js specific builder guidelines.';
      } else {
        conf = 0.1;
      }
    } else if (p.slug === 'wordpress-workflows') {
      if (analysis.repoType === 'WordPress theme/plugin') {
        conf = 0.95;
        signals.push('WordPress folder layout and php structures identified');
        reason = 'Ensures WordPress coding standards and security hooks validations are applied.';
      } else if (analysis.language === 'PHP') {
        conf = 0.6;
        signals.push('PHP dominant language detected');
        reason = 'Provides standard boilerplate checkups for PHP sites.';
      } else {
        conf = 0.1;
      }
    } else if (p.slug === 'ecommerce-workflows') {
      const isShop = analysis.frameworks && analysis.frameworks.some(f => f.toLowerCase().includes('shopify'));
      const isShopScript = analysis.packageScripts && analysis.packageScripts.some(s => s.includes('stripe') || s.includes('shop'));
      if (isShop || isShopScript) {
        conf = 0.9;
        signals.push('E-commerce keywords or framework scripts detected');
        reason = 'Validates payment gateway routes and Stripe webhook security signatures.';
      } else {
        let hasKeywords = false;
        try {
          const files = readdirSync(options.target);
          hasKeywords = files.some(f => f.includes('stripe') || f.includes('checkout') || f.includes('payment') || f.includes('cart'));
        } catch (e) {}
        if (hasKeywords) {
          conf = 0.85;
          signals.push('E-commerce transaction filenames detected');
          reason = 'Secures checkout endpoints and verifies webhook signature validations.';
        } else {
          conf = 0.4;
        }
      }
    } else if (p.slug === 'seo-workflows') {
      if (analysis.repoType === 'docs') {
        conf = 0.8;
        signals.push('Documentation heavy layout detected');
        reason = 'Audits sitemaps and page heading hierarchies for documentation search optimization.';
      } else if (analysis.language === 'Markdown-heavy') {
        conf = 0.75;
        signals.push('Markdown-heavy content layout detected');
        reason = 'Enforces metadata validations.';
      } else {
        conf = 0.6;
        signals.push('Frontend presentation site signals detected');
        reason = 'Validates HTML page hierarchy and meta tag checklist rules.';
      }
    } else if (p.slug === 'release-workflows') {
      if (analysis.repoType === 'library') {
        conf = 0.9;
        signals.push('Library/Module repository distribution pattern detected');
        reason = 'Verifies package hygiene, versions alignment, and npm pre-flight checks.';
      } else if (analysis.packageScripts && analysis.packageScripts.some(s => s.includes('release') || s.includes('publish') || s.includes('build'))) {
        conf = 0.8;
        signals.push('Release/Build commands registered in package.json');
        reason = 'Maintains release prep checklists and doctor verifications.';
      } else {
        conf = 0.5;
      }
    }

    if (conf >= 0.5) {
      recs.push({
        plugin: p,
        confidence: conf,
        signals,
        reason
      });
    }
  });

  recs.sort((a, b) => b.confidence - a.confidence);

  if (options.json) {
    console.log(JSON.stringify(recs, null, 2));
    return;
  }

  console.log(`\n💡 \x1b[36mMarketplace Recommendations for: ${options.target}\x1b[0m`);
  console.log('==================================================');
  if (recs.length === 0) {
    console.log('  No matching recommendations found.');
  } else {
    recs.forEach(r => {
      console.log(`\n* \x1b[32m${r.plugin.name}\x1b[0m (Confidence: \x1b[33m${(r.confidence * 100).toFixed(0)}%\x1b[0m)`);
      console.log(`  Signals:     ${r.signals.join(', ')}`);
      console.log(`  Reason:      ${r.reason}`);
      console.log(`  Install:     npx multimodel-dev-os catalog install ${r.plugin.slug} --approved`);
    });
  }
  console.log('');
}


