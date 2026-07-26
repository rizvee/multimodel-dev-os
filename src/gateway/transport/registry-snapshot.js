/**
 * IANA Special-Purpose IP Address Registries Static Snapshot
 * Sources:
 * - IPv4: https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv
 * - IPv6: https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv
 *
 * Snapshot Retrieval Date: 2026-07-26
 * Registry Last Updated Dates:
 * - IPv4: 2024-11-25
 * - IPv6: 2024-05-15
 */

export const IANA_IPV4_SPECIAL_REGISTRY_METADATA = Object.freeze({
  source_url: 'https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv',
  retrieval_date: '2026-07-26',
  last_updated: '2024-11-25',
});

export const IANA_IPV6_SPECIAL_REGISTRY_METADATA = Object.freeze({
  source_url: 'https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv',
  retrieval_date: '2026-07-26',
  last_updated: '2024-05-15',
});

/**
 * Static IANA IPv4 Special-Purpose & Non-Unicast Ranges
 * Ordered by prefix length (longest prefix first) for matching.
 */
export const IANA_IPV4_SPECIAL_RECORDS = Object.freeze([
  // Broadcast
  Object.freeze({
    prefix: '255.255.255.255/32',
    prefix_length: 32,
    name: 'Limited Broadcast',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 919, Section 7 / RFC 8190',
  }),
  // Loopback
  Object.freeze({
    prefix: '127.0.0.0/8',
    prefix_length: 8,
    name: 'Loopback',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 1122, Section 3.2.1.3',
  }),
  // Private-Use Networks (RFC 1918)
  Object.freeze({
    prefix: '10.0.0.0/8',
    prefix_length: 8,
    name: 'Private-Use',
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 1918',
  }),
  Object.freeze({
    prefix: '172.16.0.0/12',
    prefix_length: 12,
    name: 'Private-Use',
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 1918',
  }),
  Object.freeze({
    prefix: '192.168.0.0/16',
    prefix_length: 16,
    name: 'Private-Use',
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 1918',
  }),
  // Shared Address Space (CGNAT)
  Object.freeze({
    prefix: '100.64.0.0/10',
    prefix_length: 10,
    name: 'Shared Address Space',
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 6598',
  }),
  // Link Local
  Object.freeze({
    prefix: '169.254.0.0/16',
    prefix_length: 16,
    name: 'Link Local',
    destination: true,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 3927',
  }),
  // This host on this network
  Object.freeze({
    prefix: '0.0.0.0/8',
    prefix_length: 8,
    name: 'This host on this network',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 1122, Section 3.2.1.3',
  }),
  // IETF Protocol Assignments Exception (Global Reachable)
  Object.freeze({
    prefix: '192.0.0.9/32',
    prefix_length: 32,
    name: 'PCP Server',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 7723',
  }),
  Object.freeze({
    prefix: '192.0.0.10/32',
    prefix_length: 32,
    name: 'TURN Server',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 8155',
  }),
  Object.freeze({
    prefix: '192.0.0.170/32',
    prefix_length: 32,
    name: 'NAT64/DNS64 Discovery',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 8880',
  }),
  Object.freeze({
    prefix: '192.0.0.171/32',
    prefix_length: 32,
    name: 'NAT64/DNS64 Discovery',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 8880',
  }),
  Object.freeze({
    prefix: '192.0.0.0/24',
    prefix_length: 24,
    name: 'IETF Protocol Assignments',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 6890',
  }),
  // Documentation / TEST-NET
  Object.freeze({
    prefix: '192.0.2.0/24',
    prefix_length: 24,
    name: 'Documentation (TEST-NET-1)',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 5737',
  }),
  Object.freeze({
    prefix: '198.51.100.0/24',
    prefix_length: 24,
    name: 'Documentation (TEST-NET-2)',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 5737',
  }),
  Object.freeze({
    prefix: '203.0.113.0/24',
    prefix_length: 24,
    name: 'Documentation (TEST-NET-3)',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 5737',
  }),
  // Benchmarking
  Object.freeze({
    prefix: '198.18.0.0/15',
    prefix_length: 15,
    name: 'Benchmarking',
    destination: true,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 2544',
  }),
  // AMT
  Object.freeze({
    prefix: '192.52.193.0/24',
    prefix_length: 24,
    name: 'AMT',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 7450',
  }),
  // 6to4 Relay Anycast
  Object.freeze({
    prefix: '192.88.99.0/24',
    prefix_length: 24,
    name: '6to4 Relay Anycast',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 7526',
  }),
  // Reserved / Multicast / Future Use
  Object.freeze({
    prefix: '224.0.0.0/4',
    prefix_length: 4,
    name: 'Multicast',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 1112 / RFC 5771',
  }),
  Object.freeze({
    prefix: '240.0.0.0/4',
    prefix_length: 4,
    name: 'Reserved for Future Use',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 1112, Section 4',
  }),
]);

/**
 * Static IANA IPv6 Special-Purpose & Non-Unicast Ranges
 * Ordered by prefix length (longest prefix first) for matching.
 */
export const IANA_IPV6_SPECIAL_RECORDS = Object.freeze([
  // Node-Local / Loopback / Unspecified
  Object.freeze({
    prefix: '::1/128',
    prefix_length: 128,
    name: 'Loopback Address',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 4291',
  }),
  Object.freeze({
    prefix: '::/128',
    prefix_length: 128,
    name: 'Unspecified Address',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 4291',
  }),
  // IPv4-mapped IPv6 prefix
  Object.freeze({
    prefix: '::ffff:0:0/96',
    prefix_length: 96,
    name: 'IPv4-mapped IPv6',
    destination: true,
    forwardable: true,
    globally_reachable: false, // Handled via mapped IPv4 policy classification
    reserved_by_protocol: true,
    reference: 'RFC 4291',
  }),
  // IPv4-translated IPv6
  Object.freeze({
    prefix: '::ffff:0:0:0/96',
    prefix_length: 96,
    name: 'IPv4-translated Address',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 2765 / RFC 6052',
  }),
  // Discard Prefix
  Object.freeze({
    prefix: '100::/64',
    prefix_length: 64,
    name: 'Discard-Only Address Block',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 6666',
  }),
  // IETF Protocol Assignments
  Object.freeze({
    prefix: '2001::/23',
    prefix_length: 23,
    name: 'IETF Protocol Assignments',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 2928',
  }),
  // TEREDO (within 2001::/32)
  Object.freeze({
    prefix: '2001::/32',
    prefix_length: 32,
    name: 'TEREDO',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 4380',
  }),
  // Port Control Protocol Anycast
  Object.freeze({
    prefix: '2001:1::1/128',
    prefix_length: 128,
    name: 'Port Control Protocol Anycast',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 7723',
  }),
  // Traversal Using Relays around NAT (TURN) Anycast
  Object.freeze({
    prefix: '2001:1::2/128',
    prefix_length: 128,
    name: 'TURN Anycast',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 8155',
  }),
  // Benchmarking
  Object.freeze({
    prefix: '2001:2::/48',
    prefix_length: 48,
    name: 'Benchmarking',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 5180',
  }),
  // AMT
  Object.freeze({
    prefix: '2001:3::/32',
    prefix_length: 32,
    name: 'AMT',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 7450',
  }),
  // AS112-v6
  Object.freeze({
    prefix: '2001:4:112::/48',
    prefix_length: 48,
    name: 'AS112-v6',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 7535',
  }),
  // ORCHIDv2
  Object.freeze({
    prefix: '2001:10::/28',
    prefix_length: 28,
    name: 'ORCHIDv2',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 7343',
  }),
  // Documentation
  Object.freeze({
    prefix: '2001:db8::/32',
    prefix_length: 32,
    name: 'Documentation',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 3849',
  }),
  // 6to4
  Object.freeze({
    prefix: '2002::/16',
    prefix_length: 16,
    name: '6to4',
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    reference: 'RFC 3056',
  }),
  // Unique Local Unicast (ULA)
  Object.freeze({
    prefix: 'fc00::/7',
    prefix_length: 7,
    name: 'Unique Local Unicast (ULA)',
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    reference: 'RFC 4193',
  }),
  // Link-Local Unicast
  Object.freeze({
    prefix: 'fe80::/10',
    prefix_length: 10,
    name: 'Link-Local Unicast',
    destination: true,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 4291',
  }),
  // Multicast
  Object.freeze({
    prefix: 'ff00::/8',
    prefix_length: 8,
    name: 'Multicast',
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    reference: 'RFC 4291',
  }),
]);
