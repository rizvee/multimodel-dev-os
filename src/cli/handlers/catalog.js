import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

import { parseYaml } from '../../core/yaml.js';
import { loadRegistryPolicy } from '../../core/policy.js';
import { loadRegistrySources } from '../../registry/sources.js';
import { loadCatalog } from '../../catalog/loader.js';
import { sourceRoot, version } from '../../core/globals.js';
import { getPluginsDir, handlePluginInstall } from './plugin.js';

export function handleCatalogList(options) {
  const catalog = loadCatalog(options);
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
    const isInst = installedSlugs.has(p.slug) ? ' \x1b[90m(✓ Installed)\x1b[0m' : '';
    console.log(`\n\x1b[32m* ${p.name}\x1b[0m (v${p.version})${isInst}`);
    console.log(`  slug:         \x1b[33m${p.slug}\x1b[0m`);
    console.log(`  source:       ${p._source || 'bundled'}`);
    console.log(`  category:     ${p.category}`);
    console.log(`  description:  ${p.description}`);
    console.log(`  safety:       ${p.safety_level || 'sandboxed'} (${p.install_scope || 'declarative'})`);
  });

  console.log('\nUse \x1b[36mcatalog list --category <category>\x1b[0m to filter listings by category.');
  console.log('Use \x1b[36mcatalog show <slug>\x1b[0m to inspect capabilities and installation manifest preview.');
  console.log('Use \x1b[36mcatalog install <slug> --approved\x1b[0m to install a plugin.\n');
}

export function handleCatalogSearch(query, options) {
  const catalog = loadCatalog(options);
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
    console.log(`  \x1b[33mWarning: No plugins found matching '${query}'. Try running 'catalog list' to view all entries.\x1b[0m`);
  } else {
    matches.forEach(p => {
      console.log(`\n\x1b[32m* ${p.name}\x1b[0m (v${p.version}) [slug: \x1b[33m${p.slug}\x1b[0m]`);
      console.log(`  category:     ${p.category}`);
      console.log(`  description:  ${p.description}`);
    });
  }
  console.log('');
}

export function handleCatalogShow(slug, options) {
  const catalog = loadCatalog(options);
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
  console.log(`\x1b[33mSlug:\x1b[0m         ${p.slug}`);
  console.log(`\x1b[33mSource:\x1b[0m       ${p._source || 'bundled'}`);
  console.log(`\x1b[33mCategory:\x1b[0m     ${p.category}`);
  console.log(`\x1b[33mDescription:\x1b[0m  ${p.description}`);
  console.log(`\x1b[33mRecommended:\x1b[0m  ${p.recommended_for}`);
  console.log(`\x1b[33mSafety Level:\x1b[0m ${p.safety_level} (declarative-only, sandboxed)`);
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

export function handleCatalogCategories(options) {
  const catalog = loadCatalog(options);
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

export function handleCatalogInstall(slug, options) {
  const catalog = loadCatalog(options);
  const plugins = catalog.plugins || [];
  const p = plugins.find(item => item.slug === slug);

  if (!p) {
    console.error(`\x1b[31mError: Plugin with slug '${slug}' not found in catalog.\x1b[0m`);
    process.exit(1);
  }

  const policy = loadRegistryPolicy(options.target || process.cwd());

  let srcPath;
  if (p._source === 'bundled') {
    srcPath = join(sourceRoot, '.ai', 'plugins', 'catalog', `${slug}.yaml`);
  } else if (p._source === 'local') {
    srcPath = join(options.target || process.cwd(), '.ai', 'plugins', 'catalog', `${slug}.yaml`);
  } else if (p._source && p._source.startsWith('remote:')) {
    const regName = p._source.substring(7);
    const sources = loadRegistrySources();
    const src = sources.find(s => s.name === regName);
    if (src) {
      if (!policy.allow_untrusted_install && (src.trust_level === 'untrusted' || src.trust_level === 'community')) {
        console.error(`\x1b[31mError: Installation from untrusted or community registry '${regName}' is blocked by policy.\x1b[0m`);
        console.error(`  Registry trust level: ${src.trust_level}`);
        console.error(`  Policy allow_untrusted_install: ${policy.allow_untrusted_install}`);
        process.exit(1);
      }
    }
    srcPath = join(sourceRoot, '.ai', 'registry-cache', regName, 'catalog', `${slug}.yaml`);
  } else {
    srcPath = join(sourceRoot, '.ai', 'plugins', 'catalog', `${slug}.yaml`);
  }

  if (!existsSync(srcPath)) {
    console.error(`\x1b[31mError: Packed plugin manifest not found at: ${srcPath}\x1b[0m`);
    process.exit(1);
  }

  handlePluginInstall(srcPath, options);
}

export function handleCatalogStatus(options) {
  const catalog = loadCatalog(options);
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
          console.log(`  - \x1b[32m${p.name}\x1b[0m (v${p.version}): \x1b[32m✔ Installed (Up-to-date)\x1b[0m`);
        } else {
          console.log(`  - \x1b[33m${p.name}\x1b[0m (v${p.version}): \x1b[33m! Incomplete (Missing assets)\x1b[0m (${presentCount}/${total} files present)`);
        }
      } catch (e) {
        console.log(`  - \x1b[31m${p.name}\x1b[0m (v${p.version}): \x1b[31mInstalled (Read error: ${e.message})\x1b[0m`);
      }
    }
  });

  console.log('\nUse \x1b[36mcatalog show <slug>\x1b[0m to view detailed plugin metadata.');
  console.log('Use \x1b[36mcatalog install <slug> --approved\x1b[0m to install or update a plugin.\n');
}

export function handleCatalogRecommend(options, { getAnalysis } = {}) {
  if (!getAnalysis) {
    console.error('\x1b[31mError: getAnalysis is required for catalog recommendation but was not provided.\x1b[0m');
    process.exit(1);
  }
  const analysis = getAnalysis(options.target);
  const catalog = loadCatalog(options);
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
      console.log(`\n* \x1b[32m${r.plugin.name}\x1b[0m`);
      console.log(`  Detected Signals: \x1b[33m${r.signals.join(', ')}\x1b[0m`);
      console.log(`  Confidence Level: \x1b[35m${(r.confidence * 100).toFixed(0)}%\x1b[0m`);
      console.log(`  Why Recommended:  ${r.reason}`);
      console.log(`  Install Command:  \x1b[36mnpx multimodel-dev-os catalog install ${r.plugin.slug} --approved\x1b[0m`);
      console.log(`  Safety Notes:     Declarative sandbox only (offline, writes to .ai/ & adapters/ only, no scripts)`);
    });
  }
  console.log('');
}
