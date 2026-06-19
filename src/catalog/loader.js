import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { sourceRoot } from '../core/globals.js';
import { parseYaml } from '../core/yaml.js';
import { loadRegistrySources } from '../registry/sources.js';
import { loadRegistryPolicy } from '../core/policy.js';
import { validateRegistryUrl } from '../registry/validation.js';

export function loadCatalog(options = {}) {
  let catalog;
  if (options.allSources) {
    catalog = loadAllCatalogs(options);
  } else if (options.source) {
    catalog = loadCatalogFromSource(options.source, options);
  } else {
    const path = join(sourceRoot, '.ai', 'plugins', 'catalog.yaml');
    try {
      if (existsSync(path)) {
        const reg = parseYaml(readFileSync(path, 'utf8'));
        catalog = reg.catalog || { plugins: [] };
      } else {
        catalog = { plugins: [] };
      }
    } catch (e) {
      catalog = { plugins: [] };
    }
    (catalog.plugins || []).forEach(p => { p._source = 'bundled'; });
  }
  return catalog;
}

export function loadCatalogFromSource(source, options = {}) {
  if (!source || source === 'bundled') {
    return loadCatalog();
  } else if (source === 'local') {
    const localPath = join(options.target || process.cwd(), '.ai', 'plugins', 'catalog.yaml');
    try {
      if (existsSync(localPath)) {
        const reg = parseYaml(readFileSync(localPath, 'utf8'));
        const catalog = reg.catalog || { plugins: [] };
        (catalog.plugins || []).forEach(p => { p._source = 'local'; });
        return catalog;
      }
    } catch (e) {}
    return { plugins: [] };
  } else if (source.startsWith('remote:')) {
    const regName = source.substring(7);
    const sources = loadRegistrySources();
    const src = sources.find(s => s.name === regName);
    if (src && src.type !== 'local') {
      const policy = loadRegistryPolicy(options.target || process.cwd());
      try {
        validateRegistryUrl(src.url, policy);
      } catch (err) {
        console.error(`\x1b[31mError: Registry '${regName}' has an invalid URL: ${err.message}\x1b[0m`);
        process.exit(1);
      }
    }
    const cachePath = join(sourceRoot, '.ai', 'registry-cache', regName, 'catalog.yaml');
    try {
      if (existsSync(cachePath)) {
        const reg = parseYaml(readFileSync(cachePath, 'utf8'));
        const catalog = reg.catalog || { plugins: [] };
        (catalog.plugins || []).forEach(p => { p._source = `remote:${regName}`; });
        return catalog;
      }
    } catch (e) {}
    return { plugins: [] };
  }
  return { plugins: [] };
}

export function loadAllCatalogs(options = {}) {
  const sources = loadRegistrySources();
  const policy = loadRegistryPolicy(options.target || process.cwd());
  const allPlugins = [];

  // Always include bundled
  const bundled = loadCatalog();
  (bundled.plugins || []).forEach(p => { p._source = 'bundled'; allPlugins.push(p); });

  // Include local workspace catalog if different from bundled
  const localPath = join(options.target || process.cwd(), '.ai', 'plugins', 'catalog.yaml');
  if (existsSync(localPath)) {
    try {
      const localCat = parseYaml(readFileSync(localPath, 'utf8'));
      const localPlugins = (localCat.catalog || {}).plugins || [];
      localPlugins.forEach(p => {
        if (!allPlugins.some(bp => bp.slug === p.slug)) {
          p._source = 'local';
          allPlugins.push(p);
        }
      });
    } catch (e) {}
  }

  // Include remote caches if policy allows
  if (policy.allow_remote_registries) {
    sources.filter(s => s.type !== 'local' && s.enabled).forEach(s => {
      const cachePath = join(sourceRoot, '.ai', 'registry-cache', s.name, 'catalog.yaml');
      if (existsSync(cachePath)) {
        try {
          const remoteCat = parseYaml(readFileSync(cachePath, 'utf8'));
          const remotePlugins = (remoteCat.catalog || {}).plugins || [];
          remotePlugins.forEach(p => {
            if (!allPlugins.some(bp => bp.slug === p.slug)) {
              p._source = `remote:${s.name}`;
              allPlugins.push(p);
            }
          });
        } catch (e) {}
      }
    });
  }

  return { plugins: allPlugins };
}
