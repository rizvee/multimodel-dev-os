# Trusted Key Store

MultiModel Dev OS uses a trusted key store to authorize public publishers of remote catalog indexes.

---

## Configuration Path

The trusted keys are stored in a YAML file at the path defined by the `trusted_keys_file` policy setting (default: `.ai/registries/trusted-keys.yaml`).

---

## File Format

Each key record in `.ai/registries/trusted-keys.yaml` consists of:

- `key_id`: A unique string identifier for the key.
- `name`: Human-readable name of the key owner.
- `algorithm`: The cryptographic algorithm (e.g. `ed25519`).
- `public_key`: SPKI public key PEM block or raw key string.
- `scopes`: Allowed operations for the key (e.g. `registry`, `catalog`).
- `status`: Key status (`active`, `disabled`, or `revoked`).

### Example Configuration:
```yaml
trusted_publishers:
  - key_id: official-maintainer-key
    name: "MultiModel Dev OS Core Team"
    algorithm: ed25519
    public_key: |
      -----BEGIN PUBLIC KEY-----
      MCowBQYDK2VwAyEA9vWwyE5+fY0dvEzl9S1UcvtoMkOAIDhDCzZAkP+CVNo=
      -----END PUBLIC KEY-----
    scopes:
      - registry
      - catalog
    status: active
```

---

## Policy Integration

The policy configuration in `.ai/policies/registry-policy.yaml` controls how keys in the trust store are enforced:

- `require_trusted_publisher`: If set to `true`, verification will fail if a signature uses a `key_id` not found in the trust store.
- `allowed_signature_algorithms`: Restricts the algorithms allowed for verification (e.g. only `ed25519`).

---

## Command Line Interface

You can manage and inspect the trust store using the `registry trust` subcommands:

- **List trusted keys**:
  ```bash
  node bin/multimodel-dev-os.js registry trust list
  ```
- **Show key details**:
  ```bash
  node bin/multimodel-dev-os.js registry trust show <key_id>
  ```
- **Verify key formats**:
  ```bash
  node bin/multimodel-dev-os.js registry trust verify
  ```
