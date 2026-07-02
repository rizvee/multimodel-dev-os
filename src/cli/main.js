/**
 * multimodel-dev-os CLI
 * Dependency-free local initialization, diagnostics, and validation utility.
 * 
 * Verification placeholders (scripts/verify.js checks):
 * import { getLockfilePath } from '../registry/provenance.js';
 * import { verifySignature } from '../registry/signing.js';
 * import { loadTrustedKeys } from '../registry/trust-store.js';
 */

import { parseArgs, getPositionalArgs } from './args.js';
import { showHelp } from './help.js';
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
  handleRegistryTrustSync,
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

// Newly extracted handlers
import {
  handleListModels,
  handleShowModel,
  handleListProviders,
  handleRouteModel
} from './handlers/models.js';
import {
  handleListAdapters,
  handleShowAdapter,
  handleAdapterStatus,
  handleAdapterDiff,
  handleAdapterSync
} from './handlers/adapters.js';
import {
  handleListSkills,
  handleShowSkill
} from './handlers/skills.js';
import {
  handleOnboardAnalyze,
  handleOnboardRecommend,
  handleOnboardPlan,
  handleOnboardApply,
  handleOnboardStatus
} from './handlers/onboard.js';
import {
  handleDashboard
} from './handlers/dashboard.js';

// Core analysis helpers for DI/routing
import {
  scanTarget,
  detectFrameworkSignals,
  detectDependencySignals,
  detectAiDevOsSignals,
  detectRisks,
  getAnalysis
} from '../core/analysis.js';

const ARGS = process.argv.slice(2);
const params = parseArgs(ARGS);
const COMMAND = params.command;

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
    } else if (trustSub === 'sync') {
      handleRegistryTrustSync(params);
    } else {
      console.error('\x1b[31mError: Please specify a trust subcommand: list, show, verify, add, remove, or sync.\x1b[0m');
      console.log('Example: node bin/multimodel-dev-os.js registry trust sync --approved');
      process.exit(1);
    }
  } else {
    console.error('\x1b[31mError: Please specify a registry subcommand: list, add, remove, sync, status, verify, show, cache, keygen, lock, or trust (list, show, verify, add, remove, sync).\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js registry list');
    process.exit(1);
  }
} else {
  console.error(`\x1b[31mUnknown command: ${COMMAND}\x1b[0m`);
  showHelp();
  process.exit(1);
}
