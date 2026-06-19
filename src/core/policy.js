import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { sourceRoot } from './globals.js';
import { parseYaml } from './yaml.js';

export function loadRegistryPolicy(targetDir) {
  const defaults = {
    allow_remote_registries: false,
    allow_http_localhost: false,
    require_approval_for_remote_sync: true,
    require_checksum: true,
    require_signature: false,
    require_lockfile_on_verify: false,
    allow_untrusted_install: false,
    allowed_write_roots: ['.ai/', 'adapters/'],
    blocked_paths: ['.env', '.npmrc', '.git/', 'node_modules/', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'],
    max_plugin_files: 20,
    max_plugin_size_kb: 100,
    max_registry_cache_size_kb: 512,
    allowed_file_extensions: ['.md', '.yaml', '.yml', '.json']
  };
  const paths = [];
  if (targetDir) {
    paths.push(join(targetDir, '.ai', 'policies', 'registry-policy.yaml'));
  }
  paths.push(join(sourceRoot, '.ai', 'policies', 'registry-policy.yaml'));

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const parsed = parseYaml(readFileSync(p, 'utf8'));
        return { ...defaults, ...parsed };
      } catch (e) {}
    }
  }
  return defaults;
}
