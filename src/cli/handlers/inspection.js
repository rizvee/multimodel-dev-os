import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, relative, resolve, basename } from 'path';
import { sourceRoot, version, loadTemplates, loadAdapters } from '../../core/globals.js';
import { parseYaml } from '../../core/yaml.js';

/**
 * Strict verification of crucial context files presence.
 * @param {object} options 
 */
export function handleVerify(options) {
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

/**
 * Advisory doctor checkup.
 * @param {object} options 
 * @param {object} dependencies 
 */
export function handleDoctor(options, { scanTarget, detectDependencySignals, getAnalysis, diffMemory } = {}) {
  if (options.tokens) {
    handleDoctorTokens(options);
    return;
  }
  if (options.release) {
    handleDoctorRelease(options);
    return;
  }
  if (options.intelligence) {
    handleDoctorIntelligence(options, { diffMemory });
    return;
  }
  if (options.onboarding) {
    handleDoctorOnboarding(options, { scanTarget, detectDependencySignals });
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

/**
 * Strict schema validation check.
 * @param {object} options 
 */
export function handleValidate(options) {
  if (options && options.allRegistries) {
    handleValidateAllRegistries(options);
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
    const TEMPLATES = loadTemplates(options.registry);
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

export function parseThresholdToBytes(val) {
  if (!val) return 100 * 1024; // Default 100KB
  const matches = val.match(/^(\d+)(KB|MB|B)?$/i);
  if (!matches) return 100 * 1024;
  const num = parseInt(matches[1], 10);
  const unit = (matches[2] || '').toUpperCase();
  if (unit === 'MB') return num * 1024 * 1024;
  if (unit === 'KB') return num * 1024;
  return num;
}

export function handleDoctorTokens(options) {
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

export function handleValidateTemplate(name, options) {
  const TEMPLATES = loadTemplates(options?.registry);
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

export function handleValidateAdapter(name, options) {
  const ADAPTERS = loadAdapters(options?.registry);
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

export function handleValidateSkill(name, options) {
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

export function handleValidateAllRegistries(options) {
  console.log(`\n🛡 \x1b[34mValidating All Registry Entries\x1b[0m\n`);
  let errors = 0;

  const TEMPLATES = loadTemplates(options?.registry);
  const ADAPTERS = loadAdapters(options?.registry);

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

export function handleDoctorRelease(options) {
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

export function handleScan(options, { scanTarget, detectFrameworkSignals, detectDependencySignals, detectAiDevOsSignals, detectRisks } = {}) {
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

export function handleStatus(options, { scanTarget, detectFrameworkSignals, detectDependencySignals, diffMemory } = {}) {
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

export function handleDoctorIntelligence(options, { diffMemory } = {}) {
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

export function handleDoctorOnboarding(options, { scanTarget, detectDependencySignals } = {}) {
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
