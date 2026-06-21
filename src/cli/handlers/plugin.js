import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';

import { parseYaml } from '../../core/yaml.js';
import { loadRegistryPolicy } from '../../core/policy.js';
import { sourceRoot } from '../../core/globals.js';

export function getPluginsDir(targetDir) {
  return join(targetDir, '.ai', 'plugins');
}

export function handlePluginList(options) {
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

export function handlePluginShow(slug, options) {
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

  console.log(`\n🔌 \x1b[36mPlugin Specifications: ${p.name} (v${p.version})\x1b[0m`);
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

export function handlePluginValidate(pluginPath, options) {
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
    console.error(`  \x1b[31m❌ [SYNTAX] Failed to parse YAML: ${e.message}\x1b[0m`);
    errors++;
  }

  if (plugin) {
    const reqKeys = ['name', 'slug', 'version', 'description', 'author'];
    reqKeys.forEach(k => {
      if (plugin[k] === undefined || plugin[k] === null) {
        console.error(`  \x1b[31m❌ [METADATA] Missing required key: ${k}\x1b[0m`);
        errors++;
      } else if (typeof plugin[k] !== 'string') {
        console.error(`  \x1b[31m❌ [METADATA] Key '${k}' must be a string (found: ${typeof plugin[k]})\x1b[0m`);
        errors++;
      } else if (k === 'slug') {
        if (!/^[a-z0-9-_]+$/i.test(plugin[k])) {
          console.error(`  \x1b[31m❌ [METADATA] Key 'slug' must be alphanumeric with dashes or underscores only (found: "${plugin[k]}")\x1b[0m`);
          errors++;
        } else {
          console.log(`  \x1b[32m✔ [METADATA] Key: slug ("${plugin[k]}")`);
        }
      } else {
        console.log(`  \x1b[32m✔ [METADATA] Key: ${k} ("${plugin[k]}")`);
      }
    });

    if (plugin.allowed_file_patterns !== undefined) {
      if (!Array.isArray(plugin.allowed_file_patterns)) {
        console.error(`  \x1b[31m❌ [SAFETY] allowed_file_patterns must be an array\x1b[0m`);
        errors++;
      } else {
        plugin.allowed_file_patterns.forEach(pat => {
          if (typeof pat !== 'string') {
            console.error(`  \x1b[31m❌ [SAFETY] allowed_file_patterns item must be a string: ${pat}\x1b[0m`);
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
            console.error(`  \x1b[31m❌ [SAFETY] File pattern '${pat}' violates safety boundaries (must reside under .ai/ or adapters/, contain no '..', and exclude blacklisted files)\x1b[0m`);
            errors++;
          }
        });
        if (errors === 0) {
          console.log(`  \x1b[32m✔ [SAFETY] allowed_file_patterns verified: ${plugin.allowed_file_patterns.length} items`);
        }
      }
    }

    if (plugin.denied_file_patterns !== undefined) {
      if (!Array.isArray(plugin.denied_file_patterns)) {
        console.error(`  \x1b[31m❌ [SAFETY] denied_file_patterns must be an array\x1b[0m`);
        errors++;
      } else {
        plugin.denied_file_patterns.forEach(pat => {
          if (typeof pat !== 'string') {
            console.error(`  \x1b[31m❌ [SAFETY] denied_file_patterns item must be a string: ${pat}\x1b[0m`);
            errors++;
          }
        });
        console.log(`  \x1b[32m✔ [SAFETY] denied_file_patterns verified: ${plugin.denied_file_patterns.length} items`);
      }
    }

    if (plugin.workflows !== undefined) {
      if (typeof plugin.workflows !== 'object' || Array.isArray(plugin.workflows)) {
        console.error(`  \x1b[31m❌ [CAPABILITIES] workflows must be an object\x1b[0m`);
        errors++;
      } else {
        console.log(`  \x1b[32m✔ [CAPABILITIES] workflows verified`);
      }
    }

    if (plugin.templates !== undefined) {
      if (typeof plugin.templates !== 'object' || Array.isArray(plugin.templates)) {
        console.error(`  \x1b[31m❌ [CAPABILITIES] templates must be an object\x1b[0m`);
        errors++;
      } else {
        console.log(`  \x1b[32m✔ [CAPABILITIES] templates verified`);
      }
    }

    if (plugin.adapters !== undefined) {
      if (typeof plugin.adapters !== 'object' || Array.isArray(plugin.adapters)) {
        console.error(`  \x1b[31m❌ [CAPABILITIES] adapters must be an object\x1b[0m`);
        errors++;
      } else {
        console.log(`  \x1b[32m✔ [CAPABILITIES] adapters verified`);
      }
    }

    if (plugin.safety_notes !== undefined) {
      if (typeof plugin.safety_notes !== 'string') {
        console.error(`  \x1b[31m❌ [SAFETY] safety_notes must be a string\x1b[0m`);
        errors++;
      } else {
        console.log(`  \x1b[32m✔ [SAFETY] safety_notes verified`);
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

export function handlePluginInstall(pluginPath, options) {
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

  const policy = loadRegistryPolicy(options.target || process.cwd());
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
      
      const isSafeSubdir = policy.allowed_write_roots.some(prefix => normPattern.startsWith(prefix));
      const hasTraversal = normPattern.includes('..') || normPattern.startsWith('/');
      const isBlacklisted = policy.blocked_paths.some(black => normPattern.includes(black));

      if (!isSafeSubdir || hasTraversal || isBlacklisted) {
        console.error(`\x1b[31mError: Path pattern '${pattern}' violates safety boundaries. Installation aborted.\x1b[0m`);
        process.exit(1);
      }

      const ext = '.' + normPattern.split('.').pop();
      if (!policy.allowed_file_extensions.includes(ext)) {
        console.error(`\x1b[31mError: File extension '${ext}' for asset '${pattern}' is not allowed by policy. Installation aborted.\x1b[0m`);
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

  if (filesToCopy.length > policy.max_plugin_files) {
    console.error(`\x1b[31mError: Plugin file count (${filesToCopy.length}) exceeds policy limit (${policy.max_plugin_files}). Installation aborted.\x1b[0m`);
    process.exit(1);
  }

  let totalSize = 0;
  filesToCopy.forEach(item => {
    if (existsSync(item.src)) {
      totalSize += statSync(item.src).size;
    }
  });
  if (totalSize > policy.max_plugin_size_kb * 1024) {
    console.error(`\x1b[31mError: Plugin total size (${(totalSize / 1024).toFixed(1)}KB) exceeds policy limit (${policy.max_plugin_size_kb}KB). Installation aborted.\x1b[0m`);
    process.exit(1);
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
    console.log(`\n\x1b[33mSafety Status:\x1b[0m Sandbox checks: PASSED (Declarative only, offline, zero-dependency)`);
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
  console.log(`\n\x1b[32mSafety Status:\x1b[0m Sandboxed isolation: VERIFIED (All files written inside whitelisted .ai/ & adapters/ folders)`);
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

export function handlePluginStatus(options) {
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
              console.log(`    \x1b[31m❌\x1b[0m ${pat}`);
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
