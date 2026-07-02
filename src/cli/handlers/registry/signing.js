import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { parseYaml } from '../../../core/yaml.js';
import { computeSHA256 } from '../../../core/hashes.js';
import { loadRegistryPolicy } from '../../../core/policy.js';
import { validateRegistryUrl } from '../../../registry/validation.js';
import { loadRegistrySources } from '../../../registry/sources.js';
import { loadRegistryLockfile, saveRegistryLockfile, getLockfilePath } from '../../../registry/provenance.js';
import { loadSigningKey, generateSigningKey, saveSigningKey, getSigningKeyPath, verifySignatureBlock } from '../../../registry/signing.js';
import { loadTrustedKeys } from '../../../registry/trust-store.js';
import { createTrustVerdict } from '../../../registry/verdict.js';
import { sourceRoot } from '../../../core/globals.js';

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
