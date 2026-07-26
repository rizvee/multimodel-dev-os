# Secure Outbound Transport Design

This document details the zero-runtime-dependency outbound transport architecture designed for MultiModel Dev OS v4.3.

---

## 1. Node.js Standard Library Architecture

The transport is built strictly using Node.js standard-library modules:
- `node:https`: Client HTTP request creation over TLS.
- `node:dns/promises`: Non-blocking asynchronous DNS resolution.
- `node:net`: Low-level TCP socket address checks and family detection (`isIP`, `isIPv4`, `isIPv6`).
- `node:tls`: TLS connection options and certificate hostname verification.
- `node:stream`: Stream handling and AsyncIterable adapters.

---

## 2. Address & Destination Policy

### URL Parsing & Canonicalization Rules
All provider endpoints undergo strict canonicalization prior to resolution:
- **WHATWG URL Parser**: Validated exclusively via `new URL(input)`.
- **Absolute URL Required**: Must be absolute with explicit `https:` scheme. Insecure `http:` is rejected.
- **User Info Rejection**: Embedded credentials (e.g. `https://user:pass@host`) are rejected.
- **Fragment Rejection**: URLs containing fragments (`#...`) are rejected; never silently stripped.
- **Query String Rejection**: Query parameters (`?...`) are rejected unless explicitly allowed by endpoint contract.
- **Control Character & Backslash Rejection**: Any URL containing control characters, spaces, or backslashes (`\`) is rejected.
- **Encoded Traversal Rejection**: Rejects encoded slashes (`%2f`), backslashes (`%5c`), and path traversal segments (`/../`, `%2e%2e`).
- **Port Policy**: Port must be absent or explicitly `443`. Alternate HTTPS ports are rejected in v4.3.
- **Hostname Formatting**: Non-ASCII / IDN host input is rejected in v4.3 (IDN support deferred to a future canonicalization policy). Trailing-dot hostnames (e.g. `api.openai.com.`) are rejected rather than silently stripped. DNS labels must be valid ASCII labels.
- **IP Literals**: IPv4 literals must be in canonical 4-octet dotted decimal format (`1.2.3.4`). Rejects octal, hex, dword, or leading-zero representations. IPv6 literals must be canonical without zone identifiers (`%eth0`).

### IP Address Classification Source & Policy
Classification relies on static, reviewed address rules derived from the IANA IPv4 and IPv6 Special-Purpose Address Registries (Snapshot: 2026-07-15; RFC 6890, RFC 1918, RFC 4193, RFC 4291, RFC 6598, RFC 5737).

**Classification Rule**: Permit strictly addresses that are explicitly globally reachable. Fail closed on any unknown, malformed, non-global, reserved, or private range.

- **IPv4 Rejection**:
  - `0.0.0.0/8` (Current network / Unspecified)
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private-use RFC 1918)
  - `169.254.0.0/16` (Link-local)
  - `224.0.0.0/4` (Multicast)
  - `240.0.0.0/4` (Reserved / Future use)
  - `255.255.255.255/32` (Broadcast)
  - `100.64.0.0/10` (Shared Address Space / CGNAT)
  - `192.0.0.0/24` (IETF Protocol Assignments)
  - `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` (Documentation / TEST-NET)
  - `198.18.0.0/15` (Benchmarking)
- **IPv6 Rejection**:
  - `::/128` (Unspecified)
  - `::1/128` (Loopback)
  - `fc00::/7` (Unique Local Unicast - ULA)
  - `fe80::/10` (Link-Local Unicast)
  - `ff00::/8` (Multicast)
  - `2001:db8::/32` (Documentation)
  - `::ffff:0:0/96` (IPv4-mapped IPv6 - unmapped IPv4 portion normalized and classified against IPv4 rules)

### DNS Resolution Architecture & Resolver Trust Model
- **Direct Nameserver Queries**: DNS resolution uses `node:dns/promises` (`resolve4()` and `resolve6()`), which sends network DNS queries directly to configured nameservers. Standard OS getaddrinfo / `dns.lookup()` is intentionally avoided during address validation to prevent OS `hosts` file manipulation or local DNS cache poisoning from bypassing IP classification rules.
- **Hosts-File & Split-Horizon Trade-off**: Because `resolve4()`/`resolve6()` bypasses OS `dns.lookup()`, local OS `/etc/hosts` mappings, split-horizon DNS overrides, enterprise local DNS proxies, and loopback redirects are **not** consulted. This creates an explicit security trade-off: raw DNS resolution prevents local hosts-file SSRF manipulation, but intentionally bypasses enterprise local/split-horizon host resolution overrides.
- **Fail-Closed Policy**: Resolution queries return all IPv4 and IPv6 records. Every returned IP address is classified. If **any** returned IP address fails the public classification check, the entire resolution fails closed.
- **Planned Status**: Built-in DNS resolution and native transport remain PLANNED for Sprints F1/F2 and are not yet shipped in production code.

---

## 3. DNS Rebinding & TOCTOU Protection

To eliminate Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding vulnerabilities:
1. Resolve target hostname to IP addresses via `resolve4()` / `resolve6()`.
2. Validate all returned addresses against IP classification policy.
3. Select an approved IP address deterministically.
4. Pin socket connection to the selected IP address using standard `lookup` option in `https.request`:
   ```javascript
   lookup: (hostname, options, callback) => {
     callback(null, pinnedIpAddress, isIPv6 ? 6 : 4);
   }
   ```
5. Pass original `hostname` in `servername` (SNI) and `Host` header for TLS certificate identity verification.
6. Never follow HTTP redirects automatically. Re-resolve and re-validate addresses for every new connection.

---

## 4. TLS & Header Policy

### TLS Security Baseline
- `rejectUnauthorized: true`: Enforced strictly; cannot be overridden.
- `minVersion: 'TLSv1.2'`: Modern TLS baseline.
- **No Custom CAs**: System CA store used exclusively; no arbitrary custom CA injections in initial implementation.
- **No Ambient Proxies**: Ignores `HTTP_PROXY` / `HTTPS_PROXY` environment variables.

### Header Construction Boundary
Headers are constructed exclusively inside the final transport boundary right before sending:
- `Authorization`: `Bearer <secret>` (obtained ephemeral via `ResolvedCredential.withSecret()`).
- `Content-Type`: `application/json`.
- `Accept`: `application/json` (non-stream) or `text/event-stream` (stream).
- `User-Agent`: `MultiModel-Dev-OS-Gateway/4.3`.
- `Accept-Encoding`: `identity` (prevents compression bomb attacks).
- Rejects any CR/LF (`\r`, `\n`) characters in header keys or values.

---

## 5. Resource Limits & Bounded Phase Lifecycle

The transport defines bounded timeouts across 6 separate phases:
1. **DNS Timeout**: 5,000ms limit for resolution.
2. **Connect Timeout**: 5,000ms TCP connection establishment.
3. **TLS Handshake Timeout**: 5,000ms TLS handshake completion.
4. **Response Header Timeout**: 10,000ms wait for response status & headers.
5. **Idle Response Timeout**: 30,000ms inactivity limit between streaming chunks.
6. **Total Execution Timeout**: Bounded by policy `request_timeout_ms` (default 30,000ms).

On timeout or `AbortSignal` trigger:
- Socket destroyed immediately (`socket.destroy()`).
- In-flight request aborted.
- Ephemeral credential destroyed.
