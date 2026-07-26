# Destination & Address Policy Specification (Sprint F1 Hardened)

## Overview
Sprint F1 implements pure destination, IP-address, and resolved-address policies under `src/gateway/transport/`.
It contains **zero network primitives**, **zero DNS lookups**, **zero socket creation**, and **zero production runtime transport code**. Sprint F2 remains blocked until this closure is pushed and verified.

## Key Modules
- `[registry-snapshot.js](file:///f:/multimodel-dev-os/src/gateway/transport/registry-snapshot.js)`: Static snapshot of IANA IPv4 and IPv6 special-purpose registries with SHA-256 digests and initialization-time integrity verification.
- `[ipv4-policy.js](file:///f:/multimodel-dev-os/src/gateway/transport/ipv4-policy.js)`: Strict decimal IPv4 parser and true longest-prefix CIDR classifier.
- `[ipv6-policy.js](file:///f:/multimodel-dev-os/src/gateway/transport/ipv6-policy.js)`: Strict RFC 5952 canonical IPv6 parser and true longest-prefix CIDR classifier with `2000::/3` global unicast boundary enforcement.
- `[address-policy.js](file:///f:/multimodel-dev-os/src/gateway/transport/address-policy.js)`: Universal classifier and accessor-safe resolved address set evaluator (`evaluateResolvedAddressSet`).
- `[destination-policy.js](file:///f:/multimodel-dev-os/src/gateway/transport/destination-policy.js)`: Bounded raw authority parser (`evaluateDestinationUrl`) and recursive multi-pass path safety evaluator (`evaluatePathSafety`).
- `[resolver-contract.js](file:///f:/multimodel-dev-os/src/gateway/transport/resolver-contract.js)`: Descriptor-level contract validator for injectable DNS resolver interfaces (`validateResolverInterface`).
- `[normalize-iana-special-registry.js](file:///f:/multimodel-dev-os/scripts/maintain/normalize-iana-special-registry.js)`: Reproducible offline generator and `--check` verifier.

## Authoritative Counts, Provenance & Digest Integrity
- **Official IANA Registries**:
  - IPv4: `https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv`
  - IPv6: `https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv`
- **Retrieval Date**: `2026-07-27`
- **Registry Last Updated Date**: `2025-10-09`
- **Exact Counts**:
  - IPv4 Official Rows: `25`
  - IPv4 Official Normalized Prefixes: `26` (expanding `192.0.0.170/32` and `192.0.0.171/32`)
  - IPv4 Project Supplements: `1` (`224.0.0.0/4`)
  - IPv6 Official Rows: `25`
  - IPv6 Official Normalized Prefixes: `25` (including `2001:10::/28` terminated)
  - IPv6 Project Supplements: `1` (`ff00::/8`)
- **CSV SHA-256 Digests**:
  - IPv4 CSV SHA-256: `e4a1c06ecf8e934ed5ae30977a1477a78957da1a5fb602fc855e3f74bf01c8ac`
  - IPv6 CSV SHA-256: `8b0e181a4ef0c71fcb25403c40702f2050c2f6dc198156b6ec1a5fb746c9a73e`

## Policy Rules & Fail-Closed Guardrails
1. **Official Preservation vs. Effective Allow Policy**: Official raw values (`null`, `N/A`, `blank`, `terminated`) are preserved without alteration. The effective allow rule strictly requires `active === true && destination === true && globally_reachable === true`.
2. **NAT64 Embedded IPv4 Override**: `64:ff9b::/96` extracts the embedded 32-bit IPv4 address and evaluates it through IPv4 policy. Non-global IPv4s (e.g. `10.0.0.1`) are denied.
3. **IPv6 2000::/3 Boundary**: Unmatched IPv6 addresses inside `2000::/3` default to Global Unicast allow. Unmatched addresses outside `2000::/3` (e.g. `4000::1`, `8000::1`, `fec0::1`) are denied.
4. **Recursive Path Safety**: Paths undergo up to 3 decode passes. Control characters (`[\x00-\x1f\x7f]`), separators (`/`, `\`), traversal (`..`), and NUL bytes are checked before and after every pass.
5. **Proxy & Property Descriptor Safety**: `evaluateResolvedAddressSet` and `validateResolverInterface` use `safeGetPrototypeOf`, `safeGetOwnPropertyNames`, and `safeGetOwnPropertyDescriptor` inside `try/catch` to reject throwing Proxy traps, accessors, symbol keys, and prototype pollution.
