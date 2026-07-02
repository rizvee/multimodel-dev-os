import { loadRegistryPolicy } from '../../../core/policy.js';
import { loadTrustedKeys, addTrustedKey, removeTrustedKey, fetchRemotePublicKey, getTrustStorePath, syncRemoteKeys } from '../../../registry/trust-store.js';
import { normalizePublicKey } from '../../../registry/signing.js';

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
