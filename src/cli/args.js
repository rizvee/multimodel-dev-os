import { resolve } from 'path';

export function parseArgs(args) {
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
    category: null,
    source: null,
    allSources: false
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
    } else if (arg === '--source') {
      params.source = args[++i];
    } else if (arg === '--all-sources') {
      params.allSources = true;
    } else if (!params.command && !arg.startsWith('-')) {
      params.command = arg;
    }
  }
  return params;
}

export function getPositionalArgs(args) {
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
