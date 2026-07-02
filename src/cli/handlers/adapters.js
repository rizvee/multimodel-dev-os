import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { sourceRoot, version, loadAdapters } from '../../core/globals.js';
import { parseYaml } from '../../core/yaml.js';

/**
 * List all available adapters in the registry.
 * @param {object} options
 */
export function handleListAdapters(options) {
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

/**
 * Show details for a specific adapter.
 * @param {string} name
 */
export function handleShowAdapter(name) {
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

/**
 * Get enabled adapters map from workspace config.
 * @param {string} target
 */
export function getEnabledAdapters(target) {
  const configPath = join(target, '.ai', 'config.yaml');
  if (existsSync(configPath)) {
    try {
      const config = parseYaml(readFileSync(configPath, 'utf8')) || {};
      return config.adapters || {};
    } catch (e) {}
  }
  return {};
}

/**
 * Check and display sync status for all configured adapters.
 * @param {object} options
 */
export function handleAdapterStatus(options) {
  console.log(`\n🔌 \x1b[36mIDE & Agent Adapters Status: ${options.target}\x1b[0m`);
  console.log('==================================================');

  const enabled = getEnabledAdapters(options.target);
  const adapters = loadAdapters(options.registry);

  Object.keys(adapters).forEach(name => {
    const a = adapters[name];
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

/**
 * Print a side-by-side or line diff of adapter files.
 */
export function printDiff(srcContent, destContent, filename) {
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

/**
 * Compare local workspace adapter rule files with registry files.
 * @param {string} aName
 * @param {object} options
 */
export function handleAdapterDiff(aName, options) {
  const adapters = loadAdapters(options.registry);
  const adaptersToDiff = [];
  if (aName === 'all') {
    const enabled = getEnabledAdapters(options.target);
    Object.keys(adapters).forEach(name => {
      if (enabled[name]) adaptersToDiff.push(name);
    });
  } else {
    if (!adapters[aName]) {
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
    const a = adapters[name];
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

/**
 * Synchronize local workspace adapter rule files.
 * @param {string} aName
 * @param {object} options
 */
export function handleAdapterSync(aName, options) {
  if (!options.approved) {
    console.error('\x1b[31mError: Adapter sync requires explicit approval flag: --approved\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js adapter sync cursor --approved');
    process.exit(1);
  }

  const adapters = loadAdapters(options.registry);
  const adaptersToSync = [];
  if (aName === 'all') {
    const enabled = getEnabledAdapters(options.target);
    Object.keys(adapters).forEach(name => {
      if (enabled[name]) adaptersToSync.push(name);
    });
  } else {
    if (!adapters[aName]) {
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
    const a = adapters[name];
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
