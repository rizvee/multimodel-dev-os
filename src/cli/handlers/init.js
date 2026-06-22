import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { sourceRoot, loadTemplates, loadAdapters } from '../../core/globals.js';

/**
 * Initializes multimodel-dev-os in the target directory.
 * @param {object} options 
 */
export function handleInit(options) {
  console.log(`\n\x1b[34mInitializing multimodel-dev-os in: ${options.target}\x1b[0m`);
  
  const TEMPLATES = loadTemplates(options.registry);
  const ADAPTERS = loadAdapters(options.registry);

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
