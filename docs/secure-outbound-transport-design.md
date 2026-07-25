# Secure Outbound Transport Design

This document details the zero-runtime-dependency outbound transport architecture designed for MultiModel Dev OS v4.3.

---

## 1. Node.js Standard Library Architecture

The transport is built strictly using Node.js standard-library modules:
- `node:https`: Client HTTP request creation over TLS.
- `node:dns/promises`: Non-blocking asynchronous DNS resolution.
- `node:net`: Low-level TCP socket address checks and family detection.
- `node:tls`: TLS connection options and certificate hostname verification.
- `node:stream`: Stream handling and AsyncIterable adapters.

---

## 2. Address & Destination Policy

### URL Parsing & Canonicalization
All provider endpoints undergo strict canonicalization prior to resolution:
- **Scheme**: Must be strictly `https:`. Insecure `http:` is rejected.
- **User Info**: URLs containing username or password (e.g. `https://user:pass@host`) are rejected.
- **Fragments & Query**: Fragments (`#...`) are stripped; query strings are rejected unless explicitly allowed by endpoint contract.
- **Port**: Must be explicit default `443` or allowed standard HTTPS port.
- **Hostname Normalization**: Converted to lowercase ASCII; trailing dots stripped; Unicode/IDN hostnames resolved via punycode.

### IP Address Classification (IPv4 & IPv6)
All resolved IP addresses are evaluated against strict fail-closed rejection rules:
- **IPv4 Forbidden Ranges**:
  - `0.0.0.0/8` (Unspecified / Current network)
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private-use RFC 1918)
  - `169.254.0.0/16` (Link-local)
  - `224.0.0.0/4` (Multicast)
  - `240.0.0.0/4` (Reserved / Future use)
  - `255.255.255.255/32` (Broadcast)
  - `100.64.0.0/10` (Carrier-Grade NAT)
  - `192.0.0.0/24` (IETF Protocol Assignments)
  - `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` (Documentation / TEST-NET)
  - `198.18.0.0/15` (Benchmarking)
- **IPv6 Forbidden Ranges**:
  - `::/128` (Unspecified)
  - `::1/128` (Loopback)
  - `fc00::/7` (Unique Local Unicast - ULA)
  - `fe80::/10` (Link-Local Unicast)
  - `ff00::/8` (Multicast)
  - `2001:db8::/32` (Documentation)
  - `::ffff:0:0/96` (IPv4-mapped IPv6 addresses - mapped IPv4 portion must be classified against IPv4 rules)

### Resolution & Fail-Closed Strategy
- Hostnames are resolved using `dns.resolve4()` and `dns.resolve6()`.
- Every returned IP address must be classified as public. If **any** returned address belongs to a forbidden range, the endpoint resolution fails closed immediately.

---

## 3. DNS Rebinding & TOCTOU Protection

To eliminate Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding vulnerabilities:
1. Resolve target hostname to IP addresses.
2. Validate all returned addresses against IP classification policy.
3. Select an approved IP address deterministically (e.g. first public IPv4/IPv6).
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
