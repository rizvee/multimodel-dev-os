import { existsSync, readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

import { parseYaml } from '../../../core/yaml.js';
import { loadRegistryPolicy } from '../../../core/policy.js';
import { validateRegistryUrl } from '../../../registry/validation.js';
import { loadRegistrySources, saveRegistrySources } from '../../../registry/sources.js';
import { loadRegistryLockfile, getLockfilePath } from '../../../registry/provenance.js';
import { loadSigningKey, getSigningKeyPath } from '../../../registry/signing.js';
import { loadTrustedKeys } from '../../../registry/trust-store.js';
import { sourceRoot, version } from '../../../core/globals.js';

export function handleRegistryList(options) {
  const sources = loadRegistrySources();
  const policy = loadRegistryPolicy(options.target);

  if (options.json) {
    console.log(JSON.stringify(sources, null, 2));
    return;
  }

  console.log(`\n📂  \x1b[36mRegistry Sources [v${version}]\x1b[0m`);
  console.log('==================================================');
  console.log(`Policy Status: allow_remote_registries = \x1b[${policy.allow_remote_registries ? '32mtrue' : '33mfalse'}\x1b[0m (Remote registries are disabled by default for safety)\n`);

  const lockfile = loadRegistryLockfile(options.target || process.cwd());

  sources.forEach(s => {
    const status = s.enabled ? '\x1b[32m● enabled\x1b[0m' : '\x1b[90m○ disabled\x1b[0m';
    const label = s.name === 'bundled' ? 'bundled' : s.type === 'local' ? `local:${s.name}` : `remote:${s.name}`;
    const lockEntry = lockfile.entries[s.name];
    const lockBadge = lockEntry
      ? (lockEntry.signature ? ' \x1b[32m[signed]\x1b[0m' : ' \x1b[33m[unsigned]\x1b[0m')
      : ' \x1b[90m[no lockfile entry]\x1b[0m';
    console.log(`  \x1b[32m${s.name}\x1b[0m [${label}]  ${status}${lockBadge}`);
    console.log(`    type:           ${s.type}`);
    console.log(`    url:            ${s.url}`);
    console.log(`    trust_level:    ${s.trust_level}`);
    console.log(`    safety_policy:  ${s.safety_policy}`);
    console.log(`    checksum:       ${s.checksum_required ? 'required (SHA-256 integrity)' : 'not required'}`);
    console.log(`    signature:      ${s.signature_required ? 'required (HMAC-SHA256)' : 'not required'}`);
    if (s.last_synced_at) console.log(`    last_synced:    ${s.last_synced_at}`);
    if (lockEntry) console.log(`    lockfile:       synced ${lockEntry.synced_at}, hash ${lockEntry.catalog_sha256.slice(0, 16)}...`);
  });

  console.log('\nUse \x1b[36mregistry show <name>\x1b[0m to view detailed source configuration.');
  console.log('Use \x1b[36mregistry status\x1b[0m to see policy states and cache health.');
  console.log('Use \x1b[36mregistry verify <name>\x1b[0m to perform integrity checks.');
  console.log('Use \x1b[36mregistry lock\x1b[0m to inspect the provenance lockfile.\n');
}

export function handleRegistryAdd(name, url, options) {
  const policy = loadRegistryPolicy(options.target);

  if (!policy.allow_remote_registries) {
    console.error('\x1b[31mError: Remote registries are disabled by policy.\x1b[0m');
    console.log('\nTo enable, set \x1b[33mallow_remote_registries: true\x1b[0m in:');
    console.log('  .ai/policies/registry-policy.yaml\n');
    process.exit(1);
  }

  if (!options.approved) {
    console.error('\x1b[31mError: Registry cannot be added without explicit approval. Pass the --approved flag.\x1b[0m');
    console.log(`\n\x1b[33mPlanned Action:\x1b[0m Add registry source '${name}' pointing to:`);
    console.log(`  URL:         ${url}`);
    console.log(`  Type:        https`);
    console.log(`  Trust Level: community`);
    console.log(`  Checksum:    required (SHA-256)`);
    console.log(`\nRun with --approved to apply:\n  npx multimodel-dev-os registry add ${name} ${url} --approved\n`);
    process.exit(1);
  }

  try {
    validateRegistryUrl(url, policy);
  } catch (err) {
    console.error(`\x1b[31mError: Registry URL is invalid: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    console.error(`\x1b[31mError: Registry name '${name}' contains invalid characters. Use only alphanumeric, dash, or underscore.\x1b[0m`);
    process.exit(1);
  }

  const sources = loadRegistrySources();
  if (sources.some(s => s.name === name)) {
    console.error(`\x1b[31mError: Registry '${name}' already exists. Remove it first with: registry remove ${name} --approved\x1b[0m`);
    process.exit(1);
  }

  const type = url.endsWith('.git') ? 'git' : 'https';

  sources.push({
    name,
    type,
    url,
    enabled: true,
    trust_level: 'community',
    safety_policy: 'sandboxed',
    signature_required: false,
    checksum_required: true
  });

  saveRegistrySources(sources);
  console.log(`\n\x1b[32m✔ Registry '${name}' added successfully!\x1b[0m`);
  console.log(`  Type:        ${type}`);
  console.log(`  URL:         ${url}`);
  console.log(`  Trust Level: community`);
  console.log(`\nNext steps:`);
  console.log(`  Sync:   npx multimodel-dev-os registry sync ${name} --approved`);
  console.log(`  Browse: npx multimodel-dev-os catalog list --source remote:${name}\n`);
}

export function handleRegistryRemove(name, options) {
  if (name === 'bundled') {
    console.error('\x1b[31mError: The bundled registry cannot be removed.\x1b[0m');
    process.exit(1);
  }

  if (!options.approved) {
    console.error(`\x1b[31mError: Registry cannot be removed without explicit approval. Pass the --approved flag.\x1b[0m`);
    console.log(`\n\x1b[33mPlanned Action:\x1b[0m Remove registry source '${name}' and delete cached files.`);
    console.log(`\nRun with --approved to apply:\n  npx multimodel-dev-os registry remove ${name} --approved\n`);
    process.exit(1);
  }

  const sources = loadRegistrySources();
  const idx = sources.findIndex(s => s.name === name);
  if (idx === -1) {
    console.error(`\x1b[31mError: Registry '${name}' not found.\x1b[0m`);
    process.exit(1);
  }

  sources.splice(idx, 1);
  saveRegistrySources(sources);

  // Remove cache directory
  const cacheDir = join(sourceRoot, '.ai', 'registry-cache', name);
  if (existsSync(cacheDir)) {
    try {
      const files = readdirSync(cacheDir);
      files.forEach(f => {
        const fp = join(cacheDir, f);
        if (statSync(fp).isFile()) {
          writeFileSync(fp, ''); // Clear content before unlink
        }
      });
    } catch (e) {}
  }

  console.log(`\n\x1b[32m✔ Registry '${name}' removed successfully.\x1b[0m`);
  console.log(`  Source entry removed from .ai/registries/sources.yaml`);
  if (existsSync(cacheDir)) {
    console.log(`  Cache directory cleared: .ai/registry-cache/${name}/`);
  }
  console.log('');
}

export function handleRegistryShow(name, options) {
  const sources = loadRegistrySources();
  const source = sources.find(s => s.name === name);

  if (!source) {
    console.error(`\x1b[31mError: Registry source '${name}' is not configured.\x1b[0m`);
    console.log('Available configured sources:');
    sources.forEach(s => console.log(`  - ${s.name} (${s.type})`));
    console.log('\nTo add a remote source, run:');
    console.log(`  npx multimodel-dev-os registry add <name> <url> --approved`);
    process.exit(1);
  }

  if (source.type !== 'local') {
    const policy = loadRegistryPolicy(options.target || process.cwd());
    try {
      validateRegistryUrl(source.url, policy);
    } catch (err) {
      console.error(`\x1b[31mError: Registry '${name}' has an invalid URL: ${err.message}\x1b[0m`);
      process.exit(1);
    }
  }

  if (options.json) {
    console.log(JSON.stringify(source, null, 2));
    return;
  }

  const label = source.name === 'bundled' ? 'bundled' : source.type === 'local' ? `local:${source.name}` : `remote:${source.name}`;

  console.log(`\n🔎  \x1b[36mRegistry Source: ${name}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mName:\x1b[0m           ${source.name}`);
  console.log(`\x1b[33mSource Label:\x1b[0m   ${label}`);
  console.log(`\x1b[33mType:\x1b[0m           ${source.type}`);
  console.log(`\x1b[33mURL:\x1b[0m            ${source.url}`);
  console.log(`\x1b[33mEnabled:\x1b[0m        ${source.enabled}`);
  console.log(`\x1b[33mTrust Level:\x1b[0m    ${source.trust_level}`);
  console.log(`\x1b[33mSafety Policy:\x1b[0m  ${source.safety_policy}`);
  console.log(`\x1b[33mChecksum:\x1b[0m       ${source.checksum_required ? 'Required (SHA-256 integrity)' : 'Not required'}`);
  console.log(`\x1b[33mSignature:\x1b[0m      ${source.signature_required ? 'Required' : 'Not required (v3.0.1)'}`);

  if (source.last_synced_at) {
    console.log(`\x1b[33mLast Synced:\x1b[0m    ${source.last_synced_at}`);
  }
  if (source.pinned_commit_or_hash) {
    console.log(`\x1b[33mPinned Hash:\x1b[0m    ${source.pinned_commit_or_hash}`);
  }

  // Show cache status for remote registries
  if (source.type !== 'local') {
    const cacheDir = join(sourceRoot, '.ai', 'registry-cache', name);
    if (existsSync(cacheDir)) {
      const catalogPath = join(cacheDir, 'catalog.yaml');
      if (existsSync(catalogPath)) {
        try {
          const parsed = parseYaml(readFileSync(catalogPath, 'utf8'));
          const count = ((parsed.catalog || {}).plugins || []).length;
          console.log(`\x1b[33mCached Plugins:\x1b[0m ${count} entries`);
        } catch (e) {
          console.log(`\x1b[33mCached Plugins:\x1b[0m \x1b[31m(parse error)\x1b[0m`);
        }
      } else {
        console.log(`\x1b[33mCache Status:\x1b[0m   \x1b[90mEmpty\x1b[0m`);
      }
    } else {
      console.log(`\x1b[33mCache Status:\x1b[0m   \x1b[90mNot synced\x1b[0m`);
    }
  }

  console.log('\nNext steps:');
  console.log(`  Verify:  npx multimodel-dev-os registry verify ${name}`);
  if (source.type !== 'local') {
    console.log(`  Sync:    npx multimodel-dev-os registry sync ${name} --approved`);
    console.log(`  Browse:  npx multimodel-dev-os catalog list --source remote:${name}`);
  } else {
    console.log(`  Browse:  npx multimodel-dev-os catalog list --source ${name}`);
  }
  console.log('');
}

export function handleRegistryStatus(options) {
  const sources = loadRegistrySources();
  const policy = loadRegistryPolicy(options.target);

  if (options.json) {
    console.log(JSON.stringify({ sources, policy }, null, 2));
    return;
  }

  const projectDir = options.target || process.cwd();
  let signingKeyStatus = '\x1b[90mnot configured\x1b[0m';
  try {
    const sk = loadSigningKey(projectDir);
    signingKeyStatus = sk ? `\x1b[32mconfigured\x1b[0m (${getSigningKeyPath(projectDir)})` : '\x1b[90mnot configured\x1b[0m';
  } catch (e) {
    signingKeyStatus = `\x1b[31merror: ${e.message}\x1b[0m`;
  }

  const lockfile = loadRegistryLockfile(projectDir);
  const lockfileEntryCount = Object.keys(lockfile.entries).length;
  const lockfilePath = getLockfilePath(projectDir);
  const lockfileStatus = existsSync(lockfilePath)
    ? `\x1b[32mpresent\x1b[0m (${lockfileEntryCount} entr${lockfileEntryCount === 1 ? 'y' : 'ies'})`
    : '\x1b[90mnot present\x1b[0m';

  console.log(`\n📊 \x1b[36mRegistry Status [v${version}]\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mPolicy State:\x1b[0m`);
  console.log(`  allow_remote_registries:    \x1b[${policy.allow_remote_registries ? '32mtrue' : '33mfalse'}\x1b[0m (Disabled by default)`);
  console.log(`  require_checksum:           ${policy.require_checksum ? '\x1b[32mtrue\x1b[0m (SHA256 integrity enforced)' : '\x1b[33mfalse\x1b[0m'}`);
  console.log(`  require_signature:          ${policy.require_signature ? '\x1b[32mtrue\x1b[0m (HMAC-SHA256 enforced)' : '\x1b[90mfalse\x1b[0m'}`);
  console.log(`  require_lockfile_on_verify: ${policy.require_lockfile_on_verify ? '\x1b[32mtrue\x1b[0m' : '\x1b[90mfalse\x1b[0m'}`);
  console.log(`  allow_untrusted_install:    ${policy.allow_untrusted_install ? '\x1b[33mtrue\x1b[0m' : '\x1b[32mfalse\x1b[0m (secured)'}`);
  console.log(`  allow_unsigned_local:       ${policy.allow_unsigned_local ? '\x1b[32mtrue\x1b[0m' : '\x1b[33mfalse\x1b[0m'}`);
  console.log(`  allow_unsigned_bundled:     ${policy.allow_unsigned_bundled ? '\x1b[32mtrue\x1b[0m' : '\x1b[33mfalse\x1b[0m'}`);
  console.log(`  allow_unsigned_remote:      ${policy.allow_unsigned_remote ? '\x1b[32mtrue\x1b[0m' : '\x1b[33mfalse\x1b[0m'}`);
  console.log(`  require_trusted_publisher:  ${policy.require_trusted_publisher ? '\x1b[32mtrue\x1b[0m' : '\x1b[90mfalse\x1b[0m'}`);
  console.log(`  provenance_required:        ${policy.provenance_required ? '\x1b[32mtrue\x1b[0m' : '\x1b[90mfalse\x1b[0m'}`);
  console.log(`  trusted_keys_file:          \x1b[36m${policy.trusted_keys_file}\x1b[0m`);
  console.log(`  allowed_signature_algs:     \x1b[36m${(policy.allowed_signature_algorithms || []).join(', ')}\x1b[0m`);
  console.log(`  max_plugin_files:           ${policy.max_plugin_files}`);
  console.log(`  max_plugin_size_kb:         ${policy.max_plugin_size_kb}KB`);
  console.log(`  max_registry_cache_size:    ${policy.max_registry_cache_size_kb}KB`);
  console.log(`\n\x1b[33mSigning & Provenance:\x1b[0m`);
  console.log(`  Signing key:    ${signingKeyStatus}`);
  console.log(`  Lockfile:       ${lockfileStatus}`);
  if (lockfileEntryCount > 0) {
    Object.entries(lockfile.entries).forEach(([rName, entry]) => {
      const sigBadge = entry.signature ? '\x1b[32m[signed]\x1b[0m' : '\x1b[33m[unsigned]\x1b[0m';
      console.log(`    ${rName}: ${sigBadge} synced ${entry.synced_at || 'unknown'}`);
    });
  }

  console.log(`\n\x1b[33mSources:\x1b[0m`);
  sources.forEach(s => {
    const status = s.enabled ? '\x1b[32m● enabled\x1b[0m' : '\x1b[90m○ disabled\x1b[0m';
    const label = s.name === 'bundled' ? 'bundled' : s.type === 'local' ? `local:${s.name}` : `remote:${s.name}`;
    const synced = s.last_synced_at ? `synced: ${s.last_synced_at}` : 'never synced';
    const cacheDir = join(sourceRoot, '.ai', 'registry-cache', s.name);
    const hasCache = s.type !== 'local' && existsSync(cacheDir);

    console.log(`  ${s.name}  ${status}  [${label}]  (${s.type}, ${s.trust_level})`);
    if (s.type !== 'local') {
      console.log(`    URL:    ${s.url}`);
      console.log(`    Cache:  ${hasCache ? '\x1b[32mcached\x1b[0m' : '\x1b[90mnot cached\x1b[0m'}`);
      console.log(`    Sync:   ${synced}`);
    }
  });

  console.log('\nUse \x1b[36mregistry list\x1b[0m to view configured registry sources.');
  console.log('Use \x1b[36mregistry verify <name>\x1b[0m to check cache integrity offline.');
  console.log('Use \x1b[36mregistry sync <name> --approved\x1b[0m to refresh a remote cache.\n');
}
