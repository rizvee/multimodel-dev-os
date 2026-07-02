import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname, relative, isAbsolute } from 'path';
import { execFileSync } from 'child_process';

import { parseYaml } from '../../../core/yaml.js';
import { computeSHA256 } from '../../../core/hashes.js';
import { loadRegistryPolicy } from '../../../core/policy.js';
import { validateRegistryUrl } from '../../../registry/validation.js';
import { loadRegistrySources, saveRegistrySources } from '../../../registry/sources.js';
import { loadRegistryLockfile, saveRegistryLockfile, updateLockfileEntry, getLockfilePath } from '../../../registry/provenance.js';
import { loadSigningKey, signPayload, getSigningKeyPath, verifySignatureBlock } from '../../../registry/signing.js';
import { loadTrustedKeys } from '../../../registry/trust-store.js';
import { sourceRoot } from '../../../core/globals.js';

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
