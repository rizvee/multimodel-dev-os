# Registry Security Threat Model

This document outlines the security architecture, threat model using the STRIDE framework, mitigation strategies, and design limitations of the registry and catalog trust systems in MultiModel Dev OS (MMDO).

---

## Gateway Security Scope

v4.2 Gateway Foundation established a localhost mock gateway runtime, dry-run routing, resilience simulation, preview-only client plans, and bounded observability.

v4.3 Sprints A–E established execution contracts, OpenAI-compatible request/response/error/SSE normalization, environment credential resolution with secret redaction, preflight execution gate, governed non-stream/stream executors, and localhost runtime integration.

The key gateway boundaries and threat controls are:

- **Localhost & Loopback Defaults**: Binding remains `127.0.0.1` by default.
- **Strict HTTPS Enforcement**: Provider endpoints must use `https://`. Insecure `http://` endpoints are rejected by validator and execution gate.
- **SSRF Mitigation**: Private IP strings (RFC 1918, loopback, link-local) and embedded credentials in URLs are rejected by contract validators. DNS-level resolution and socket IP pinning are planned for Sprint F1/F2.
- **Zero Redirect Policy**: `follow_redirects` is hardcoded to `false` in contracts and execution gate.
- **Environment Credential References**: Credentials reference environment variable names (`credential_ref.env_var`) only. Raw secret values in contract objects trigger validation errors. Secrets are accessed exclusively via `ResolvedCredential.withSecret()` callback and destroyed immediately after use.
- **Mandatory Redaction**: Execution results force `redacted: true` and redact secrets from messages and error objects.
- **Zero Runtime Dependencies**: All validators rely strictly on Node.js standard library and native gateway protocol primitives.

---

## Outbound Transport Control Posture

| Control | Layer | Current Status | Description |
|:---|:---|:---|:---|
| **URL Syntax Validation** | Validator Layer | `validator-enforced` | Validates strict HTTPS scheme, parses valid URL format, and rejects invalid structures in `validateProviderEndpoint()`. |
| **Trusted Endpoint Binding** | Gate / Executor Layer | `executor-enforced` | Asserts that `execution_request.endpoint` matches the provider's registered endpoint metadata before execution. |
| **Hostname Allowlisting** | Gate / Executor Layer | `contract-defined` | Contract requires provider configuration to allowlist target hosts, evaluated prior to transport invocation. |
| **DNS Resolution Interface Contract** | Transport Layer | `contract-enforced` | Hardened descriptor validator (`validateResolverInterface`) rejecting accessors, methods, and throwing Proxy traps. |
| **IP Classification Policy** | Transport Layer | `policy-enforced` | Static IANA IPv4/IPv6 special-purpose registry snapshot (`2025-10-09`), true longest-prefix CIDR classification, NAT64 embedded IPv4 evaluation, and `2000::/3` global unicast boundary enforcement. |
| **Resolved Address Set Audit** | Transport Layer | `policy-enforced` | Hardened set evaluator (`evaluateResolvedAddressSet`) with property descriptor auditing rejecting getters, symbol keys, and prototype pollution. |
| **Connection-Time Address Pinning** | Transport Layer | `planned` | Connecting directly to pre-resolved and validated IP address using custom `lookup` in `node:https` or direct socket creation in `node:net` / `node:tls` (Sprint F2). |
| **TLS Certificate Validation** | Transport Layer | `planned` | Native TLS verification using `rejectUnauthorized: true` while preserving original hostname for SNI and host header matching (Sprint F2). |
| **Redirect Handling** | Gate / Transport Layer | `validator-enforced` | Validator enforces `follow_redirects: false`; transport strictly rejects 3xx responses without following target locations. |
| **Request/Response Byte Limits** | Executor Layer | `executor-enforced` | Enforces `max_request_bytes` and `max_response_bytes` at payload normalization and streaming levels. |
| **Credential / Header Construction** | Transport Layer | `planned` | Header constructed exclusively inside final transport boundary using `ResolvedCredential.withSecret()` (Sprint F2). |
| **Timeout & Cancellation** | Executor / Runtime | `executor-enforced` | Lifecycle timeouts (`request_timeout_ms`, `response_timeout_ms`) and `AbortSignal` propagation managed by executor. |
| **Observability Redaction** | Observability Layer | `runtime-enforced` | Strips prompts, completions, credentials, and sensitive headers from event metrics and trace logs. |

---

## Governed Provider Execution Threat Model

The following matrix documents the threat model, attack scenarios, mitigations, responsible sprint, and honest implementation status for governed outbound provider execution:

| Asset | Trust Boundary | Threat | Attack Scenario | Required Mitigation | Responsible Sprint | Current Status |
|:---|:---|:---|:---|:---|:---|:---|
| **API Credentials** | Provider Execution Engine | Credential Disclosure | Raw API key stored in object or logged | Reference environment variables only (`credential_ref.env_var`); force `redacted: true` | Sprint A / C | validator-enforced |
| **API Credentials** | Environment Variables | Env Var Confusion | Specifying prototype or system env var (`__PROTO__`, `PATH`) | Strict regex `^[A-Z_][A-Z0-9_]{0,127}$` and prototype name rejection | Sprint A | validator-enforced |
| **API Credentials** | Multi-Provider Routing | Cross-Provider Reuse | Reusing OpenAI key for Anthropic | Scope credential references strictly per provider ID | Sprint A / C | contract-defined |
| **Network Endpoints** | Outbound Transport | SSRF | Target internal/private network service | Reject non-HTTPS, loopback, link-local, RFC 1918 IPs | Sprint A / F1 | validator-enforced (string); planned (DNS) |
| **Network Endpoints** | DNS Resolution | DNS Rebinding | Domain resolves to public IP during validation but private IP during fetch | Re-validate IP resolution at transport layer before connect & pin socket IP | Sprint F1 / F2 | planned |
| **Network Endpoints** | HTTP Redirects | Redirect Policy Bypass | HTTPS endpoint redirects to HTTP or internal IP | Hardcode `follow_redirects: false` in contracts & transport | Sprint A / F2 | validator-enforced |
| **Network Endpoints** | URL Parser | URL Credential Injection | Embedded `https://user:pass@host` in endpoint URL | Reject URLs with username or password component | Sprint A | validator-enforced |
| **Network Endpoints** | Provider Registry | Malicious Custom Endpoints | Attacker configures endpoint to point to attacker-controlled server | Validate URL against provider allowlists and require HTTPS | Sprint A | validator-enforced |
| **Network Endpoints** | Local Network | Private-Address Resolution | Endpoint targets localhost/127.0.0.1 or 10.x.x.x | Strict private/local address checks in validator & transport IP classifier | Sprint A / F1 | validator-enforced (string); planned (DNS) |
| **Transport Headers** | Outbound Request | Header Injection | Injecting CR/LF or custom cookie/proxy headers | Restrict headers to `ALLOWED_TRANSPORT_HEADERS` allowlist | Sprint A / F2 | validator-enforced |
| **Provider Identity** | Routing Engine | Host Confusion | Mismatched provider_id and endpoint domain | Validate provider_id consistency against endpoint URL | Sprint A / D | executor-enforced |
| **Gateway Memory** | Memory/Buffers | Oversized Request | Attacker submits gigabyte payload to exhaust RAM | Enforce `max_request_bytes` (<= 52MB) limit in contract & stream parser | Sprint A / B | executor-enforced |
| **Gateway Memory** | Memory/Buffers | Oversized Response | Upstream provider returns massive response payload | Bounded `max_response_bytes` with stream buffer cut-off | Sprint A / B | executor-enforced |
| **Gateway Sockets** | Transport Connection | Unbounded Stream | Upstream stream never sends end-of-stream signal | Enforce stream idle timeout & max duration budget | Sprint A / E2 / F3 | executor-enforced |
| **Gateway Thread** | Resource Allocation | Slow Upstream / Resource Exhaustion | Slowloris attack keeping connections open | Bounded connection & request timeouts (`request_timeout_ms`) | Sprint A / E1 / F2 | executor-enforced |
| **SSE Parser** | Stream Parser | Malformed SSE | Malformed server-sent events crash parser | Robust SSE chunk validator & error boundary | Sprint B / E2 | executor-enforced |
| **Error Diagnostics** | Error Normalization | Upstream Error-Body Leakage | Provider error response contains credentials or internal details | Normalize error shape, force `redacted: true`, reject raw response bodies | Sprint A / B | executor-enforced |
| **Gateway Logs** | Observability | Log Injection | User prompt contains control characters or format specifiers | Sanitize log entries, redact prompt text by default | Sprint A / E1 | runtime-enforced |
| **Error Diagnostics** | Error Reporting | Stack Trace Leakage | Execution crash exposes local file paths & stack | Strip stack traces from `ExecutionError` contracts | Sprint A / C | executor-enforced |
| **Prompts/Completions** | Observability | Prompt/Completion Retention | Logs store full prompt/completion text | Prompt redaction enabled by default (`redact_prompts: true`) | Sprint A / E1 | runtime-enforced |
| **Provider Identity** | Provider Transport | Provider Impersonation | Spoofed provider response | TLS certificate validation & strict HTTPS | Sprint F2 | planned |
| **Execution Policy** | Local Config | Configuration Tampering | Local config enables retries or private networks without authorization | Enforce `max_attempts: 1`, `retry_enabled: false`, `fallback_enabled: false` in contract validator | Sprint A / D | executor-enforced |
| **Upstream Services** | Transport Resiliency | Retry Amplification | Loops trigger rapid automated retries flooding provider | Hardcode `max_attempts: 1` and `retry_enabled: false` | Sprint A / D | executor-enforced |
| **Upstream Services** | Routing Resiliency | Fallback Confusion | Fallback routes send request to unauthorized secondary provider | Enforce `fallback_enabled: false` in execution contracts | Sprint A / D | executor-enforced |
| **Binary/Packages** | npm Dependency Tree | Supply-Chain Compromise | Malicious third-party package introduced via npm dependency | Maintain zero runtime dependencies policy | Sprint A | validator-enforced |
| **Gateway Listener** | Local Network | Exposed Localhost Gateway | Gateway bound to 0.0.0.0 allowing LAN access | Default host `127.0.0.1`, reject `allow_remote_binding: true` without auth | Sprint A / E1 | runtime-enforced |

---


## 1. Threat Scenarios & Mitigations

### Threat: Attacker Modifies Remote Registry Manifest
- **Description**: An attacker compromises the remote host or storage bucket containing the registry manifest file (`manifest.json`) and attempts to alter its contents.
- **Mitigation**: 
  - Every sync operation retrieves the manifest. 
  - The client verifies the manifest's cryptographic signature against the local trust store ([`trusted-keys.yaml`](../.ai/registries/trusted-keys.yaml)). 
  - If the manifest's contents are modified by an attacker, the signature verification check fails, halting verification and refusing cache sync.

### Threat: Attacker Modifies Catalog Contents
- **Description**: An attacker alters the `catalog.yaml` index to point to malicious plugins or scripts, while leaving the manifest file unchanged.
- **Mitigation**: 
  - The `manifest.json` contains a SHA-256 integrity hash of `catalog.yaml` (`catalog_hash`). 
  - The client calculates the local SHA-256 hash of the downloaded `catalog.yaml` and asserts it matches the manifest's `catalog_hash`. Any discrepancy halts synchronization.

### Threat: Attacker Compromises Transport (Man-in-the-Middle)
- **Description**: An attacker intercepts the network connection to spoof registry manifests or download files.
- **Mitigation**: 
  - Registry URLs are strictly validated to require secure HTTPS connections. HTTP is rejected by default.
  - Transport integrity is backed by public-key Ed25519 signatures. Even if transport-level security is compromised, the client asserts the signature matches a trusted key.

### Threat: Attacker Submits Malicious Plugin Metadata
- **Description**: An attacker registers a plugin with malicious parameters, such as directory paths designed to cause directory traversal, or shell scripts designed to run command injection.
- **Mitigation**: 
  - Strict path safety validation is performed on plugin installation paths to prevent path traversal outside permitted `.ai/` and `adapters/` directories.
  - Slugs are validated against strict alphanumeric patterns (`/^[a-z0-9-_]+$/i`).
  - Catalog synchronization is cache-only and non-executing. Synchronizing remote registries does not run any code or auto-install plugins.

### Threat: Path Traversal
- **Description**: An attacker crafts registry source configurations or manifest files using relative directory sequences (e.g. `../../etc/passwd`) to read or write sensitive files.
- **Mitigation**: 
  - All file path resolutions are strictly bounded and verified using canonical paths (`path.resolve`). Access outside the approved workspace directory is rejected.

### Threat: Command Injection via Registry URLs
- **Description**: An attacker specifies registry URLs containing shell metacharacters (e.g., quotes, backticks, semicolons) hoping to execute shell commands during sync or fetch operations.
- **Mitigation**: 
  - The fetch helper utilizes `execFileSync` instead of shell-based `execSync`, ensuring URL values are treated strictly as literal command arguments.
  - Strict validation rejects URLs containing whitespace or shell command syntax.

### Threat: Stale/Replay Registry Data
- **Description**: An attacker serves a valid, signed registry manifest from the past (e.g. version 1.0.0 containing an older, vulnerable plugin) to roll back updates.
- **Mitigation**: 
  - The local lockfile (`` `registry-lock.json` ``) records the last synchronized manifest hash, version, and sync timestamp. 
  - Replays or attempts to downgrade manifest versions can be detected via local history comparison.

### Threat: Unknown/Revoked Signing Keys
- **Description**: An attacker signs a malicious manifest using an expired, disabled, revoked, or unconfigured signing key.
- **Mitigation**: 
  - Key IDs are verified against active trust store records. If a key is marked `revoked` or `disabled`, verification immediately fails.
  - Keys lacking the specific `scopes: ["registry"]` or `scopes: ["catalog"]` attribute are rejected.

### Threat: Local Cache Tampering
- **Description**: An attacker with local access modifies the cache files in `.ai/registry-cache/` to bypass remote verification.
- **Mitigation**: 
  - Every `registry verify` run calculates the SHA-256 hashes of all cached files and compares them against the tamper-evident local provenance lockfile (`registry-lock.json`), which is committed to VCS.

---

## 2. Trust Model Layers

MultiModel Dev OS enforces a multi-layer defense-in-depth model:

```mermaid
graph TD
    A[1. URL Validation] --> B[2. Cache-Only Sync]
    B --> C[3. Catalog Hash Verification]
    C --> D[4. Lockfile Comparison]
    D --> E[5. Provenance Report]
    E --> F[6. Public-Key Signature Verification]
    F --> G[7. Trusted Key Store]
    G --> H[8. Manual Approval Gates]
```

1. **URL Validation**: Rejects non-HTTPS, command-injection characters, or malformed URLs.
2. **Cache-Only Sync**: Downloads files strictly to offline cache folders. No script execution occurs.
3. **Catalog Hash Verification**: Asserts SHA-256 integrity matches between files and manifest list.
4. **Lockfile Comparison**: Checks current downloaded hashes against committed VCS registry lockfile.
5. **Provenance Report**: Computes local and signature status to output detailed trust verdicts.
6. **Public-Key Signature Verification**: Verifies cryptographic signatures using Ed25519.
7. **Trusted Key Store**: Verifies that the signing key is configured, active, and scoped.
8. **Manual Approval Gates**: Plugin installation requires explicit `--approved` confirmation from the operator.

---

## 3. Limits & Constraints

- **Local HMAC Mode Limitations**: HMAC signature mode provides project-scoped integrity verification (proving a registry was synced by a project member with the key). It does *not* prove remote publisher identity to the public.
- **Asymmetric Signature Boundaries**: Ed25519 signatures verify publisher identity only if the user's local trust store is correct. If the trust store itself is compromised or loaded with untrusted public keys, signatures cannot prevent spoofing.
- **HTTPS Limitations**: HTTPS secures transit integrity against network-level eavesdroppers. It does not establish publisher identity or code quality.
- **Operator Overrides**: No security model can protect users who manually execute command overrides (`--approved` or `--force`) without inspecting the manifest and plugins being installed.
