# Gateway Security Model

v4.2 Gateway Foundation establishes security boundaries for the local mock runtime and future provider execution work. The current runtime can start a localhost-only mock gateway; it does not load provider credentials, call external provider APIs, execute live retry/fallback chains, or enforce Skill OS permissions at runtime.

## Safe Defaults

Gateway configuration defaults are intentionally conservative:

- bind host: `127.0.0.1`
- remote binding disabled
- prompt redaction enabled
- local-only auth mode
- bounded request size
- bounded request timeout
- bounded stream idle timeout
- bounded provider timeout
- conservative retry limit
- fallback disabled
- private provider networks disallowed

These defaults are validated by unit tests and the strict verification pipeline.

## Secret Boundaries

Gateway diagnostics and normalized errors must not include:

- API keys
- authorization headers
- raw credential values
- sensitive environment values
- full prompt bodies by default

Provider credentials are not bundled and are not loaded by gateway modules.

## Provider URL Safety

Provider hosts are treated as security-sensitive. Metadata validation rejects unsafe protocols, embedded credentials, and local/private remote targets until a future explicit approval path exists.

This is metadata validation and future SSRF preparation. Runtime SSRF protections must be reviewed again before live provider execution is added.

## Runtime Registry Safety

v4.2 Sprint B validates provider and local endpoint metadata without making requests:

- remote providers require `https:`
- embedded URL credentials are rejected
- localhost/private-network targets are rejected for non-local providers
- local endpoints must use approved local hosts
- credential fields store environment variable names only
- credential values are never read from the environment
- routing presets are loaded but not executed

## Routing Safety

Sprint C route planning is dry-run only. It uses static registry metadata and caller-supplied estimates to select a recommended candidate. It does not send prompts, load API keys, call provider endpoints, run health probes, execute fallback attempts, or write routing logs.

## Resilience Simulation Boundary

Sprint D resilience planning is also non-executing:

- failure records are caller-supplied
- retry and backoff values are planned only
- timeout budgets do not start timers
- fallback transitions are selected as metadata only
- circuit-breaker state is not persisted
- rate-limit and quota metadata is not fetched from providers

Resilience explanations must not include prompt bodies, credential values, authorization headers, or local absolute paths.

## Local Runtime Boundary

Sprint E adds a real local HTTP server with a mock provider only.

Security boundaries:

- default bind host is loopback
- remote binding is disabled by default
- non-local binding requires bearer-token authentication
- forwarded headers are not trusted
- wildcard CORS is not enabled
- provider credential environment variables are not read
- external provider URLs are not contacted
- request bodies are bounded
- timeout timers are bounded and cleared
- no request logs, PID files, or runtime state files are written

Route explanations must not include prompt bodies, credential values, authorization headers, or absolute local machine paths.

## Client Configuration Boundary

Sprint F client plans are preview-only:

- generated paths are workspace-relative
- token values are represented by environment placeholders
- diagnostics redact endpoint credentials
- no global editor or shell configuration is written
- no third-party client executable is invoked

## Observability Boundary

Sprint G observability is bounded and local:

- no telemetry upload
- no analytics SDK
- no filesystem logs
- no prompt or completion retention by default
- no authorization header retention
- no bearer-token retention
- no external provider health probes
- no live pricing lookups

Optional observability endpoints inherit the local runtime authentication boundary and are disabled unless explicitly configured.

## Skill OS Integration

Skill OS remains the control plane:

- permissions are declarative metadata
- guardrails are advisory metadata
- workflows may reference Skill OS metadata
- validation can inspect unsafe shapes

The gateway does not enforce permissions at runtime and does not make advisory guardrails block live commands.

## Sprint H Threat Review

| Threat | Current mitigation | Residual risk | Evidence | Future action |
|:---|:---|:---|:---|:---|
| Remote bind exposure | Loopback default; non-local binding requires explicit auth config. | Misconfiguration can still expose the local gateway. | Runtime config tests and release-readiness verifier. | Add operator-facing warnings before any CLI startup command exists. |
| Unauthenticated access | Localhost-only mode by default; bearer-token auth for non-local config. | Local malware can still access localhost services. | Auth unit/integration tests. | Consider opt-in token requirement even on loopback for sensitive workspaces. |
| Bearer-token disclosure | Authorization headers are redacted and not stored in observability. | User-applied client configs could leak tokens outside this project. | Redaction tests and client preview tests. | Keep generated configs placeholder-only. |
| Oversized or malformed requests | Bounded request size; malformed JSON and content length rejected. | Slow request attacks still depend on Node server behavior and configured timeouts. | Body-reader tests and runtime verifier. | Add connection-count limits before production use. |
| Stream exhaustion | Stream idle and total timeouts; server cleanup on stop. | High concurrency is not production-hardened. | SSE tests and runtime smoke. | Add concurrency caps before external provider execution. |
| SSRF through provider URLs | Registry URL validation rejects unsafe protocols, embedded credentials, and local/private remote targets. | No live provider calls exist yet; future adapters must revalidate. | Registry verifier and security docs. | Re-audit before adding real provider clients. |
| Prompt/completion leakage | Observability omits prompt/completion content by default and redacts content-like fields. | User-supplied metadata may need review when new fields are added. | Observability tests and release-readiness verifier. | Keep metadata allowlists narrow. |
| Unsafe client configuration | Generated plans are preview-only, workspace-relative, and token-placeholder based. | Users can manually paste unsafe config into tools. | Client verifier and compatibility docs. | Add explicit apply approval if a write API is ever introduced. |
| Mock-provider confusion | Docs and `/v1/models` expose executable mock models only. | Users may assume external provider support from roadmap language. | Compatibility docs and docs-claim scan. | Keep known limitations linked from gateway docs. |
| Package and supply-chain risk | Zero runtime dependencies and prepublish guard remain active. | Dev dependency issues can still affect maintainers. | `npm audit --omit=dev`, `npm ls --omit=dev`, verify package checks. | Continue release-lane audit before stable v4.2. |

## Future Runtime Requirements

Before a gateway runtime is release-ready, it should include:

- localhost-first binding checks
- explicit authentication for non-local access
- provider URL validation
- request-size limits
- timeout controls
- retry ceilings
- prompt and secret redaction
- audit logs without prompt bodies by default
- tests for credential leaks and unsafe provider targets
