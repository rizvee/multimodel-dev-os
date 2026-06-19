import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sourceRoot } from '../core/globals.js';
import { parseYaml } from '../core/yaml.js';

export function loadRegistrySources() {
  const paths = [
    join(sourceRoot, '.ai', 'registries', 'sources.yaml')
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const parsed = parseYaml(readFileSync(p, 'utf8'));
        return parsed.sources || [];
      } catch (e) {}
    }
  }
  return [{ name: 'bundled', type: 'local', url: '.ai/plugins/catalog.yaml', enabled: true, trust_level: 'trusted', safety_policy: 'sandboxed', signature_required: false, checksum_required: false }];
}

export function saveRegistrySources(sources) {
  const path = join(sourceRoot, '.ai', 'registries', 'sources.yaml');
  let yaml = '# Registry Sources Configuration\n';
  yaml += '# Remote registries are DISABLED by default.\n';
  yaml += '# Enable via .ai/policies/registry-policy.yaml (set allow_remote_registries: true)\n\n';
  yaml += 'sources:\n';
  sources.forEach(s => {
    yaml += `  - name: "${s.name}"\n`;
    yaml += `    type: "${s.type}"\n`;
    yaml += `    url: "${s.url}"\n`;
    yaml += `    enabled: ${s.enabled}\n`;
    yaml += `    trust_level: "${s.trust_level}"\n`;
    yaml += `    safety_policy: "${s.safety_policy}"\n`;
    yaml += `    signature_required: ${s.signature_required}\n`;
    yaml += `    checksum_required: ${s.checksum_required}\n`;
    if (s.last_synced_at) yaml += `    last_synced_at: "${s.last_synced_at}"\n`;
    if (s.pinned_commit_or_hash) yaml += `    pinned_commit_or_hash: "${s.pinned_commit_or_hash}"\n`;
  });
  writeFileSync(path, yaml, 'utf8');
}
