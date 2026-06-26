

/**
 * multimodel-dev-os CLI
 * Dependency-free local initialization, diagnostics, and validation utility.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative, isAbsolute, basename } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import readline from 'readline';
import { execSync, execFileSync } from 'child_process';

import { parseArgs, getPositionalArgs } from './args.js';
import { showHelp } from './help.js';
import { parseYaml, parseFlowArray } from '../core/yaml.js';
import { computeSHA256, hashFile } from '../core/hashes.js';
import { loadRegistryPolicy } from '../core/policy.js';
import { shouldIgnorePath, isSafePath } from '../core/security.js';
import { validateRegistryUrl } from '../registry/validation.js';
import { loadRegistrySources, saveRegistrySources } from '../registry/sources.js';
import { loadRegistryLockfile, saveRegistryLockfile, updateLockfileEntry, getLockfilePath } from '../registry/provenance.js';
import {
  loadSigningKey,
  generateSigningKey,
  saveSigningKey,
  signPayload,
  verifySignature,
  getSigningKeyPath,
  verifySignatureBlock,
  createCanonicalPayload,
  normalizePublicKey
} from '../registry/signing.js';
import { loadTrustedKeys, addTrustedKey, removeTrustedKey, fetchRemotePublicKey, getTrustStorePath } from '../registry/trust-store.js';
import { createTrustVerdict } from '../registry/verdict.js';
import { sourceRoot, version, loadAdapters } from '../core/globals.js';
import {
  handleRegistryList,
  handleRegistryAdd,
  handleRegistryRemove,
  handleRegistrySync,
  handleRegistryStatus,
  handleRegistryVerify,
  handleRegistryTrustList,
  handleRegistryTrustShow,
  handleRegistryTrustVerify,
  handleRegistryTrustAdd,
  handleRegistryTrustRemove,
  handleRegistryShow,
  handleRegistryCacheClear,
  handleRegistryKeygen,
  handleRegistryLock
} from './handlers/registry.js';
import {
  handlePluginList,
  handlePluginShow,
  handlePluginValidate,
  handlePluginInstall,
  handlePluginStatus
} from './handlers/plugin.js';
import {
  handleCatalogList,
  handleCatalogSearch,
  handleCatalogShow,
  handleCatalogCategories,
  handleCatalogRecommend,
  handleCatalogInstall,
  handleCatalogStatus
} from './handlers/catalog.js';
import { handleInit } from './handlers/init.js';
import { handleListTemplates, handleShowTemplate } from './handlers/templates.js';
import {
  handleVerify,
  handleDoctor,
  handleValidate,
  handleValidateTemplate,
  handleValidateAdapter,
  handleValidateSkill,
  handleScan,
  handleStatus
} from './handlers/inspection.js';
import {
  diffMemory,
  handleMemoryBuild,
  handleMemoryRefresh,
  handleMemoryDiff
} from './handlers/memory.js';
import {
  handleFeedbackAdd,
  handleFeedbackList,
  handleFeedbackSummarize
} from './handlers/feedback.js';
import {
  handleHandoffBuild,
  handleHandoffShow
} from './handlers/handoff.js';
import {
  handleWorkflowList,
  handleWorkflowShow,
  handleWorkflowPlan,
  handleWorkflowRun
} from './handlers/workflow.js';
import {
  handleImprovePropose,
  handleImproveReview,
  handleImproveStatus,
  handleImproveValidate,
  handleImproveDiff,
  handleImproveApply,
  handleImproveLog
} from './handlers/improve.js';

const ARGS = process.argv.slice(2);
const params = parseArgs(ARGS);
const COMMAND = params.command;

const ADAPTERS = loadAdapters(params.registry);

const boundDiffMemory = (target) => diffMemory(target, {
  scanTarget,
  detectFrameworkSignals,
  detectDependencySignals,
  detectAiDevOsSignals,
  detectRisks
});

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
  handleScan(params, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks });
} else if (COMMAND === 'memory') {
  const sub = ARGS[1];
  const injects = { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks };
  if (sub === 'build') {
    handleMemoryBuild(params, injects);
  } else if (sub === 'refresh') {
    handleMemoryRefresh(params, injects);
  } else if (sub === 'diff') {
    handleMemoryDiff(params, injects);
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
  handleShowTemplate(tName, params);
} else if (COMMAND === 'doctor') {
  handleDoctor(params, { scanTarget, detectDependencySignals, getAnalysis, diffMemory: boundDiffMemory });
} else if (COMMAND === 'validate') {
  handleValidate(params);
} else if (COMMAND === 'validate-template') {
  const tName = ARGS[1];
  if (!tName || tName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a template name. Example: node bin/multimodel-dev-os.js validate-template nextjs-saas\x1b[0m');
    process.exit(1);
  }
  handleValidateTemplate(tName, params);
} else if (COMMAND === 'validate-adapter') {
  const aName = ARGS[1];
  if (!aName || aName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify an adapter name. Example: node bin/multimodel-dev-os.js validate-adapter cursor\x1b[0m');
    process.exit(1);
  }
  handleValidateAdapter(aName, params);
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
  handleStatus(params, { scanTarget, detectFrameworkSignals, detectDependencySignals, diffMemory: boundDiffMemory });
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
    handleWorkflowRun(wName, params, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks, getAnalysis, boundDiffMemory });
  } else {
    console.error('\x1b[31mError: Please specify a workflow subcommand: list, show, plan, or run.\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js workflow list');
    process.exit(1);
  }
} else if (COMMAND === 'handoff') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  const injects = { scanTarget, detectFrameworkSignals, detectDependencySignals, diffMemory: boundDiffMemory };
  if (sub === 'build') {
    handleHandoffBuild(params, injects);
  } else if (sub === 'show') {
    handleHandoffShow(params, injects);
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
    handleCatalogRecommend(params, { getAnalysis });
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
} else if (COMMAND === 'registry') {
  const positional = getPositionalArgs(ARGS);
  const sub = positional[1];
  if (sub === 'list') {
    handleRegistryList(params);
  } else if (sub === 'add') {
    const rName = positional[2];
    const rUrl = positional[3];
    if (!rName || !rUrl) {
      console.error('\x1b[31mError: Please specify a registry name and URL.\x1b[0m');
      console.log('Example: node bin/multimodel-dev-os.js registry add official https://example.com/catalog.yaml --approved');
      process.exit(1);
    }
    handleRegistryAdd(rName, rUrl, params);
  } else if (sub === 'remove') {
    const rName = positional[2];
    if (!rName) {
      console.error('\x1b[31mError: Please specify a registry name to remove.\x1b[0m');
      process.exit(1);
    }
    handleRegistryRemove(rName, params);
  } else if (sub === 'sync') {
    const rName = positional[2];
    if (!rName) {
      console.error('\x1b[31mError: Please specify a registry name to sync.\x1b[0m');
      process.exit(1);
    }
    handleRegistrySync(rName, params);
  } else if (sub === 'status') {
    handleRegistryStatus(params);
  } else if (sub === 'verify') {
    const rName = positional[2] || 'bundled';
    handleRegistryVerify(rName, params);
  } else if (sub === 'show') {
    const rName = positional[2];
    if (!rName) {
      console.error('\x1b[31mError: Please specify a registry name to show.\x1b[0m');
      process.exit(1);
    }
    handleRegistryShow(rName, params);
  } else if (sub === 'cache') {
    const cacheSub = positional[2];
    if (cacheSub === 'clear') {
      handleRegistryCacheClear(params);
    } else {
      console.error('\x1b[31mError: Please specify a cache subcommand: clear.\x1b[0m');
      process.exit(1);
    }
  } else if (sub === 'keygen') {
    handleRegistryKeygen(params);
  } else if (sub === 'lock') {
    handleRegistryLock(params);
  } else if (sub === 'trust') {
    const trustSub = positional[2];
    if (trustSub === 'list') {
      handleRegistryTrustList(params);
    } else if (trustSub === 'show') {
      const keyId = positional[3];
      if (!keyId) {
        console.error('\x1b[31mError: Please specify a key ID.\x1b[0m');
        process.exit(1);
      }
      handleRegistryTrustShow(keyId, params);
    } else if (trustSub === 'verify') {
      handleRegistryTrustVerify(params);
    } else if (trustSub === 'add') {
      handleRegistryTrustAdd(positional, params);
    } else if (trustSub === 'remove') {
      const keyId = positional[3];
      if (!keyId) {
        console.error('\x1b[31mError: Please specify a key ID to remove.\x1b[0m');
        console.log('Example: node bin/multimodel-dev-os.js registry trust remove my-key-id --approved');
        process.exit(1);
      }
      handleRegistryTrustRemove(keyId, params);
    } else {
      console.error('\x1b[31mError: Please specify a trust subcommand: list, show, verify, add, or remove.\x1b[0m');
      console.log('Example: node bin/multimodel-dev-os.js registry trust list');
      process.exit(1);
    }
  } else {
    console.error('\x1b[31mError: Please specify a registry subcommand: list, add, remove, sync, status, verify, show, cache, keygen, lock, or trust (list, show, verify, add, remove).\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js registry list');
    process.exit(1);
  }
} else {
  console.error(`\x1b[31mUnknown command: ${COMMAND}\x1b[0m`);
  showHelp();
  process.exit(1);
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
  console.log(`\nðŸ¤– \x1b[36mModel Registry [v${version}]\x1b[0m`);
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
  console.log(`\nðŸ” \x1b[36mModel: ${name}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mProvider:\x1b[0m ${m.provider}`);
  console.log(`\x1b[33mAlias:\x1b[0m ${m.alias}`);
  console.log(`\x1b[33mOfficial ID:\x1b[0m ${m.official_id}`);
  console.log(`\x1b[33mContext Window:\x1b[0m ${m.context_window} tokens`);
  console.log(`\x1b[33mCapabilities:\x1b[0m`);
  console.log(`  â”œâ”€ Vision: ${m.capabilities?.vision ? 'Yes' : 'No'}`);
  console.log(`  â””â”€ Tool Use: ${m.capabilities?.tool_use ? 'Yes' : 'No'}`);
  console.log(`\x1b[33mTiers:\x1b[0m`);
  console.log(`  â”œâ”€ Cost: ${m.tiers?.cost}`);
  console.log(`  â”œâ”€ Speed: ${m.tiers?.speed}`);
  console.log(`  â”œâ”€ Reasoning: ${m.tiers?.reasoning}`);
  console.log(`  â””â”€ Coding: ${m.tiers?.coding}`);
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
  console.log(`\nðŸ”Œ \x1b[36mAI Providers [v${version}]\x1b[0m`);
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
  console.log(`\nðŸŽ¯ \x1b[36mRouting Suggestion for: ${task}\x1b[0m`);
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
  console.log(`\nðŸ”Œ \x1b[36mIDE & Agent Adapters [v${version}]\x1b[0m`);
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
  console.log(`\nðŸ” \x1b[36mAdapter: ${a.name || name}\x1b[0m`);
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
  console.log(`\nðŸ§  \x1b[36mAvailable Skills in Target [v${version}]\x1b[0m`);
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
  console.log(`\nðŸ“– \x1b[36mSkill Prompt: ${name}\x1b[0m`);
  console.log('==================================================');
  console.log(readFileSync(skillFile, 'utf8'));
  console.log();
}


// ==========================================
// --- v2.2.0 Intelligence Layer Helpers & Handlers ---
// ==========================================



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
  console.log(`\nðŸ” \x1b[36mAnalyzing Workspace for Onboarding: ${options.target}\x1b[0m`);
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
    analysis.envRiskMarkers.forEach(m => console.log(`    â””â”€> ${m} (potential secrets exposure risk)`));
  }
  console.log();
}

function handleOnboardRecommend(options) {
  const analysis = getAnalysis(options.target);
  const rec = getRecommendation(analysis);

  console.log(`\nðŸ’¡ \x1b[36mOnboarding Recommendation for: ${options.target}\x1b[0m`);
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
  console.log(`\nðŸ“‹ \x1b[36mGenerating Onboarding Plan: ${options.target}\x1b[0m`);
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

  console.log(`\nðŸš€ \x1b[36mApplying Onboarding Scaffolding: ${options.target}\x1b[0m`);
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

  console.log(`\nâœ” Onboarding apply complete! Created: ${createdCount}, Skipped: ${skippedCount}, Overwritten (with backup): ${updatedCount}\n`);
}

function handleOnboardStatus(options) {
  console.log(`\nðŸ“Š \x1b[36mOnboarding Status Dashboard: ${options.target}\x1b[0m`);
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
    console.log(`  [${exists ? 'âœ”' : ' '}] ${f}`);
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
  console.log(`\nðŸ”Œ \x1b[36mIDE & Agent Adapters Status: ${options.target}\x1b[0m`);
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

  console.log(`\nðŸ”„ \x1b[36mSynchronizing IDE Adapters in: ${options.target}\x1b[0m`);
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


// --- Phase 3 & 4 & 5 & 6: TUI Dashboard & Plugin Hooks System ---

function selectMenu(title, items, callback) {
  let cursor = 0;
  
  const draw = () => {
    console.clear();
    console.log(`\nðŸ§  \x1b[36m${title}\x1b[0m`);
    console.log('==================================================');
    items.forEach((item, index) => {
      if (index === cursor) {
        console.log(`  \x1b[32mâ¯ ${item.name}\x1b[0m`);
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
    { name: 'Registry Sources & Cache...', action: 'submenu', menu: 'registry' },
    { name: 'Quality Gates & Diagnostics...', action: 'submenu', menu: 'quality' },
    { name: 'Plugins Status Overview', action: 'command', command: 'plugin status' },
    { name: 'Exit Command Center', action: 'exit' }
  ];

  const submenus = {
    onboard: [
      { name: 'â† Back to Main Menu', action: 'back' },
      { name: 'Onboard: Analyze Repository', action: 'command', command: 'onboard analyze' },
      { name: 'Onboard: Recommendation Summary', action: 'command', command: 'onboard recommend' },
      { name: 'Onboard: Generate Integration Plan', action: 'command', command: 'onboard plan' },
      { name: 'Onboard: Apply Configs (Dry Run)', action: 'command', command: 'onboard apply --dry-run' },
      { name: 'Onboard: View Status Heuristics', action: 'command', command: 'onboard status' }
    ],
    adapter: [
      { name: 'â† Back to Main Menu', action: 'back' },
      { name: 'Adapters: Check Sync Status', action: 'command', command: 'adapter status' },
      { name: 'Adapters: Sync All rule files (Dry Run)', action: 'command', command: 'adapter sync all --dry-run' },
      { name: 'Adapters: Diff Cursor rules', action: 'command', command: 'adapter diff cursor' },
      { name: 'Adapters: Diff Claude rules', action: 'command', command: 'adapter diff claude' }
    ],
    memory: [
      { name: 'â† Back to Main Menu', action: 'back' },
      { name: 'Memory: Build index', action: 'command', command: 'memory build' },
      { name: 'Memory: Refresh changes', action: 'command', command: 'memory refresh' },
      { name: 'Memory: Diff index status', action: 'command', command: 'memory diff' },
      { name: 'Handoff: Build session summary', action: 'command', command: 'handoff build' },
      { name: 'Handoff: Print summary to terminal', action: 'command', command: 'handoff show' }
    ],
    feedback: [
      { name: 'â† Back to Main Menu', action: 'back' },
      { name: 'Feedback: List developer corrections', action: 'command', command: 'feedback list' },
      { name: 'Feedback: Summarize to learning rules', action: 'command', command: 'feedback summarize' },
      { name: 'Proposals: Propose improvement proposal', action: 'command', command: 'improve propose' },
      { name: 'Proposals: Review active proposals list', action: 'command', command: 'improve review' }
    ],
    catalog: [
      { name: 'â† Back to Main Menu', action: 'back' },
      { name: 'Catalog: List bundled plugins', action: 'command', command: 'catalog list' },
      { name: 'Catalog: Recommend for current repo', action: 'command', command: 'catalog recommend' },
      { name: 'Catalog: Show installed catalog status', action: 'command', command: 'catalog status' }
    ],
    quality: [
      { name: 'â† Back to Main Menu', action: 'back' },
      { name: 'Doctor: Run Advisory Diagnostics', action: 'command', command: 'doctor' },
      { name: 'Validate: Strict Schema Compliance', action: 'command', command: 'validate' },
      { name: 'Verify: Run Release verification tests', action: 'command', command: 'verify' }
    ],
    registry: [
      { name: 'â† Back to Main Menu', action: 'back' },
      { name: 'Registry: List configured sources', action: 'command', command: 'registry list' },
      { name: 'Registry: Show sync status', action: 'command', command: 'registry status' },
      { name: 'Registry: Verify cache integrity', action: 'command', command: 'registry verify bundled' },
      { name: 'Registry: Show policy status', action: 'command', command: 'registry status' }
    ]
  };

  if (!process.stdout.isTTY || !process.stdin.isTTY || options.dryRun || options.listActions) {
    console.log(`\nðŸ“Š \x1b[36mMultiModel Dev OS Command Center (Headless/CI Preview)\x1b[0m`);
    console.log(`Target Workspace: \x1b[32m${options.target}\x1b[0m`);
    console.log('==================================================');
    
    const targetFlag = options.target === process.cwd() ? '' : ` --target "${options.target}"`;

    mainMenu.forEach(item => {
      if (item.action === 'command') {
        console.log(`  \x1b[33mâ€¢\x1b[0m ${item.name.padEnd(30)} â†’ \x1b[36mnpx multimodel-dev-os ${item.command}${targetFlag}\x1b[0m`);
      } else if (item.action === 'submenu') {
        console.log(`\n  \x1b[35m[${item.name.replace('...', '')}]\x1b[0m`);
        submenus[item.menu].forEach(sub => {
          if (sub.action === 'command') {
            console.log(`    â””â”€ ${sub.name.padEnd(35)} â†’ \x1b[36mnpx multimodel-dev-os ${sub.command}${targetFlag}\x1b[0m`);
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

