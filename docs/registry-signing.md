# Registry Signature Verification

MultiModel Dev OS employs cryptographic signatures to verify the authenticity and integrity of remote catalog registries. This document describes the signature formats, payload canonicalization, and verification mechanisms.

---

## Architecture Overview

There are two primary modes of cryptographic integrity and identity checks:

1. **Local/Internal Integrity Mode (HMAC-SHA256)**:
   - Used for team or project-level locking.
   - Signs the catalog checksum with a project-scoped key stored locally at `.ai/registry-signing-key`.
   - Verified offline against `.ai/registry-lock.json` when running `registry verify`.

2. **Public Publisher Trust Mode (Ed25519)**:
   - Used to verify public registry catalogs using asymmetric public-key cryptography.
   - The publisher signs the manifest using their Ed25519 private key.
   - MultiModel Dev OS verifies the signature block against the public keys stored in the trusted key store (`.ai/registries/trusted-keys.yaml`).

---

## Canonical Payload Design

To prevent key insertion order differences from altering signature checks, MultiModel Dev OS constructs a **stable canonical payload** before signing or verifying.

### Canonicalization Algorithm:
1. Sort the fields specified in `signed_fields` alphabetically.
2. Extract these fields from the manifest object.
3. Sort any nested object keys alphabetically recursively.
4. Serialize the object to a standard minified JSON string (no spaces).

Example code:
```javascript
import { createCanonicalPayload } from './src/registry/signing.js';

const manifest = {
  registry_name: "official",
  version: "1.0.0",
  catalog_hash: "sha256:abcd..."
};

const payload = createCanonicalPayload(manifest, ['registry_name', 'version', 'catalog_hash']);
// Output: '{"catalog_hash":"sha256:abcd...","registry_name":"official","version":"1.0.0"}'
```

---

## Key Management

### Project-Scoped HMAC Keys
To generate a local HMAC key for signing your synced catalog files:
```bash
node bin/multimodel-dev-os.js registry keygen --approved
```
This generates a random 32-byte key (64 hex characters) and saves it to `.ai/registry-signing-key` with `0o600` permissions. Ensure this file is gitignored.

### Ed25519 Publisher Keys
For public registries, the publisher generates an Ed25519 keypair. The public key is published in the trust store, while the private key is kept strictly confidential and offline.
To verify signatures, the corresponding public key must be registered in `.ai/registries/trusted-keys.yaml`.

---

## Verification & Trust Readiness

The registry signature verification pipeline is tested end-to-end using dedicated offline E2E fixtures:
- **Valid signatures** pass verification.
- **Tampered manifests, wrong keys, and revoked keys** are blocked, reporting precise errors and warning verdicts recorded inside the local provenance lockfile (`registry-lock.json`).

For historical background on the signing milestone, see the [v3.5.0 Release Readiness Checklist](../docs/v3.5.0-readiness.md). For current release status, see the [Changelog](../CHANGELOG.md).
