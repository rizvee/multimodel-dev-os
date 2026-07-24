# Provider Adapter Contract

Provider adapters are planned as the boundary between the future gateway runtime and model providers. v4.2 Sprint A defines and validates the interface only.

No external provider adapter is executed in Sprint A. The bundled mock provider used by tests is deterministic and local-only.

## Adapter Metadata

Adapters declare:

| Field | Purpose |
| --- | --- |
| `id` | Lowercase provider identifier. |
| `name` | Human-readable provider name. |
| `type` | Provider kind, such as `openai-compatible`, `native`, `local`, or `mock`. |
| `version` | Adapter contract version. |
| `capabilities` | Supported capability vocabulary. |
| `credential_env` | Strict uppercase environment variable name (matching `^[A-Z_][A-Z0-9_]{0,127}$`), or `null`. |
| `base_url` | Provider endpoint metadata. |
| `models` | Model metadata exposed by the adapter. |

## Governed Credential Resolution (v4.3 Sprint C)

Provider adapters authorize environment credential resolution strictly through `credential_env`:
- `credential_env` must be `null` or a strict uppercase environment variable name.
- Prototype-sensitive names (`__proto__`, `prototype`, `constructor`) are rejected.
- Resolution via `resolveEnvironmentCredential()` reads ONLY `environment[adapter.credential_env]`.
- Environment variable enumeration, spreading, or logging is strictly forbidden.


Capability vocabulary:

- `chat`
- `streaming`
- `tools`
- `vision`
- `audio`
- `reasoning`
- `embeddings`
- `local`
- `structured-output`

## Required Methods

Adapters must expose these methods:

- `validateConfig(config)`
- `listModels()`
- `normalizeRequest(request, context)`
- `invoke(request, context)`
- `normalizeResponse(response, context)`
- `stream(request, context)`
- `classifyError(error, context)`
- `health(context)`
- `redact(value)`

Sprint A validates that these methods exist. It does not call live providers, open sockets, load credentials, or execute external model requests.

## Mock Provider

The test mock provider:

- uses static model metadata
- returns predictable responses
- returns predictable stream chunks
- classifies errors deterministically
- has no credentials
- makes no network calls

This keeps provider contract tests safe and reproducible.

## Registry Relationship

Provider registry records are metadata inputs for future adapters. Sprint B can normalize provider IDs, base URLs, credential environment variable names, capabilities, and model associations, but it does not instantiate provider clients or call adapter `invoke`/`stream` methods.

## Routing Relationship

Sprint C route planning does not call adapter `invoke`, `stream`, `health`, or credential-loading paths. Provider adapter records remain metadata and contract inputs only.

## Runtime Boundary

Sprint E executes only the built-in mock provider through the localhost runtime. External provider adapter contracts remain design and validation assets until a later sprint explicitly introduces provider execution.
