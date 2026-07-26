# Destination & Address Policy (Sprint F1)

## Overview
Sprint F1 introduces zero-dependency, pure, deterministic destination URL and IP address policy modules for the MultiModel Dev OS Gateway.

All transport modules reside under:
`src/gateway/transport/`

They are side-effect-free, perform no DNS resolution or network socket creation, and open no connections.

## Modules

- `registry-snapshot.js`: Frozen static snapshot of official IANA Special-Purpose IP Address Registries (IPv4 and IPv6) with source URLs, retrieval dates, last-updated dates, and RFC references.
- `ipv4-policy.js`: Strict decimal-only IPv4 parser (`parseCanonicalIPv4`) and longest-prefix address classifier (`classifyIPv4Address`).
- `ipv6-policy.js`: Strict RFC 5952 canonical IPv6 parser (`parseCanonicalIPv6`) with IPv4-mapped IPv6 support and address classifier (`classifyIPv6Address`).
- `address-policy.js`: Universal `classifyAddress` function and fail-closed `evaluateResolvedAddressSet` evaluator.
- `destination-policy.js`: Pure HTTPS destination URL validator (`evaluateDestinationUrl`) enforcing strict scheme, path, query/fragment/userinfo absence, and non-global IP literal checks.
- `resolver-contract.js`: Injectable DNS resolver interface validator (`validateResolverInterface`).

## Key Security Guarantee
1. **Fail-Closed Resolution Sets**: If any IP address in a resolved set fails public global reachability checks, the entire set is rejected.
2. **Pure & Offline**: F1 code contains no network, socket, DNS query, or HTTP/HTTPS primitives.
3. **Planned Sprints**: Network transport execution and native DNS resolution remain planned for Sprint F2.
