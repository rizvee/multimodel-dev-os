# Secure Outbound Transport Test Plan

This document describes the test strategy, local test harness design, and test-seam boundaries for verifying the built-in outbound transport in MultiModel Dev OS.

---

## 1. Test Harness Architecture & Test Seam Boundaries

To uphold the project's zero-dependency, local-first safety posture while enabling local testing against loopback servers:

- **No Public `allowPrivateNetworks` Override**: Production destination policy strictly rejects private/loopback IP addresses (`127.0.0.0/8`, `::1`, `10.0.0.0/8`). There is no environment variable, public CLI flag, or runtime configuration parameter that allows bypassing private-network rejection in production.
- **Injected Connector / Socket Factory Seam**: Integration tests connect to local test servers (`127.0.0.1:0`) via an internal, test-only injected connector or socket factory seam.
- **Internal Helper Isolation**: Test helpers and mock connectors are internal to `tests/` fixtures and are **never** exported through the package public API (`src/index.js` or `src/gateway/index.js`).
- **Verifier Assertion**: Release verifiers assert that no test connector or private-network bypass capability reaches production runtime code.
- **Certificate Management**: Test certificates for TLS testing are static synthetic fixtures stored in `tests/fixtures/certs/` or generated dynamically using Node.js standard-library `node:crypto` primitives. The test suite has zero dependency on globally installed `openssl` CLI executables.

---

## 2. Test Suites & Matrix

| Test Suite | File | Focus Areas | Key Verification Assertions |
|:---|:---|:---|:---|
| **Destination Policy** | `tests/unit/transport-destination-policy.test.js` | URL canonicalization & IP classification | Validates IPv4/IPv6 classification, loopback/private IP rejection, IPv4-mapped IPv6 detection, and URL scheme normalization. |
| **DNS Resolution & Pinning** | `tests/unit/transport-dns-pinning.test.js` | DNS resolution & socket pinning | Validates custom `lookup` socket pinning, DNS timeout handling, and DNS rebinding prevention across multiple IP answers. |
| **TLS & Hostname Identity** | `tests/unit/transport-tls.test.js` | TLS security & SNI verification | Verifies `rejectUnauthorized: true`, SNI hostname matching, certificate hostname mismatch rejection, and self-signed certificate blocking. |
| **Header Security & Auth** | `tests/unit/transport-headers.test.js` | Credential injection & CR/LF guards | Asserts Bearer token construction via `ResolvedCredential`, CR/LF header injection rejection, and strict header allowlisting. |
| **Resource Limits & Timeouts**| `tests/unit/transport-resource-limits.test.js` | Size caps & timeout phase lifecycles | Tests request/response byte bounds, connect timeout, header timeout, idle stream timeout, and total execution timeout cancellation. |
| **Streaming & SSE Adapter** | `tests/unit/transport-sse-streaming.test.js` | SSE streaming & backpressure | Verifies `text/event-stream` response validation, AsyncIterable socket wrapper, backpressure drain handling, and socket destruction on abort. |
| **Adversarial Security** | `tests/integration/transport-adversarial.test.js` | SSRF, redirects, compression bombs | Simulates HTTP 3xx redirect blocking, proxy environment variable isolation (`HTTP_PROXY`), compression bomb rejection, and secret redaction. |

---

## 3. Test Fixture Specifications

### Mock DNS Fixture
```javascript
export function createMockResolver(mappings = {}) {
  return {
    async resolve4(hostname) {
      if (mappings[hostname]?.a) return mappings[hostname].a;
      throw new Error(`ENOTFOUND ${hostname}`);
    },
    async resolve6(hostname) {
      if (mappings[hostname]?.aaaa) return mappings[hostname].aaaa;
      throw new Error(`ENOTFOUND ${hostname}`);
    }
  };
}
```

### Mock HTTPS Server Fixture
Local HTTPS server initialized with synthetic test certificates (for TLS testing) and local mock routes returning 200 OK, 302 Found, or slow streaming chunks.
