# Gateway Security Model

v4.2 Sprint A establishes security boundaries for future gateway runtime work. It does not start a server, load provider credentials, call provider APIs, or enforce Skill OS permissions at runtime.

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

Provider credentials are not bundled and are not loaded by Sprint A modules.

## Provider URL Safety

Provider hosts are treated as security-sensitive. Sprint A validation rejects local or private provider hosts in gateway configuration until a future explicit approval path exists.

This is a planning and validation boundary, not a live SSRF defense for an HTTP server. Runtime SSRF protections must be implemented before live provider execution is added.

## Skill OS Integration

Skill OS remains the control plane:

- permissions are declarative metadata
- guardrails are advisory metadata
- workflows may reference Skill OS metadata
- validation can inspect unsafe shapes

Sprint A does not enforce permissions at runtime and does not make advisory guardrails block live commands.

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
