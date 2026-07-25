# Secure Outbound Transport Threat Model

This document outlines the threat model for the planned built-in Node.js standard-library outbound transport for MultiModel Dev OS.

---

## Gateway Security Posture & Controls

The outbound transport threat model builds on the v4.3 gateway contracts and execution controls. The status of every threat control across contract, validator, executor, transport, and runtime layers is classified below:

| Control | Layer | Current Status | Description |
|:---|:---|:---|:---|
| **URL Syntax Validation** | Validator Layer | `validator-enforced` | Validates strict HTTPS scheme, parses valid URL format, and rejects invalid structures in `validateProviderEndpoint()`. |
| **Trusted Endpoint Binding** | Gate / Executor Layer | `executor-enforced` | Asserts that `execution_request.endpoint` matches the provider's registered endpoint metadata before execution. |
| **Hostname Allowlisting** | Gate / Executor Layer | `contract-defined` | Contract requires provider configuration to allowlist target hosts, evaluated prior to transport invocation. |
| **DNS Resolution** | Transport Layer | `planned` | Asynchronous resolution of hostnames to IPv4/IPv6 addresses via `node:dns/promises`. |
| **IP Classification** | Transport Layer | `planned` | Strict classification and fail-closed rejection of private, loopback, link-local, multicast, CGNAT, and reserved IP ranges. |
| **Connection-Time Address Pinning** | Transport Layer | `planned` | Connecting directly to pre-resolved and validated IP address using custom `lookup` in `node:https` or direct socket creation in `node:net` / `node:tls`. |
| **TLS Certificate Validation** | Transport Layer | `planned` | Native TLS verification using `rejectUnauthorized: true` while preserving original hostname for SNI and host header matching. |
| **Redirect Handling** | Gate / Transport Layer | `validator-enforced` | Validator enforces `follow_redirects: false`; transport strictly rejects 3xx responses without following target locations. |
| **Request/Response Byte Limits** | Executor Layer | `executor-enforced` | Enforces `max_request_bytes` and `max_response_bytes` at payload normalization and streaming levels. |
| **Credential / Header Construction** | Transport Layer | `planned` | Header constructed exclusively inside final transport boundary using `ResolvedCredential.withSecret()`. |
| **Timeout & Cancellation** | Executor / Runtime | `executor-enforced` | Lifecycle timeouts (`request_timeout_ms`, `response_timeout_ms`) and `AbortSignal` propagation managed by executor. |
| **Observability Redaction** | Observability Layer | `runtime-enforced` | Strips prompts, completions, credentials, and sensitive headers from event metrics and trace logs. |

---

## STRIDE Threat Matrix

Below is the STRIDE-style threat matrix for outbound transport operations:

| Asset | Attacker | Entry Point | Precondition | Impact | Prevention Strategy | Detection | Residual Risk | Proposed Sprint / Test |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **Local Services** | Malicious Config / User | Endpoint URL | User or config sets endpoint to `https://127.0.0.1` or `https://169.254.169.254` | Private service compromise or metadata theft | Pre-connection IP range classification and fail-closed rejection | Audit logs & endpoint validator failures | Localhost services exposed if IP check bypassed | Sprint F1 (`tests/unit/transport-policy.test.js`) |
| **DNS Resolver** | Untrusted Network | Upstream DNS | Attacker poisons upstream DNS server | Traffic routed to malicious IP | IP classification on resolved addresses; mandatory TLS cert verification | TLS handshake failure on host mismatch | MitM attempt recorded | Sprint F1 / F2 (`tests/unit/transport-dns.test.js`) |
| **IP Boundaries** | Malicious DNS Server | Hostname Resolution | Hostname initially resolves to public IP, then resolves to private IP | SSRF to internal network | Socket connection pinned to pre-validated IP address; single lookup per connection | Pinned IP mismatch logging | Attacker controls public IP pointing to malicious server | Sprint F1 / F2 (`tests/unit/transport-pinning.test.js`) |
| **Private Network** | Upstream Server | HTTP 3xx Redirect | Server returns `302 Found` pointing to internal IP | SSRF via redirect | Follow redirects strictly set to `false`; 3xx responses returned as error | Response status logging | Application logic interprets 3xx as success | Sprint F1 / F2 (`tests/unit/transport-redirect.test.js`) |
| **API Credentials** | MitM / Bad Cert | TLS Handshake | Certificate signed by untrusted CA or host mismatch | Credential exfiltration | `rejectUnauthorized: true`; strict hostname SNI matching; no custom CAs | TLS verification errors | Compromised root CA on OS host | Sprint F2 (`tests/unit/transport-tls.test.js`) |
| **API Credentials** | Malicious Header Injector | Request Headers | Header input contains `\r\n` | Header injection / smuggling / token leakage | Strict CR/LF rejection; allowlist limited to `Authorization`, `Content-Type`, `Accept`, `User-Agent` | Header validation errors | Process memory inspection by local privileged user | Sprint F2 (`tests/unit/transport-headers.test.js`) |
| **Gateway Memory** | Upstream Server | Response Body | Server sends gigabytes of compressed data | Out-of-memory crash | Enforce `max_response_bytes`; no transparent decompression | Byte budget exceeded errors | Memory pressure prior to limit breach | Sprint F2 / F3 (`tests/unit/transport-limits.test.js`) |
| **Gateway Sockets** | Malicious Upstream | SSE Stream | Upstream stream stalls without closing | Socket / handle leak | Separate DNS, connect, TLS, idle, and total execution timeout timers | Timeout execution logs | Timers depend on Node event loop precision | Sprint F2 / F3 (`tests/unit/transport-timeouts.test.js`) |
| **Credentials** | Observability Collector | Transport Logs | Transport logs full HTTP headers | Secret leakage in logs | Credentials injected inside transport boundary only; never passed to logger | Log auditing checks | Heap memory inspection | Sprint F2 / F4 (`tests/unit/transport-redaction.test.js`) |

---

## Honest Security Boundaries & Non-Claims

1. **No Existing DNS-Level SSRF Protection**: Current v4.3 Sprint E2 implementation validates string syntax of endpoints (e.g. rejecting literal `https://127.0.0.1`), but does **not** perform DNS resolution or IP pinning prior to connection. DNS-level SSRF protection is planned for Sprint F1/F2.
2. **Physical Secret Zeroization**: In JavaScript and Node.js runtime environments, physical memory zeroization after standard-library HTTP/TLS execution cannot be guaranteed due to internal string copies and garbage collection behavior. Ephemeral credential objects utilize `#secret` private fields and `.destroy()` zeroing of internal references, but V8 engine memory strings may persist until garbage collected.
3. **Ambient Environment Proxy Isolation**: Built-in transport will explicitly ignore ambient process environment variables (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY`) to prevent unintended request redirection.
