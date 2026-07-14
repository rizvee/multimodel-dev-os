# Gateway Protocol

v4.2 Sprint A defines a minimal OpenAI-compatible gateway protocol subset for future implementation. It is a contract and validation layer only.

## Supported Request Fields

The initial chat request contract supports:

| Field | Purpose |
| --- | --- |
| `model` | Requested model identifier. |
| `messages` | Non-empty chat message array. |
| `stream` | Boolean stream preference. |
| `temperature` | Sampling temperature from 0 to 2. |
| `top_p` | Nucleus sampling value from 0 to 1. |
| `max_tokens` | Positive output token limit. |
| `stop` | Stop string or stop string array. |
| `tools` | Tool declarations carried through as metadata. |
| `tool_choice` | Tool selection hint. |
| `user` | Optional end-user identifier. |
| `metadata` | Namespaced extension metadata. |

Supported message roles are `system`, `developer`, `user`, `assistant`, and `tool`.

Unsupported top-level fields fail validation explicitly. The contract does not silently coerce dangerous or ambiguous values.

## Response Shapes

Sprint A defines normalized shapes for:

- non-streaming chat completion
- streaming chat chunk
- model listing
- health response
- normalized error response

Response metadata can include:

- request ID
- gateway version
- provider ID
- model ID
- created timestamp
- choices
- usage
- routing metadata
- finish reason

## Diagnostics

Request diagnostics are redacted by default. They include message counts and roles, but not prompt bodies.

Sensitive metadata keys such as authorization, token, secret, credential, password, and key-like names are redacted.

## Current Limits

Sprint A does not provide:

- an HTTP server
- provider execution
- streaming over the network
- model listing from live providers
- credential loading
- fallback execution
- complete OpenAI API compatibility

The protocol is intentionally small so future runtime work can be validated before it becomes executable.

## Registry Relationship

The v4.2 runtime registry supplies provider, model, local model, and routing preset metadata that future protocol handlers may consume. Sprint B loads this metadata but does not use it to execute requests, contact providers, or choose live routes.
