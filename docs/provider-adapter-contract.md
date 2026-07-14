# Provider Adapter Contract

Provider adapters are planned as the boundary between the future gateway runtime and model providers. v4.2 Sprint A defines and validates the interface only.

No real provider adapter is executed in Sprint A. The bundled mock provider used by tests is deterministic and local-only.

## Adapter Metadata

Adapters declare:

| Field | Purpose |
| --- | --- |
| `id` | Lowercase provider identifier. |
| `name` | Human-readable provider name. |
| `type` | Provider kind, such as `openai-compatible`, `native`, `local`, or `mock`. |
| `version` | Adapter contract version. |
| `capabilities` | Supported capability vocabulary. |
| `credential_env` | Name of the future credential environment variable, or `null`. |
| `base_url` | Provider endpoint metadata. |
| `models` | Model metadata exposed by the adapter. |

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

Sprint A validates that these methods exist. It does not call live providers, open sockets, load credentials, or execute real model requests.

## Mock Provider

The test mock provider:

- uses static model metadata
- returns predictable responses
- returns predictable stream chunks
- classifies errors deterministically
- has no credentials
- makes no network calls

This keeps provider contract tests safe and reproducible.
