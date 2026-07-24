# Governed Credential Resolution Architecture

## Overview

MultiModel Dev OS v4.3 introduces an explicit, provider-bound environment credential resolver (`src/gateway/credentials/`) designed to safely manage model provider API keys.

---

## Key Guarantees

1. **Explicit Call Boundary**: Credentials are resolved **only** when `resolveEnvironmentCredential()` is invoked. There are zero import-time environment reads.
2. **Provider Metadata Authorization**: The environment variable name (e.g. `OPENAI_API_KEY`) is strictly authorized by `provider_adapter.credential_env`. An arbitrary or caller-supplied environment key is rejected before reading.
3. **No Environment Enumeration**: The resolver reads exact property keys (`environment[approvedEnvName]`). It never calls `Object.keys(process.env)`, `Object.entries()`, `JSON.stringify()`, or spreads the environment object.
4. **Opaque Credential Container**: Resolved secrets are held inside an ephemeral `ResolvedCredential` instance using JavaScript private class fields (`#secret`).
   - No public `value`, `secret`, `token`, or raw getter.
   - `JSON.stringify()`, `String()`, `util.inspect()`, and object spread `{ ...credential }` reveal metadata only, with the secret reported as `[REDACTED]`.
   - Controlled synchronous access is granted strictly through `credential.withSecret((raw) => { ... })`.
5. **No Transport or Header Construction**: The credential subsystem performs no network operations, makes no HTTP calls, and constructs no `Authorization` or `Bearer` headers.
6. **Memory Note**: JavaScript engines (V8) do not guarantee physical heap memory zeroization; however, calling `credential.destroy()` clears the internal reference and marks the container non-reusable.

---

## Resolver API

```javascript
import { resolveEnvironmentCredential } from './src/gateway/index.js';

const result = resolveEnvironmentCredential({
  credential_ref: {
    contract_version: '2026-07-15.sprint-a',
    source: 'environment',
    env_var: 'OPENAI_API_KEY',
    required: true,
  },
  provider_id: 'openai',
  provider_adapter: openAIAdapter,
  environment: process.env, // Optional override for testing
});

if (result.success && result.credential) {
  result.credential.withSecret((secret) => {
    // Secret is accessible only inside callback
  });
}
```

---

## Secret-Aware Redaction

The `redactSensitiveValue(target, knownSecrets)` function recursively sanitizes strings, objects, arrays, and error structures:
- Replaces occurrences of resolved credential secrets with `[REDACTED]`
- Replaces absolute filesystem paths with `[REDACTED_PATH]`
- Handles circular references and throwing getters safely
- Strips stack traces, raw bodies, and sensitive header fields
