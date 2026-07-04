import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { projectRoot, stats, RED, GREEN, NC } from './utils.js';

export function checkSecurityHygiene() {
  console.log('\nRegistry Signing & Provenance Checks:');

  // 1. Check .gitignore contains registry-signing-key
  try {
    const gitignoreContent = readFileSync(join(projectRoot, '.gitignore'), 'utf8');
    if (gitignoreContent.includes('registry-signing-key')) {
      console.log(`  ${GREEN}✓${NC} .gitignore includes registry-signing-key pattern`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} .gitignore is missing the registry-signing-key entry (secrets must be gitignored)`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to read .gitignore: ${e.message}`);
    stats.fail++;
  }

  // 2. Check provenance.js exports the expected API surface
  try {
    const provenanceSrc = readFileSync(join(projectRoot, 'src', 'registry', 'provenance.js'), 'utf8');
    const hasLoadLockfile = provenanceSrc.includes('export function loadRegistryLockfile');
    const hasSaveLockfile = provenanceSrc.includes('export function saveRegistryLockfile');
    const hasUpdateEntry = provenanceSrc.includes('export function updateLockfileEntry');
    const hasGetPath = provenanceSrc.includes('export function getLockfilePath');
    if (hasLoadLockfile && hasSaveLockfile && hasUpdateEntry && hasGetPath) {
      console.log(`  ${GREEN}✓${NC} src/registry/provenance.js exports complete API (load/save/update/getPath)`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} src/registry/provenance.js is missing expected exports`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to check provenance.js: ${e.message}`);
    stats.fail++;
  }

  // 3. Check signing.js exports the expected API surface
  try {
    const signingSrc = readFileSync(join(projectRoot, 'src', 'registry', 'signing.js'), 'utf8');
    const hasLoadKey = signingSrc.includes('export function loadSigningKey');
    const hasGenKey = signingSrc.includes('export function generateSigningKey');
    const hasSaveKey = signingSrc.includes('export function saveSigningKey');
    const hasSign = signingSrc.includes('export function signPayload');
    const hasVerify = signingSrc.includes('export function verifySignature');
    const hasTimingSafe = signingSrc.includes('timingSafeEqual');
    const hasEdKeygen = signingSrc.includes('export function generateEd25519KeyPair');
    const hasEdSign = signingSrc.includes('export function signEd25519Payload');
    const hasEdVerify = signingSrc.includes('export function verifyEd25519Payload');
    const hasSigBlockVerify = signingSrc.includes('export function verifySignatureBlock');
    
    if (hasLoadKey && hasGenKey && hasSaveKey && hasSign && hasVerify && hasTimingSafe && hasEdKeygen && hasEdSign && hasEdVerify && hasSigBlockVerify) {
      console.log(`  ${GREEN}✓${NC} src/registry/signing.js exports complete API (HMAC + Ed25519)`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} src/registry/signing.js is missing expected exports`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to check signing.js: ${e.message}`);
    stats.fail++;
  }

  // 4. Check trust-store.js exports expected API surface
  try {
    const trustSrc = readFileSync(join(projectRoot, 'src', 'registry', 'trust-store.js'), 'utf8');
    const hasLoadTrustedKeys = trustSrc.includes('export function loadTrustedKeys');
    const hasGetPath = trustSrc.includes('export function getTrustStorePath');
    const hasSerialize = trustSrc.includes('export function serializeTrustedKeys');
    const hasAdd = trustSrc.includes('export function addTrustedKey');
    const hasRemove = trustSrc.includes('export function removeTrustedKey');
    const hasFetch = trustSrc.includes('export function fetchRemotePublicKey');
    
    if (hasLoadTrustedKeys && hasGetPath && hasSerialize && hasAdd && hasRemove && hasFetch) {
      console.log(`  ${GREEN}✓${NC} src/registry/trust-store.js exports complete API (load/get/serialize/add/remove/fetch)`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} src/registry/trust-store.js is missing expected exports`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to check trust-store.js: ${e.message}`);
    stats.fail++;
  }

  // 5. Check main.js imports the new modules
  try {
    const mainSrc = readFileSync(join(projectRoot, 'src', 'cli', 'main.js'), 'utf8');
    const hasProvenanceImport = mainSrc.includes("from '../registry/provenance.js'");
    const hasSigningImport = mainSrc.includes("from '../registry/signing.js'");
    const hasTrustImport = mainSrc.includes("from '../registry/trust-store.js'");
    const hasKeygenHandler = mainSrc.includes('handleRegistryKeygen');
    const hasLockHandler = mainSrc.includes('handleRegistryLock');
    const hasTrustHandler = mainSrc.includes('handleRegistryTrustList');
    if (hasProvenanceImport && hasSigningImport && hasTrustImport && hasKeygenHandler && hasLockHandler && hasTrustHandler) {
      console.log(`  ${GREEN}✓${NC} src/cli/main.js imports provenance/signing/trust-store and registers handlers`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} src/cli/main.js is missing required imports or handlers`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to check main.js integrations: ${e.message}`);
    stats.fail++;
  }

  // 6. Check that policy.js has the new fields in defaults
  try {
    const policySrc = readFileSync(join(projectRoot, 'src', 'core', 'policy.js'), 'utf8');
    const hasLockfileField = policySrc.includes('require_lockfile_on_verify');
    const hasUnsignedLocal = policySrc.includes('allow_unsigned_local');
    const hasUnsignedBundled = policySrc.includes('allow_unsigned_bundled');
    const hasUnsignedRemote = policySrc.includes('allow_unsigned_remote');
    const hasTrustedKeysFile = policySrc.includes('trusted_keys_file');
    const hasAllowedAlgs = policySrc.includes('allowed_signature_algorithms');
    const hasRequireTrustedPublisher = policySrc.includes('require_trusted_publisher');
    const hasProvenanceRequired = policySrc.includes('provenance_required');
    
    if (hasLockfileField && hasUnsignedLocal && hasUnsignedBundled && hasUnsignedRemote && hasTrustedKeysFile && hasAllowedAlgs && hasRequireTrustedPublisher && hasProvenanceRequired) {
      console.log(`  ${GREEN}✓${NC} src/core/policy.js includes all registry signing policy defaults`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} src/core/policy.js is missing required policy defaults`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to check policy.js: ${e.message}`);
    stats.fail++;
  }

  // 7. Verify that no private keys are committed in main directories (like .ai/)
  try {
    const rootKeyFile = '.ai/registry-signing-key';
    if (existsSync(join(projectRoot, rootKeyFile))) {
      console.error(`  ${RED}✗${NC} Private signing key ${rootKeyFile} should not be committed!`);
      stats.fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} No private registry-signing-key found in codebase root`);
      stats.pass++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to check private key existence: ${e.message}`);
    stats.fail++;
  }

  // 8. Verify that the threat model document has a standard threat modeling structure
  try {
    const threatModelContent = readFileSync(join(projectRoot, 'docs/security-threat-model.md'), 'utf8');
    if (threatModelContent.includes('Threat Model') && (threatModelContent.includes('STRIDE') || threatModelContent.includes('stride'))) {
      console.log(`  ${GREEN}✓${NC} docs/security-threat-model.md structure verified`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} docs/security-threat-model.md is missing standard threat modeling structure`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to verify threat model document: ${e.message}`);
    stats.fail++;
  }
}
