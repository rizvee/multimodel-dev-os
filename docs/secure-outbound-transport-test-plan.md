# Secure Outbound Transport Test Plan

This document describes the test strategy and local test harness design for verifying the built-in outbound transport in MultiModel Dev OS.

---

## 1. Test Harness Architecture

To uphold the project's zero-dependency, local-first safety posture:
- **No External Network Calls**: All tests run strictly offline against in-memory fixtures or local node servers.
- **Localhost HTTP/HTTPS Servers**: Mock servers instantiated on ephemeral loopback ports (`127.0.0.1:0`).
- **Injected DNS Resolver Fixtures**: Mock DNS lookups injecting controlled IPv4/IPv6 responses to test classification and fail-closed behavior without modifying system DNS.
- **No Real Credentials**: Synthetic API tokens used exclusively.

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
Local HTTPS server initialized with ephemeral self-signed certificates (for TLS failure testing) and local mock routes returning 200 OK, 302 Found, or slow streaming chunks.
