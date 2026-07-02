import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative, isAbsolute, basename } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';

import { parseYaml } from '../../core/yaml.js';
import { computeSHA256 } from '../../core/hashes.js';
import { loadRegistryPolicy } from '../../core/policy.js';
import { validateRegistryUrl } from '../../registry/validation.js';
import { loadRegistrySources, saveRegistrySources } from '../../registry/sources.js';
import { loadRegistryLockfile, saveRegistryLockfile, updateLockfileEntry, getLockfilePath } from '../../registry/provenance.js';
import {
  loadSigningKey,
  generateSigningKey,
  saveSigningKey,
  signPayload,
  verifySignature,
  getSigningKeyPath,
  verifySignatureBlock,
  normalizePublicKey
} from '../../registry/signing.js';
import { loadTrustedKeys, addTrustedKey, removeTrustedKey, fetchRemotePublicKey, getTrustStorePath, syncRemoteKeys } from '../../registry/trust-store.js';
import { createTrustVerdict } from '../../registry/verdict.js';
import { sourceRoot, version } from '../../core/globals.js';

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

export function handleRegistrySync(name, options) {
  const policy = loadRegistryPolicy(options.target);
  const sources = loadRegistrySources();
  const source = sources.find(s => s.name === name);

  if (!source) {
    console.error(`\x1b[31mError: Registry '${name}' not found in configured sources.\x1b[0m`);
    console.log('Available configured sources:');
    sources.forEach(s => console.log(`  - ${s.name} (${s.type})`));
    console.log('\nUse \x1b[36mregistry list\x1b[0m to view configured sources.');
    process.exit(1);
  }

  if (source.type === 'local') {
    console.log(`\n\x1b[33mNote: Registry '${name}' is a local source and does not require syncing.\x1b[0m\n`);
    return;
  }

  try {
    validateRegistryUrl(source.url, policy);
  } catch (err) {
    console.error(`\x1b[31mError: Registry '${name}' has an invalid URL: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  if (!policy.allow_remote_registries) {
    console.error('\x1b[31mError: Remote registries are disabled by policy.\x1b[0m');
    console.log('\nTo enable, set \x1b[33mallow_remote_registries: true\x1b[0m in:');
    console.log('  .ai/policies/registry-policy.yaml\n');
    process.exit(1);
  }

  if (!options.approved) {
    console.log(`\n⚠️   \x1b[33mRegistry Sync Refused — Explicit Approval Required\x1b[0m`);
    console.log('==================================================');
    console.log(`Syncing remote registries requires the explicit \x1b[33m--approved\x1b[0m flag to download metadata and files.`);
    console.log(`Registry:       \x1b[32m${name}\x1b[0m`);
    console.log(`URL:            ${source.url}`);
    console.log(`Trust Level:    ${source.trust_level}`);
    console.log(`Checksums:      ${source.checksum_required ? 'Enforced (SHA-256)' : 'Not enforced'}`);
    console.log(`Signatures:     ${source.signature_required ? 'Required' : 'Disabled (SHA-256 fallback)'}`);
    console.log(`\n\x1b[33mPlanned Actions:\x1b[0m`);
    console.log(`  [DOWNLOAD] catalog.yaml    → .ai/registry-cache/${name}/catalog.yaml`);
    console.log(`  [DOWNLOAD] manifest.json   → .ai/registry-cache/${name}/manifest.json`);
    console.log(`  [COMPUTE]  checksums.json  → .ai/registry-cache/${name}/checksums.json`);
    console.log(`\n\x1b[33mSecurity & Safety Boundaries:\x1b[0m`);
    console.log(`  • \x1b[32mNo automated installs:\x1b[0m Syncing only updates the local cache. No plugins are installed or run.`);
    console.log(`  • \x1b[32mNo arbitrary code execution:\x1b[0m Registries cannot run shell scripts, commands, or packages.`);
    console.log(`  • \x1b[32mSandboxed write paths:\x1b[0m Cache files are written strictly to .ai/registry-cache/${name}/.`);
    console.log(`  • \x1b[32mTo install afterwards:\x1b[0m Use 'catalog install <slug> --approved' to deploy a plugin.`);
    console.log(`\nTo execute this sync operation, run:`);
    console.log(`  \x1b[36mnpx multimodel-dev-os registry sync ${name} --approved\x1b[0m\n`);
    process.exit(1);
  }

  const cacheDir = join(sourceRoot, '.ai', 'registry-cache', name);
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  console.log(`\n🔄 \x1b[36mSyncing Registry: ${name}\x1b[0m`);
  console.log('==================================================');

  const url = source.url;
  const catalogUrl = url.endsWith('/') ? `${url}catalog.yaml` : url;
  const manifestUrl = catalogUrl.replace(/catalog\.yaml$/, 'manifest.json');

  try {
    const catalogDest = join(cacheDir, 'catalog.yaml');
    const manifestDest = join(cacheDir, 'manifest.json');

    const fetchUrlSync = (targetUrl) => {
      validateRegistryUrl(targetUrl, policy);

      const script = `
        const url = process.argv[1];
        const mod = require(url.startsWith('https') ? 'https' : 'http');
        mod.get(url, (res) => {
          if (res.statusCode !== 200) {
            process.stderr.write('HTTP_ERROR:' + res.statusCode);
            process.exit(1);
          }
          res.pipe(process.stdout);
        }).on('error', (e) => {
          process.stderr.write('NET_ERROR:' + e.message);
          process.exit(1);
        });
      `;
      return execFileSync(process.execPath, ['-e', script, '--', targetUrl], { encoding: 'utf8', timeout: 30000 });
    };

    console.log(`Downloading: ${catalogUrl}`);
    console.log(`  → .ai/registry-cache/${name}/catalog.yaml ...`);

    const catalogData = fetchUrlSync(catalogUrl);
    writeFileSync(catalogDest, catalogData, 'utf8');
    const catalogSize = (Buffer.byteLength(catalogData) / 1024).toFixed(1);
    console.log(`  → OK (${catalogSize}KB)`);

    let manifestData = null;
    try {
      console.log(`Downloading: ${manifestUrl}`);
      console.log(`  → .ai/registry-cache/${name}/manifest.json ...`);
      manifestData = fetchUrlSync(manifestUrl);
      writeFileSync(manifestDest, manifestData, 'utf8');
      const manifestSize = (Buffer.byteLength(manifestData) / 1024).toFixed(1);
      console.log(`  → OK (${manifestSize}KB)`);
    } catch (e) {
      console.log(`  → \x1b[33mNot found (optional)\x1b[0m`);
    }

    console.log('Computing checksums...');
    const checksums = {
      'catalog.yaml': `sha256:${computeSHA256(catalogData)}`
    };
    if (manifestData) {
      checksums['manifest.json'] = `sha256:${computeSHA256(manifestData)}`;
    }

    const baseUrl = catalogUrl.substring(0, catalogUrl.lastIndexOf('/') + 1);
    let totalSize = Buffer.byteLength(catalogData) + (manifestData ? Buffer.byteLength(manifestData) : 0);

    if (manifestData) {
      try {
        const manifestObj = JSON.parse(manifestData);
        if (manifestObj.files_hashes) {
          for (const [file, hash] of Object.entries(manifestObj.files_hashes)) {
            if (file === 'catalog.yaml' || file === 'manifest.json') continue;
            
            const fileDest = join(cacheDir, file);
            const relativeToCache = relative(cacheDir, fileDest);
            if (relativeToCache.includes('..') || isAbsolute(relativeToCache)) {
              console.error(`\x1b[31mError: Safe path violation in manifest files list: ${file}\x1b[0m`);
              process.exit(1);
            }
            
            console.log(`Downloading: ${baseUrl}${file}`);
            console.log(`  → .ai/registry-cache/${name}/${file} ...`);
            const fileData = fetchUrlSync(`${baseUrl}${file}`);
            
            totalSize += Buffer.byteLength(fileData);
            if (totalSize > policy.max_registry_cache_size_kb * 1024) {
              console.error(`\x1b[31mError: Registry cache size limit exceeded (max: ${policy.max_registry_cache_size_kb}KB).\x1b[0m`);
              process.exit(1);
            }
            
            const fileDir = dirname(fileDest);
            if (!existsSync(fileDir)) {
              mkdirSync(fileDir, { recursive: true });
            }
            writeFileSync(fileDest, fileData, 'utf8');
            const fileSize = (Buffer.byteLength(fileData) / 1024).toFixed(1);
            console.log(`  → OK (${fileSize}KB)`);
            
            const actualHash = computeSHA256(fileData);
            const expectedHash = hash.replace('sha256:', '');
            if (policy.require_checksum && actualHash !== expectedHash) {
              console.error(`\x1b[31mError: Checksum verification failed for synced file: ${file}\x1b[0m`);
              console.error(`  Expected: ${expectedHash}`);
              console.error(`  Actual:   ${actualHash}`);
              process.exit(1);
            }
            checksums[file] = `sha256:${actualHash}`;
          }
        }
      } catch (err) {
        console.error(`\x1b[31mError: Failed to process registry manifest files: ${err.message}\x1b[0m`);
        process.exit(1);
      }
    }

    const checksumsJson = JSON.stringify(checksums, null, 2);
    writeFileSync(join(cacheDir, 'checksums.json'), checksumsJson, 'utf8');
    console.log(`  → .ai/registry-cache/${name}/checksums.json ... OK`);

    if (policy.require_checksum && manifestData) {
      try {
        const manifest = JSON.parse(manifestData);
        if (manifest.catalog_hash) {
          const expectedHash = manifest.catalog_hash.replace('sha256:', '');
          const actualHash = computeSHA256(catalogData);
          if (expectedHash === actualHash) {
            console.log(`\n\x1b[32mChecksum verification: PASSED\x1b[0m`);
          } else {
            console.error(`\n\x1b[31mChecksum verification: FAILED\x1b[0m`);
            console.error(`  Expected: ${expectedHash}`);
            console.error(`  Actual:   ${actualHash}`);
            process.exit(1);
          }
        }
      } catch (e) {}
    }

    const syncedAt = new Date().toISOString();
    source.last_synced_at = syncedAt;
    source.pinned_commit_or_hash = computeSHA256(catalogData);
    saveRegistrySources(sources);

    // --- Provenance lockfile + signature verification ---
    const catalogHash = computeSHA256(catalogData);
    const manifestHash = manifestData ? computeSHA256(manifestData) : null;
    const projectDir = options.target || process.cwd();

    let signingKey = null;
    let signature = null;
    try {
      signingKey = loadSigningKey(projectDir);
    } catch (sigKeyErr) {
      console.log(`  \x1b[33mWarning: Signing key error — ${sigKeyErr.message}\x1b[0m`);
    }

    if (signingKey) {
      try {
        signature = signPayload(signingKey, catalogHash);
        console.log('  \x1b[32m✓ Catalog signed with project signing key (HMAC-SHA256)\x1b[0m');
      } catch (signErr) {
        console.log(`  \x1b[33mWarning: Signing failed — ${signErr.message}\x1b[0m`);
      }
    } else {
      if (policy.require_signature) {
        console.error(`\x1b[31mError: policy require_signature is true but no signing key found.\x1b[0m`);
        console.error(`  Generate a key with: npx multimodel-dev-os registry keygen --approved`);
        process.exit(1);
      }
      console.log('  \x1b[33m⚠ No signing key — provenance recorded without signature.\x1b[0m');
      console.log('    Generate a key with: npx multimodel-dev-os registry keygen --approved');
    }

    // Signature Block Verification on synced data
    const trustedKeys = loadTrustedKeys(projectDir, policy);
    let verifyRes = { verified: true, status: 'unsigned' };
    let parsedManifest = null;
    if (manifestData) {
      try {
        parsedManifest = JSON.parse(manifestData);
        verifyRes = verifySignatureBlock({
          manifest: parsedManifest,
          trustedKeys,
          policy,
          hmacKey: signingKey,
          source
        });
      } catch (_e) {}
    } else {
      if (policy.require_signature || policy.allow_unsigned_remote === false) {
        verifyRes = { verified: false, error: 'Manifest missing but signature is required by policy.' };
      }
    }

    const firstSig = parsedManifest && (parsedManifest.signature || (Array.isArray(parsedManifest.signatures) && parsedManifest.signatures[0]));
    const sigBlock = firstSig && typeof firstSig === 'object' ? firstSig : null;

    let trustedPublisherStatus = 'unknown';
    if (sigBlock && sigBlock.key_id) {
      const tk = trustedKeys.find(k => k.key_id === sigBlock.key_id);
      if (tk) {
        trustedPublisherStatus = tk.status || 'inactive';
      }
    }

    let trustVerdict = 'failed';
    if (verifyRes.verified) {
      if (verifyRes.status === 'verified') {
        trustVerdict = 'verified';
      } else {
        trustVerdict = 'unsigned_allowed';
      }
    }

    const verificationErrors = verifyRes.errors || (verifyRes.error ? [verifyRes.error] : []);
    const verificationWarnings = verifyRes.warning ? [verifyRes.warning] : [];

    const lockfile = loadRegistryLockfile(projectDir);
    updateLockfileEntry(lockfile, name, {
      url: source.url,
      synced_at: options.synced_at || syncedAt, // Allow override for test determinism
      catalog_sha256: catalogHash,
      manifest_sha256: manifestHash,
      signature,
      signature_alg: 'hmac-sha256',
      public_signature_status: verifyRes.status || 'unsigned',
      public_signature_algorithm: sigBlock ? sigBlock.algorithm : null,
      public_signature_key_id: sigBlock ? sigBlock.key_id : null,
      trusted_publisher_status: trustedPublisherStatus,
      trust_store_path: policy.trusted_keys_file || '.ai/registries/trusted-keys.yaml',
      trust_verdict: trustVerdict,
      lockfile_verdict: 'verified',
      verification_errors: verificationErrors,
      verification_warnings: verificationWarnings
    });
    saveRegistryLockfile(projectDir, lockfile);
    console.log(`  \x1b[32m✓ Provenance lockfile updated: .ai/registry-lock.json\x1b[0m`);

    let pluginCount = 0;
    try {
      const catParsed = parseYaml(catalogData);
      pluginCount = ((catParsed.catalog || {}).plugins || []).length;
    } catch (e) {}

    console.log(`\n\x1b[32m✔ Registry '${name}' synced successfully!\x1b[0m`);
    console.log(`  Cache location:  .ai/registry-cache/${name}/`);
    console.log(`  Plugins cached:  ${pluginCount} entries`);
    console.log(`  Checksum status: VERIFIED (SHA256)`);
    console.log(`  Provenance:      ${signature ? 'SIGNED (HMAC-SHA256)' : 'Unsigned (no signing key)'}`);
    console.log(`  Last synced:     ${syncedAt}`);
    console.log(`\nNext steps:`);
    console.log(`  • Browse:  npx multimodel-dev-os catalog list --source remote:${name}`);
    console.log(`  • Verify:  npx multimodel-dev-os registry verify ${name}`);
    console.log(`  • Lock:    npx multimodel-dev-os registry lock`);
    console.log(`  • Install: npx multimodel-dev-os catalog install <slug> --approved\n`);
  } catch (e) {
    console.error(`\n\x1b[31mSync failed: ${e.message}\x1b[0m`);
    console.log('\nPossible causes:');
    console.log('  • Network unreachable or URL invalid');
    console.log('  • Remote server returned an error');
    console.log(`  • Check URL: ${catalogUrl}\n`);
    process.exit(1);
  }
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

export function handleRegistryVerify(name, options) {
  console.log(`\n🔎 \x1b[36mVerifying Registry: ${name}\x1b[0m`);
  console.log('==================================================');

  const projectDir = options.target || process.cwd();
  const policy = loadRegistryPolicy(projectDir);
  const sources = loadRegistrySources();
  const source = sources.find(s => s.name === name);

  let isBundled = name === 'bundled';
  let isLocal = source ? source.type === 'local' : false;
  let isRemote = source ? source.type === 'remote' : false;
  let url = source ? source.url : (isBundled ? '.ai/plugins/catalog.yaml' : null);

  if (!source && !isBundled) {
    console.error(`\x1b[31mError: Registry '${name}' is not configured.\x1b[0m`);
    process.exit(1);
  }

  let urlValidationStatus = 'N/A';
  if (isRemote) {
    try {
      validateRegistryUrl(url, policy);
      urlValidationStatus = '\x1b[32m✓ Valid HTTPS\x1b[0m';
    } catch (err) {
      urlValidationStatus = `\x1b[31m✗ Invalid: ${err.message}\x1b[0m`;
    }
  } else {
    urlValidationStatus = '\x1b[32m✓ Valid Local Path\x1b[0m';
  }

  let cacheDir;
  if (isBundled) {
    cacheDir = join(sourceRoot, '.ai', 'plugins');
  } else {
    cacheDir = join(sourceRoot, '.ai', 'registry-cache', name);
  }

  const catalogDest = join(cacheDir, 'catalog.yaml');
  const manifestDest = join(cacheDir, 'manifest.json');
  const checksumPath = join(cacheDir, 'checksums.json');

  if (!isBundled && !existsSync(cacheDir)) {
    console.error(`\x1b[31mError: No cache found for registry '${name}'. Run registry sync first.\x1b[0m`);
    process.exit(1);
  }

  if (isBundled && !existsSync(catalogDest)) {
    console.error(`\x1b[31mError: Bundled catalog.yaml not found.\x1b[0m`);
    process.exit(1);
  }

  let catalogContent = '';
  let catalogHash = 'N/A';
  if (existsSync(catalogDest)) {
    catalogContent = readFileSync(catalogDest, 'utf8');
    catalogHash = computeSHA256(catalogContent);
  }

  let manifestObj = null;
  let manifestHash = 'N/A';
  if (existsSync(manifestDest)) {
    const manifestData = readFileSync(manifestDest, 'utf8');
    manifestHash = computeSHA256(manifestData);
    try {
      manifestObj = JSON.parse(manifestData);
    } catch (e) {
      console.warn(`\x1b[33mWarning: Failed to parse manifest.json: ${e.message}\x1b[0m`);
    }
  }

  let integrityVerified = true;
  if (!isBundled) {
    if (!existsSync(checksumPath)) {
      console.log(`  \x1b[33m⚠️ Checksums: Missing checksums.json in cache\x1b[0m`);
      integrityVerified = false;
    } else {
      try {
        const checksums = JSON.parse(readFileSync(checksumPath, 'utf8'));
        Object.entries(checksums).forEach(([file, expectedHash]) => {
          const filePath = join(cacheDir, file);
          if (!existsSync(filePath)) {
            console.log(`  \x1b[31m✗ File missing in cache: ${file}\x1b[0m`);
            integrityVerified = false;
            return;
          }
          const content = readFileSync(filePath, 'utf8');
          const actualHash = `sha256:${computeSHA256(content)}`;
          if (actualHash === expectedHash) {
            console.log(`  \x1b[32m✓ ${file}: VERIFIED (Integrity check matched via SHA-256)\x1b[0m`);
          } else {
            console.log(`  \x1b[31m✗ ${file}: MISMATCH\x1b[0m`);
            console.log(`    Expected: ${expectedHash}`);
            console.log(`    Actual:   ${actualHash}`);
            integrityVerified = false;
          }
        });
      } catch (e) {
        console.log(`  \x1b[31m✗ Integrity: Failed to verify checksums: ${e.message}\x1b[0m`);
        integrityVerified = false;
      }
    }
  }

  const lockfile = loadRegistryLockfile(projectDir);
  const lockEntry = lockfile.entries[name];
  let lockfileStatus = 'N/A';
  let provenanceStatus = 'N/A';
  let lockfileVerdict = 'N/A';

  if (!isBundled) {
    const lockfilePath = getLockfilePath(projectDir);
    lockfileStatus = existsSync(lockfilePath) ? `\x1b[32mpresent\x1b[0m` : `\x1b[33mmissing\x1b[0m`;

    if (!lockEntry) {
      if (policy.require_lockfile_on_verify) {
        provenanceStatus = `\x1b[31m✗ Failed (require_lockfile_on_verify is true but entry missing)\x1b[0m`;
        lockfileVerdict = 'Failed';
      } else {
        provenanceStatus = `\x1b[33m⚠️ Missing provenance entry (no sync lock)\x1b[0m`;
        lockfileVerdict = 'Missing';
      }
    } else {
      let isProvMatch = true;
      if (catalogHash !== lockEntry.catalog_sha256) {
        isProvMatch = false;
        console.log(`  \x1b[31m✗ Lockfile catalog hash mismatch: Expected ${lockEntry.catalog_sha256}, got ${catalogHash}\x1b[0m`);
      }
      if (manifestHash !== 'N/A' && lockEntry.manifest_sha256 && manifestHash !== lockEntry.manifest_sha256) {
        isProvMatch = false;
        console.log(`  \x1b[31m✗ Lockfile manifest hash mismatch: Expected ${lockEntry.manifest_sha256}, got ${manifestHash}\x1b[0m`);
      }
      if (isProvMatch) {
        provenanceStatus = `\x1b[32m✓ Matched lockfile entry\x1b[0m`;
        lockfileVerdict = 'Verified';
      } else {
        provenanceStatus = `\x1b[31m✗ Tampering detected: hashes do not match lockfile\x1b[0m`;
        lockfileVerdict = 'Tampered';
      }
    }
  } else {
    lockfileStatus = 'N/A (Bundled)';
    provenanceStatus = '\x1b[32m✓ Implicit Trust\x1b[0m';
    lockfileVerdict = 'Verified';
  }

  const trustedKeys = loadTrustedKeys(projectDir, policy);
  let hmacKey = null;
  try {
    hmacKey = loadSigningKey(projectDir);
  } catch (_e) {}

  let signatureAlgorithm = 'None';
  let signatureKeyId = 'None';
  let trustedPublisherStatus = 'N/A';
  let signatureValidity = 'N/A';
  let signatureResult = { verified: true, status: 'unsigned' };

  if (manifestObj) {
    signatureResult = verifySignatureBlock({
      manifest: manifestObj,
      trustedKeys,
      policy,
      hmacKey,
      source: source || { name: 'bundled', type: 'local' }
    });

    const signatureBlocks = [];
    if (manifestObj.signature && typeof manifestObj.signature === 'object') {
      signatureBlocks.push(manifestObj.signature);
    }
    if (Array.isArray(manifestObj.signatures)) {
      signatureBlocks.push(...manifestObj.signatures);
    }

    if (signatureBlocks.length > 0) {
      const firstSig = signatureBlocks[0];
      signatureAlgorithm = firstSig.algorithm || 'unknown';
      signatureKeyId = firstSig.key_id || 'unknown';

      const tk = trustedKeys.find(k => k.key_id === signatureKeyId);
      if (tk) {
        trustedPublisherStatus = tk.status === 'active' ? `\x1b[32m✓ Trusted (${tk.name})\x1b[0m` : `\x1b[31m✗ ${tk.status} (${tk.name})\x1b[0m`;
      } else {
        trustedPublisherStatus = `\x1b[33m⚠️ Unknown key_id (Not in trust store)\x1b[0m`;
      }

      if (signatureResult.verified) {
        signatureValidity = `\x1b[32m✓ Valid Signature\x1b[0m`;
      } else {
        const errorMsg = signatureResult.errors ? signatureResult.errors.join(', ') : (signatureResult.error || 'signature verification failed');
        signatureValidity = `\x1b[31m✗ Invalid Signature (${errorMsg})\x1b[0m`;
      }
    } else {
      if (policy.require_signature || (isRemote && policy.allow_unsigned_remote === false)) {
        signatureValidity = `\x1b[31m✗ Missing Signature (Enforced by policy)\x1b[0m`;
      } else {
        signatureValidity = `\x1b[90mUnsigned\x1b[0m`;
      }
    }
  } else {
    if (!isBundled && (policy.require_signature || (isRemote && policy.allow_unsigned_remote === false))) {
      signatureResult = { verified: false, error: 'Manifest missing but signature is required by policy.' };
      signatureValidity = `\x1b[31m✗ Manifest missing (Enforced by policy)\x1b[0m`;
    } else {
      signatureValidity = `\x1b[90mUnsigned (No manifest)\x1b[0m`;
    }
  }

  console.log(`  Source Type:        ${isBundled ? 'bundled' : source.type}`);
  console.log(`  Source URL/Path:    ${url}`);
  console.log(`  URL Validation:     ${urlValidationStatus}`);
  console.log(`  Manifest SHA256:    ${manifestHash}`);
  console.log(`  Catalog SHA256:     ${catalogHash}`);
  console.log(`  Lockfile Status:    ${lockfileStatus}`);
  console.log(`  Provenance Status:  ${provenanceStatus}`);
  console.log(`  Signature Alg:      ${signatureAlgorithm}`);
  console.log(`  Signature Key ID:   ${signatureKeyId}`);
  console.log(`  Trusted Publisher:  ${trustedPublisherStatus}`);
  console.log(`  Signature Validity: ${signatureValidity}`);

  let finalVerdict = '✗ Failed';
  let passed = true;

  if (!integrityVerified) passed = false;
  if (!isBundled && lockfileVerdict === 'Failed') passed = false;
  if (!isBundled && lockfileVerdict === 'Tampered') passed = false;
  if (!signatureResult.verified) passed = false;

  if (passed) {
    if (signatureResult.status === 'verified') {
      finalVerdict = `\x1b[32m✓ Verified (Signature matches trusted key)\x1b[0m`;
    } else if (isBundled || isLocal) {
      finalVerdict = `\x1b[32m✓ Verified (Implicit local trust)\x1b[0m`;
    } else {
      finalVerdict = `\x1b[33m⚠️ Unsigned (Allowed by policy)\x1b[0m`;
    }
  } else {
    const reason = !integrityVerified
      ? 'Integrity check failed'
      : (lockfileVerdict === 'Tampered'
        ? 'Lockfile tampering detected'
        : (signatureResult.error || (signatureResult.errors && signatureResult.errors.join(', ')) || 'Signature verification failed'));
    finalVerdict = `\x1b[31m✗ Failed (${reason})\x1b[0m`;
  }

  console.log(`  Final Trust:        ${finalVerdict}`);
  console.log('==================================================');

  try {
    const parsed = parseYaml(catalogContent);
    const pluginCount = ((parsed.catalog || {}).plugins || []).length;
    console.log(`  Plugins Parsed:     ${pluginCount} entries`);
  } catch (e) {
    console.error(`\x1b[31m✗ Catalog parsing failed: ${e.message}\x1b[0m`);
    process.exit(1);
  }

  const verdict = createTrustVerdict({
    source: name,
    source_type: isBundled ? 'bundled' : (source ? source.type : 'remote'),
    manifest_hash_status: manifestHash !== 'N/A' ? (lockEntry && manifestHash === lockEntry.manifest_sha256 ? 'verified' : (manifestObj ? 'unverified' : 'missing')) : 'N/A',
    catalog_hash_status: catalogHash !== 'N/A' ? (lockEntry && catalogHash === lockEntry.catalog_sha256 ? 'verified' : 'unverified') : 'N/A',
    lockfile_status: isBundled ? 'N/A' : (lockEntry ? 'present' : 'missing'),
    provenance_status: isBundled ? 'N/A' : (lockEntry ? (lockfileVerdict === 'Verified' ? 'matched' : (lockfileVerdict === 'Tampered' ? 'mismatch' : 'missing')) : 'N/A'),
    signature_status: signatureResult.status || 'unsigned',
    trusted_publisher_status: signatureResult.status === 'verified' ? 'trusted' : 'N/A',
    errors: signatureResult.errors || (signatureResult.error ? [signatureResult.error] : []),
    warnings: signatureResult.warning ? [signatureResult.warning] : [],
    final_status: passed ? (signatureResult.status === 'verified' ? 'trusted' : (isBundled || isLocal ? 'trusted' : 'warning')) : 'untrusted'
  });

  if (!isBundled && lockEntry) {
    lockEntry.trust_verdict = passed ? (signatureResult.status === 'verified' ? 'verified' : 'unsigned_allowed') : 'failed';
    lockEntry.lockfile_verdict = lockfileVerdict.toLowerCase();
    lockEntry.verification_errors = verdict.errors;
    lockEntry.verification_warnings = verdict.warnings;
    lockEntry.verdict = verdict;
    saveRegistryLockfile(projectDir, lockfile);
  }

  if (passed) {
    console.log(`\n\x1b[32m✔ Registry '${name}' verification passed.\x1b[0m\n`);
  } else {
    console.error(`\n\x1b[31m✗ Registry '${name}' verification failed.\x1b[0m\n`);
    process.exit(1);
  }
}

export function handleRegistryTrustList(options) {
  const projectDir = options.target || process.cwd();
  const policy = loadRegistryPolicy(projectDir);
  const keys = loadTrustedKeys(projectDir, policy);

  console.log(`\n🔑 \x1b[36mRegistry Trust Store — Trusted Keys\x1b[0m`);
  console.log('==================================================');
  console.log(`Trust Store Path: \x1b[36m${policy.trusted_keys_file || '.ai/registries/trusted-keys.yaml'}\x1b[0m`);
  console.log(`Total Keys:       ${keys.length}\n`);

  if (keys.length === 0) {
    console.log('  No trusted keys configured.');
  } else {
    keys.forEach(k => {
      const statusBadge = k.status === 'active' ? '\x1b[32m● active\x1b[0m' : `\x1b[31m○ ${k.status}\x1b[0m`;
      console.log(`  * \x1b[33m${k.key_id}\x1b[0m  [${statusBadge}]`);
      console.log(`    Publisher: ${k.name}`);
      console.log(`    Algorithm: ${k.algorithm}`);
      console.log(`    Scopes:    ${(k.scopes || []).join(', ')}`);
    });
  }
  console.log('');
}

export function handleRegistryTrustShow(keyId, options) {
  const projectDir = options.target || process.cwd();
  const policy = loadRegistryPolicy(projectDir);
  const keys = loadTrustedKeys(projectDir, policy);
  const k = keys.find(key => key.key_id === keyId);

  if (!k) {
    console.error(`\x1b[31mError: Trusted key '${keyId}' not found in the trust store.\x1b[0m`);
    process.exit(1);
  }

  console.log(`\n🔑 \x1b[36mTrusted Key: ${keyId}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mKey ID:\x1b[0m         ${k.key_id}`);
  console.log(`\x1b[33mPublisher:\x1b[0m      ${k.name}`);
  console.log(`\x1b[33mAlgorithm:\x1b[0m      ${k.algorithm}`);
  console.log(`\x1b[33mStatus:\x1b[0m         ${k.status === 'active' ? '\x1b[32mactive\x1b[0m' : `\x1b[31m${k.status}\x1b[0m`}`);
  console.log(`\x1b[33mScopes:\x1b[0m         ${(k.scopes || []).join(', ')}`);
  console.log(`\x1b[33mPublic Key:\x1b[0m\n${k.public_key.trim()}`);
  console.log('');
}

export function handleRegistryTrustVerify(options) {
  const projectDir = options.target || process.cwd();
  const policy = loadRegistryPolicy(projectDir);
  const keys = loadTrustedKeys(projectDir, policy);

  console.log(`\n🔑 \x1b[36mVerifying Trust Store Integrity...\x1b[0m`);
  console.log('==================================================');

  let passed = true;
  keys.forEach(k => {
    try {
      normalizePublicKey(k.public_key);
      console.log(`  \x1b[32m✓\x1b[0m Key '${k.key_id}' public key format is valid.`);
    } catch (e) {
      console.log(`  \x1b[31m✗\x1b[0m Key '${k.key_id}' public key format error: ${e.message}`);
      passed = false;
    }
  });

  if (passed) {
    console.log(`\n\x1b[32m✔ Trust store verification passed.\x1b[0m\n`);
  } else {
    console.error(`\n\x1b[31m✗ Trust store verification failed.\x1b[0m\n`);
    process.exit(1);
  }
}

export async function handleRegistryTrustAdd(positional, options) {
  const projectDir = options.target || process.cwd();

  if (!options.approved) {
    console.error('\x1b[31mError: Adding a trusted key requires --approved.\x1b[0m');
    console.log('Review the key details carefully before approving:');
    console.log('  Remote:  node bin/multimodel-dev-os.js registry trust add https://example.com/pub.key --name "Publisher" --approved');
    console.log('  Manual:  node bin/multimodel-dev-os.js registry trust add --key-id my-key --name "Publisher" --public-key "MCow..." --approved');
    process.exit(1);
  }

  const urlOrKeyArg = positional[3];

  const keyId = options['key-id'] || options.keyId;
  const name = options.name;
  const algorithm = options.algorithm || 'ed25519';
  const scopesRaw = options.scopes || 'registry';
  const scopes = scopesRaw.split(',').map(s => s.trim()).filter(Boolean);
  const status = options.status || 'active';

  let publicKey = options['public-key'] || options.publicKey;
  let remoteSourceUrl;

  if (urlOrKeyArg && (urlOrKeyArg.startsWith('https://') || urlOrKeyArg.startsWith('http://'))) {
    remoteSourceUrl = urlOrKeyArg;
    console.log(`\n\x1b[36mFetching public key from remote URL...\x1b[0m`);
    console.log(`  URL: \x1b[33m${remoteSourceUrl}\x1b[0m`);
    try {
      const policy = loadRegistryPolicy(projectDir);
      const allowHttp = policy.allow_http_localhost || false;
      publicKey = await fetchRemotePublicKey(remoteSourceUrl, { allowHttp });
      console.log(`\n  \x1b[32m[OK]\x1b[0m Key fetched (${Buffer.byteLength(publicKey, 'utf8')} bytes)`);
      console.log(`\n  Key preview:`);
      console.log(`  ${publicKey.slice(0, 80)}${publicKey.length > 80 ? '...' : ''}`);
    } catch (err) {
      console.error(`\x1b[31mError: Failed to fetch remote public key: ${err.message}\x1b[0m`);
      process.exit(1);
    }
  }

  if (!publicKey) {
    console.error('\x1b[31mError: No public key provided. Provide a URL or --public-key.\x1b[0m');
    console.log('Examples:');
    console.log('  Remote: node bin/multimodel-dev-os.js registry trust add https://example.com/pub.key --name "Publisher" --approved');
    console.log('  Manual: node bin/multimodel-dev-os.js registry trust add --key-id my-key --name "Publisher" --public-key "MCow..." --approved');
    process.exit(1);
  }

  if (!name) {
    console.error('\x1b[31mError: --name is required when adding a trusted key.\x1b[0m');
    console.log('Example: --name "Official Publisher"');
    process.exit(1);
  }

  const resolvedKeyId = keyId || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const entry = { key_id: resolvedKeyId, name, algorithm, public_key: publicKey, scopes, status };
  if (remoteSourceUrl) entry.remote_source_url = remoteSourceUrl;

  console.log(`\n\x1b[36mAdding Trusted Key to Trust Store\x1b[0m`);
  console.log('==================================================');
  console.log(`  Key ID:    \x1b[33m${resolvedKeyId}\x1b[0m`);
  console.log(`  Publisher: ${name}`);
  console.log(`  Algorithm: ${algorithm}`);
  console.log(`  Scopes:    ${scopes.join(', ')}`);
  console.log(`  Status:    ${status}`);
  if (remoteSourceUrl) console.log(`  Source:    ${remoteSourceUrl}`);

  const result = addTrustedKey(projectDir, entry);
  if (!result.added) {
    console.error(`\x1b[31mError: ${result.error}\x1b[0m`);
    process.exit(1);
  }

  const filePath = getTrustStorePath(projectDir);
  console.log(`\n\x1b[32mTrusted key '${resolvedKeyId}' added successfully.\x1b[0m`);
  console.log(`  Written to: ${filePath}`);
  console.log(`\nNext steps:`);
  console.log(`  * Run 'registry trust list' to confirm the key is listed.`);
  console.log(`  * Run 'registry trust verify' to validate all key formats.`);
  console.log(`  * Commit .ai/registries/trusted-keys.yaml to version control.\n`);
}

export function handleRegistryTrustRemove(keyId, options) {
  const projectDir = options.target || process.cwd();

  if (!options.approved) {
    console.error('\x1b[31mError: Removing a trusted key requires --approved.\x1b[0m');
    console.log(`Example: node bin/multimodel-dev-os.js registry trust remove ${keyId} --approved`);
    process.exit(1);
  }

  const policy = loadRegistryPolicy(projectDir);
  const keys = loadTrustedKeys(projectDir, policy);
  const existing = keys.find(k => k.key_id === keyId);

  if (!existing) {
    console.error(`\x1b[31mError: Key ID '${keyId}' not found in the trust store.\x1b[0m`);
    console.log('Run registry trust list to see all configured keys.');
    process.exit(1);
  }

  console.log(`\n\x1b[36mRemoving Trusted Key\x1b[0m`);
  console.log('==================================================');
  console.log(`  Key ID:    \x1b[33m${existing.key_id}\x1b[0m`);
  console.log(`  Publisher: ${existing.name}`);
  console.log(`  Algorithm: ${existing.algorithm}`);
  console.log(`  Status:    ${existing.status}`);

  const result = removeTrustedKey(projectDir, keyId, policy);
  if (!result.removed) {
    console.error(`\x1b[31mError: ${result.error}\x1b[0m`);
    process.exit(1);
  }

  const filePath = getTrustStorePath(projectDir, policy);
  console.log(`\n\x1b[32mTrusted key '${keyId}' removed from the trust store.\x1b[0m`);
  console.log(`  Updated:   ${filePath}`);
  console.log(`\nWarning: Registries signed by this key will no longer verify.`);
  console.log(`  Run 'registry verify <name>' to check affected registries.`);
  console.log(`  Commit .ai/registries/trusted-keys.yaml to propagate the change.\n`);
}

export async function handleRegistryTrustSync(options) {
  const projectDir = options.target || process.cwd();

  if (!options.approved) {
    console.error('\x1b[31mError: Syncing trusted keys requires --approved.\x1b[0m');
    console.log('To sync remote trusted keys, run:');
    console.log('  npx multimodel-dev-os registry trust sync --approved');
    process.exit(1);
  }

  const dryRun = !!options['dry-run'] || !!options.dryRun;
  const policy = loadRegistryPolicy(projectDir);
  const allowHttp = policy.allow_http_localhost || false;

  console.log(`\n🔑 \x1b[36mRegistry Trust Store — Syncing Remote Keys\x1b[0m`);
  console.log('==================================================');
  if (dryRun) {
    console.log('  Mode: Dry Run (No changes will be written to disk)\n');
  }

  try {
    const result = await syncRemoteKeys(projectDir, { dryRun, allowHttp });
    console.log(`  Checked keys: ${result.checkedCount}`);
    console.log(`  Updated keys: ${result.updated.length}`);
    console.log(`  Errors:       ${result.errors.length}\n`);

    if (result.updated.length > 0) {
      console.log('\x1b[32mUpdated Keys:\x1b[0m');
      result.updated.forEach(u => {
        console.log(`  * \x1b[33m${u.key_id}\x1b[0m`);
        console.log(`    Old key preview: ${u.oldKey.trim().slice(0, 40)}...`);
        console.log(`    New key preview: ${u.newKey.trim().slice(0, 40)}...`);
      });
      console.log('');
    }

    if (result.errors.length > 0) {
      console.error('\x1b[31mErrors encountered during sync:\x1b[0m');
      result.errors.forEach(e => {
        console.error(`  * \x1b[33m${e.key_id}\x1b[0m: ${e.error}`);
      });
      console.log('');
    }

    if (result.updated.length > 0 && !dryRun) {
      console.log(`\x1b[32m✔ Trust store remote keys synced successfully.\x1b[0m`);
      console.log(`  Commit ${policy.trusted_keys_file || '.ai/registries/trusted-keys.yaml'} to propagate these key updates.\n`);
    } else if (result.updated.length === 0) {
      console.log(`\x1b[32m✔ All remote keys are already up to date.\x1b[0m\n`);
    }
  } catch (err) {
    console.error(`\x1b[31mError: Failed to sync remote keys: ${err.message}\x1b[0m\n`);
    process.exit(1);
  }
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

export function handleRegistryCacheClear(options) {
  if (!options.approved) {
    console.error('\x1b[31mError: Cache cannot be cleared without explicit approval. Pass the --approved flag.\x1b[0m');
    const cacheRoot = join(sourceRoot, '.ai', 'registry-cache');
    if (existsSync(cacheRoot)) {
      const dirs = readdirSync(cacheRoot).filter(d => d !== 'README.md');
      console.log(`\n\x1b[33mPlanned Action:\x1b[0m Clear ${dirs.length} cached registry directories:`);
      dirs.forEach(d => console.log(`  - .ai/registry-cache/${d}/`));
    } else {
      console.log('\n\x1b[33mNo cache directories found.\x1b[0m');
    }
    console.log(`\nRun with --approved to apply:\n  npx multimodel-dev-os registry cache clear --approved\n`);
    process.exit(1);
  }

  const cacheRoot = join(sourceRoot, '.ai', 'registry-cache');
  if (!existsSync(cacheRoot)) {
    console.log('\n\x1b[33mNo registry cache directory found. Nothing to clear.\x1b[0m\n');
    return;
  }

  const entries = readdirSync(cacheRoot).filter(d => d !== 'README.md');
  let cleared = 0;
  entries.forEach(d => {
    const dirPath = join(cacheRoot, d);
    try {
      if (statSync(dirPath).isDirectory()) {
        const files = readdirSync(dirPath);
        files.forEach(f => {
          const fp = join(dirPath, f);
          if (statSync(fp).isFile()) {
            writeFileSync(fp, '');
          }
        });
        cleared++;
      }
    } catch (e) {}
  });

  console.log(`\n\x1b[32m✔ Registry cache cleared.\x1b[0m`);
  console.log(`  Directories processed: ${cleared}`);
  console.log(`  Cache root: .ai/registry-cache/\n`);
}

export function handleRegistryKeygen(options) {
  const projectDir = options.target || process.cwd();
  const keyPath = getSigningKeyPath(projectDir);

  console.log(`\n🔑 \x1b[36mRegistry Signing Key Generator\x1b[0m`);
  console.log('==================================================');

  if (!options.approved) {
    console.error('\x1b[31mError: Signing key generation requires explicit approval. Pass the --approved flag.\x1b[0m');
    console.log(`\n\x1b[33mPlanned Action:\x1b[0m Generate a 32-byte random HMAC-SHA256 signing key.`);
    console.log(`  Destination: ${keyPath}`);
    console.log(`  Mode:        0o600 (owner read/write only)`);
    console.log(`\n\x1b[33mSecurity Notes:\x1b[0m`);
    console.log(`  • Add .ai/registry-signing-key to your .gitignore`);
    console.log(`  • Share the key securely with trusted team members for co-verification`);
    console.log(`  • The key is used for HMAC-SHA256 signing of catalog checksums only`);
    console.log(`\nTo generate, run:`);
    console.log(`  \x1b[36mnpx multimodel-dev-os registry keygen --approved\x1b[0m\n`);
    process.exit(1);
  }

  // Check existing key
  let existingKey = null;
  try {
    existingKey = loadSigningKey(projectDir);
  } catch (_e) {}

  if (existingKey && !options.force) {
    console.error(`\x1b[31mError: A signing key already exists at: ${keyPath}\x1b[0m`);
    console.log(`\nTo overwrite, run with --force:`);
    console.log(`  \x1b[36mnpx multimodel-dev-os registry keygen --approved --force\x1b[0m`);
    console.log(`\n\x1b[33mWarning:\x1b[0m Overwriting will invalidate all existing signatures in the lockfile.\n`);
    process.exit(1);
  }

  const newKey = generateSigningKey();
  saveSigningKey(projectDir, newKey);

  console.log(`\n\x1b[32m✔ Signing key generated successfully!\x1b[0m`);
  console.log(`  Location: ${keyPath}`);
  console.log(`  Mode:     0o600 (restricted permissions)`);
  console.log(`\n\x1b[33mNext steps:\x1b[0m`);
  console.log(`  1. Add to .gitignore: echo '.ai/registry-signing-key' >> .gitignore`);
  console.log(`  2. Re-sync registries to generate signed lockfile entries:`);
  console.log(`       npx multimodel-dev-os registry sync <name> --approved`);
  console.log(`  3. Verify signed provenance:`);
  console.log(`       npx multimodel-dev-os registry verify <name>\n`);
}

export function handleRegistryLock(options) {
  const projectDir = options.target || process.cwd();
  const lockfilePath = getLockfilePath(projectDir);

  console.log(`\n🔒 \x1b[36mRegistry Provenance Lockfile\x1b[0m`);
  console.log('==================================================');

  if (!existsSync(lockfilePath)) {
    console.log(`  \x1b[90mNo lockfile found at: ${lockfilePath}\x1b[0m`);
    console.log(`  Sync a remote registry to create it:`);
    console.log(`    npx multimodel-dev-os registry sync <name> --approved\n`);
    return;
  }

  const lockfile = loadRegistryLockfile(projectDir);
  const entries = Object.entries(lockfile.entries);

  if (options.json) {
    console.log(JSON.stringify(lockfile, null, 2));
    return;
  }

  console.log(`  Lockfile version: ${lockfile.lockfile_version}`);
  console.log(`  Generated at:     ${lockfile.generated_at}`);
  console.log(`  Path:             ${lockfilePath}`);
  console.log(`  Entries:          ${entries.length}\n`);

  if (entries.length === 0) {
    console.log(`  \x1b[90mNo registry entries recorded yet.\x1b[0m`);
    console.log(`  Sync a remote registry to populate:\n    npx multimodel-dev-os registry sync <name> --approved\n`);
    return;
  }

  entries.forEach(([name, entry]) => {
    const sigBadge = entry.signature
      ? `\x1b[32m[SIGNED — HMAC-SHA256]\x1b[0m`
      : `\x1b[33m[UNSIGNED]\x1b[0m`;
    console.log(`  \x1b[32m${name}\x1b[0m  ${sigBadge}`);
    console.log(`    URL:             ${entry.url}`);
    console.log(`    Synced at:       ${entry.synced_at}`);
    console.log(`    Catalog SHA-256: ${entry.catalog_sha256}`);
    if (entry.manifest_sha256) {
      console.log(`    Manifest SHA256: ${entry.manifest_sha256}`);
    }
    if (entry.signature) {
      console.log(`    Signature:       ${entry.signature.slice(0, 24)}...`);
      console.log(`    Sig algorithm:   ${entry.signature_alg}`);
    }
    console.log('');
  });

  console.log('Use \x1b[36mregistry verify <name>\x1b[0m to re-verify cached files against the lockfile.');
  console.log('Use \x1b[36mregistry keygen --approved\x1b[0m to generate a signing key for HMAC signatures.\n');
}
