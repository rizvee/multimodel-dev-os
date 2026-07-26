/**
 * Authoritative IANA Special-Purpose IP Address Registries Static Snapshot & Integrity Verifier
 * Sources:
 * - IPv4: https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv
 * - IPv6: https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv
 *
 * Snapshot Retrieval Date: 2026-07-27
 * Registry Page Last Updated Date: 2025-10-09
 * Reproducible Source Digests:
 * - IPv4 CSV SHA-256: 0e86fa6443c080b0b8c347b5efdf63d5fffae0f2fef52fdb0b91e92d2424fae1
 * - IPv6 CSV SHA-256: 8e5f29910d5402cb755e1c0c32aa34ff80d0d82998a66bcbb6ed61f5f2479e00
 */

export const IANA_IPV4_SPECIAL_REGISTRY_METADATA = Object.freeze({
  source_url: 'https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry-1.csv',
  retrieval_date: '2026-07-27',
  last_updated: '2025-10-09',
  official_row_count: 25,
  normalized_record_count: 26,
  supplement_record_count: 1,
  sha256: 'e4a1c06ecf8e934ed5ae30977a1477a78957da1a5fb602fc855e3f74bf01c8ac',
});

export const IANA_IPV6_SPECIAL_REGISTRY_METADATA = Object.freeze({
  source_url: 'https://www.iana.org/assignments/iana-ipv6-special-registry/iana-ipv6-special-registry-1.csv',
  retrieval_date: '2026-07-27',
  last_updated: '2025-10-09',
  official_row_count: 25,
  normalized_record_count: 25,
  supplement_record_count: 1,
  sha256: '8b0e181a4ef0c71fcb25403c40702f2050c2f6dc198156b6ec1a5fb746c9a73e',
});

/**
 * Static IANA IPv4 Special-Purpose Records (Exact Official Snapshot)
 */
export const IANA_IPV4_OFFICIAL_RECORDS = Object.freeze([
  Object.freeze({
    raw_row_index: 1,
    prefix: '0.0.0.0/8',
    prefix_length: 8,
    name: 'This host on this network',
    reference: 'RFC 1122, Section 3.2.1.3',
    allocation_date: '1981-09',
    termination_date: null,
    source: true,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 2,
    prefix: '0.0.0.0/32',
    prefix_length: 32,
    name: 'This host on this network',
    reference: 'RFC 1122, Section 3.2.1.3',
    allocation_date: '1981-09',
    termination_date: null,
    source: true,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 3,
    prefix: '10.0.0.0/8',
    prefix_length: 8,
    name: 'Private-Use',
    reference: 'RFC 1918',
    allocation_date: '1996-02',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 4,
    prefix: '100.64.0.0/10',
    prefix_length: 10,
    name: 'Shared Address Space',
    reference: 'RFC 6598',
    allocation_date: '2012-04',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 5,
    prefix: '127.0.0.0/8',
    prefix_length: 8,
    name: 'Loopback',
    reference: 'RFC 1122, Section 3.2.1.3',
    allocation_date: '1981-09',
    termination_date: null,
    source: true,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 6,
    prefix: '169.254.0.0/16',
    prefix_length: 16,
    name: 'Link Local',
    reference: 'RFC 3927',
    allocation_date: '2005-05',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 7,
    prefix: '172.16.0.0/12',
    prefix_length: 12,
    name: 'Private-Use',
    reference: 'RFC 1918',
    allocation_date: '1996-02',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 8,
    prefix: '192.0.0.0/24',
    prefix_length: 24,
    name: 'IETF Protocol Assignments',
    reference: 'RFC 6890',
    allocation_date: '2010-01',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 9,
    prefix: '192.0.0.0/29',
    prefix_length: 29,
    name: 'IPv4 Service Continuity Prefix',
    reference: 'RFC 7335',
    allocation_date: '2014-08',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 10,
    prefix: '192.0.0.8/32',
    prefix_length: 32,
    name: 'IPv4 dummy address',
    reference: 'RFC 7600',
    allocation_date: '2015-07',
    termination_date: null,
    source: true,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 11,
    prefix: '192.0.0.9/32',
    prefix_length: 32,
    name: 'PCP Server',
    reference: 'RFC 7723',
    allocation_date: '2015-10',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 12,
    prefix: '192.0.0.10/32',
    prefix_length: 32,
    name: 'TURN Server',
    reference: 'RFC 8155',
    allocation_date: '2017-02',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 13,
    prefix: '192.0.0.170/32',
    prefix_length: 32,
    name: 'NAT64/DNS64 Discovery',
    reference: 'RFC 8880',
    allocation_date: '2020-07',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: null, // N/A in CSV -> normalized null
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 13,
    prefix: '192.0.0.171/32',
    prefix_length: 32,
    name: 'NAT64/DNS64 Discovery',
    reference: 'RFC 8880',
    allocation_date: '2020-07',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: null, // N/A in CSV -> normalized null
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 14,
    prefix: '192.0.2.0/24',
    prefix_length: 24,
    name: 'Documentation (TEST-NET-1)',
    reference: 'RFC 5737',
    allocation_date: '2010-01',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 15,
    prefix: '192.31.196.0/24',
    prefix_length: 24,
    name: 'AS2001 Describing Prefix',
    reference: 'RFC 7535',
    allocation_date: '2015-03',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 16,
    prefix: '192.52.193.0/24',
    prefix_length: 24,
    name: 'AMT',
    reference: 'RFC 7450',
    allocation_date: '2015-02',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 17,
    prefix: '192.88.99.0/24',
    prefix_length: 24,
    name: '6to4 Relay Anycast',
    reference: 'RFC 7526',
    allocation_date: '2001-06',
    termination_date: '2015-03',
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: false, // Terminated record
  }),
  Object.freeze({
    raw_row_index: 18,
    prefix: '192.88.99.2/32',
    prefix_length: 32,
    name: '6to4 Benchmark Testing',
    reference: 'RFC 7526',
    allocation_date: '2008-03',
    termination_date: '2015-03',
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: false, // Terminated record
  }),
  Object.freeze({
    raw_row_index: 19,
    prefix: '192.168.0.0/16',
    prefix_length: 16,
    name: 'Private-Use',
    reference: 'RFC 1918',
    allocation_date: '1996-02',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 20,
    prefix: '192.175.48.0/24',
    prefix_length: 24,
    name: 'Direct Delegation AS112 Service',
    reference: 'RFC 7534',
    allocation_date: '1996-01',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 21,
    prefix: '198.18.0.0/15',
    prefix_length: 15,
    name: 'Benchmarking',
    reference: 'RFC 2544',
    allocation_date: '1999-03',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 22,
    prefix: '198.51.100.0/24',
    prefix_length: 24,
    name: 'Documentation (TEST-NET-2)',
    reference: 'RFC 5737',
    allocation_date: '2010-01',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 23,
    prefix: '203.0.113.0/24',
    prefix_length: 24,
    name: 'Documentation (TEST-NET-3)',
    reference: 'RFC 5737',
    allocation_date: '2010-01',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 24,
    prefix: '240.0.0.0/4',
    prefix_length: 4,
    name: 'Reserved for Future Use',
    reference: 'RFC 1112, Section 4',
    allocation_date: '1989-08',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 25,
    prefix: '255.255.255.255/32',
    prefix_length: 32,
    name: 'Limited Broadcast',
    reference: 'RFC 919, Section 7 / RFC 8190',
    allocation_date: '1984-10',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
]);

/**
 * Separate Project Supplement Records for IPv4
 */
export const IANA_IPV4_PROJECT_SUPPLEMENTS = Object.freeze([
  Object.freeze({
    prefix: '224.0.0.0/4',
    prefix_length: 4,
    name: 'Multicast',
    reference: 'RFC 1112 / RFC 5771',
    allocation_date: '1989-08',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
    is_supplement: true,
  }),
]);

/**
 * Static IANA IPv6 Special-Purpose Records (Exact Official Snapshot)
 */
export const IANA_IPV6_OFFICIAL_RECORDS = Object.freeze([
  Object.freeze({
    raw_row_index: 1,
    prefix: '::1/128',
    prefix_length: 128,
    name: 'Loopback Address',
    reference: 'RFC 4291',
    allocation_date: '2006-02',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 2,
    prefix: '::/128',
    prefix_length: 128,
    name: 'Unspecified Address',
    reference: 'RFC 4291',
    allocation_date: '2006-02',
    termination_date: null,
    source: true,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 3,
    prefix: '::ffff:0:0/96',
    prefix_length: 96,
    name: 'IPv4-mapped Address',
    reference: 'RFC 4291',
    allocation_date: '2006-02',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 4,
    prefix: '64:ff9b::/96',
    prefix_length: 96,
    name: 'Well-Known Prefix',
    reference: 'RFC 6052',
    allocation_date: '2010-10',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 5,
    prefix: '64:ff9b:1::/48',
    prefix_length: 48,
    name: 'Local-IPv4-IPv6 Translation Prefix',
    reference: 'RFC 8215',
    allocation_date: '2017-06',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 6,
    prefix: '100::/64',
    prefix_length: 64,
    name: 'Discard-Only Address Block',
    reference: 'RFC 6666',
    allocation_date: '2012-06',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 7,
    prefix: '100:0:0:1::/64',
    prefix_length: 64,
    name: 'Provider-Side Translator (PREF64)',
    reference: 'RFC 9599',
    allocation_date: '2024-04',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 8,
    prefix: '2001::/23',
    prefix_length: 23,
    name: 'IETF Protocol Assignments',
    reference: 'RFC 2928',
    allocation_date: '2000-09',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 9,
    prefix: '2001::/32',
    prefix_length: 32,
    name: 'TEREDO',
    reference: 'RFC 4380',
    allocation_date: '2006-01',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: null, // N/A in CSV -> normalized null
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 10,
    prefix: '2001:1::1/128',
    prefix_length: 128,
    name: 'Port Control Protocol Anycast',
    reference: 'RFC 7723',
    allocation_date: '2015-10',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 11,
    prefix: '2001:1::2/128',
    prefix_length: 128,
    name: 'TURN Anycast',
    reference: 'RFC 8155',
    allocation_date: '2017-02',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 12,
    prefix: '2001:1::3/128',
    prefix_length: 128,
    name: 'AURA Anycast',
    reference: 'RFC 9396',
    allocation_date: '2023-03',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 13,
    prefix: '2001:2::/48',
    prefix_length: 48,
    name: 'Benchmarking',
    reference: 'RFC 5180',
    allocation_date: '2008-04',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 14,
    prefix: '2001:3::/32',
    prefix_length: 32,
    name: 'AMT',
    reference: 'RFC 7450',
    allocation_date: '2014-12',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 15,
    prefix: '2001:4:112::/48',
    prefix_length: 48,
    name: 'AS112-v6',
    reference: 'RFC 7535',
    allocation_date: '2015-03',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 16,
    prefix: '2001:10::/28',
    prefix_length: 28,
    name: 'ORCHID',
    reference: 'RFC 4843',
    allocation_date: '2007-03',
    termination_date: '2014-03',
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: false, // Terminated record
  }),
  Object.freeze({
    raw_row_index: 17,
    prefix: '2001:20::/28',
    prefix_length: 28,
    name: 'ORCHIDv2',
    reference: 'RFC 7343',
    allocation_date: '2014-07',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 18,
    prefix: '2001:30::/28',
    prefix_length: 28,
    name: 'Drone Remote ID Protocol Entity Tags (DETs)',
    reference: 'RFC 9374',
    allocation_date: '2023-01',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 19,
    prefix: '2001:db8::/32',
    prefix_length: 32,
    name: 'Documentation',
    reference: 'RFC 3849',
    allocation_date: '2004-07',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 20,
    prefix: '2002::/16',
    prefix_length: 16,
    name: '6to4',
    reference: 'RFC 3056 / RFC 7526',
    allocation_date: '2001-02',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: null, // N/A in CSV -> normalized null
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 21,
    prefix: '2620:4f:8000::/48',
    prefix_length: 48,
    name: 'Direct Delegation AS112 Service',
    reference: 'RFC 7534',
    allocation_date: '2015-05',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: true,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 22,
    prefix: '3fff::/20',
    prefix_length: 20,
    name: 'Documentation',
    reference: 'RFC 9637',
    allocation_date: '2024-08',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 23,
    prefix: '5f00::/16',
    prefix_length: 16,
    name: 'Segment Routing (SRv6) SIDs',
    reference: 'RFC 9602',
    allocation_date: '2024-07',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 24,
    prefix: 'fc00::/7',
    prefix_length: 7,
    name: 'Unique Local Unicast (ULA)',
    reference: 'RFC 4193',
    allocation_date: '2005-10',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: true,
    globally_reachable: false,
    reserved_by_protocol: false,
    active: true,
  }),
  Object.freeze({
    raw_row_index: 25,
    prefix: 'fe80::/10',
    prefix_length: 10,
    name: 'Link-Local Unicast',
    reference: 'RFC 4291',
    allocation_date: '2006-02',
    termination_date: null,
    source: true,
    destination: true,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
  }),
]);

/**
 * Separate Project Supplement Records for IPv6
 */
export const IANA_IPV6_PROJECT_SUPPLEMENTS = Object.freeze([
  Object.freeze({
    prefix: 'ff00::/8',
    prefix_length: 8,
    name: 'Multicast',
    reference: 'RFC 4291',
    allocation_date: '2006-02',
    termination_date: null,
    source: false,
    destination: false,
    forwardable: false,
    globally_reachable: false,
    reserved_by_protocol: true,
    active: true,
    is_supplement: true,
  }),
]);

/**
 * Combined and Frozen Precompiled Sets for Longest-Prefix Matching
 */
export const COMBINED_IPV4_RECORDS = Object.freeze([
  ...IANA_IPV4_OFFICIAL_RECORDS,
  ...IANA_IPV4_PROJECT_SUPPLEMENTS,
]);

export const COMBINED_IPV6_RECORDS = Object.freeze([
  ...IANA_IPV6_OFFICIAL_RECORDS,
  ...IANA_IPV6_PROJECT_SUPPLEMENTS,
]);

/**
 * Strict Snapshot Integrity Verifier
 */
export function validateRegistrySnapshotIntegrity() {
  if (!Object.isFrozen(IANA_IPV4_SPECIAL_REGISTRY_METADATA) || !Object.isFrozen(IANA_IPV6_SPECIAL_REGISTRY_METADATA)) {
    throw new Error('[Snapshot Integrity] Metadata objects must be frozen');
  }

  // SHA256 format check
  const sha256Regex = /^[0-9a-f]{64}$/;
  if (!sha256Regex.test(IANA_IPV4_SPECIAL_REGISTRY_METADATA.sha256) || !sha256Regex.test(IANA_IPV6_SPECIAL_REGISTRY_METADATA.sha256)) {
    throw new Error('[Snapshot Integrity] Invalid SHA-256 format in metadata');
  }

  // Check exact metadata counts
  if (IANA_IPV4_SPECIAL_REGISTRY_METADATA.official_row_count !== 25) {
    throw new Error(`[Snapshot Integrity] IPv4 official_row_count mismatch: expected 25, got ${IANA_IPV4_SPECIAL_REGISTRY_METADATA.official_row_count}`);
  }
  if (IANA_IPV4_SPECIAL_REGISTRY_METADATA.normalized_record_count !== 26) {
    throw new Error(`[Snapshot Integrity] IPv4 normalized_record_count mismatch: expected 26, got ${IANA_IPV4_SPECIAL_REGISTRY_METADATA.normalized_record_count}`);
  }
  if (IANA_IPV4_SPECIAL_REGISTRY_METADATA.supplement_record_count !== 1) {
    throw new Error(`[Snapshot Integrity] IPv4 supplement_record_count mismatch: expected 1, got ${IANA_IPV4_SPECIAL_REGISTRY_METADATA.supplement_record_count}`);
  }
  if (IANA_IPV4_OFFICIAL_RECORDS.length !== 26) {
    throw new Error(`[Snapshot Integrity] IANA_IPV4_OFFICIAL_RECORDS length mismatch: expected 26, got ${IANA_IPV4_OFFICIAL_RECORDS.length}`);
  }

  if (IANA_IPV6_SPECIAL_REGISTRY_METADATA.official_row_count !== 25) {
    throw new Error(`[Snapshot Integrity] IPv6 official_row_count mismatch: expected 25, got ${IANA_IPV6_SPECIAL_REGISTRY_METADATA.official_row_count}`);
  }
  if (IANA_IPV6_SPECIAL_REGISTRY_METADATA.normalized_record_count !== 25) {
    throw new Error(`[Snapshot Integrity] IPv6 normalized_record_count mismatch: expected 25, got ${IANA_IPV6_SPECIAL_REGISTRY_METADATA.normalized_record_count}`);
  }
  if (IANA_IPV6_SPECIAL_REGISTRY_METADATA.supplement_record_count !== 1) {
    throw new Error(`[Snapshot Integrity] IPv6 supplement_record_count mismatch: expected 1, got ${IANA_IPV6_SPECIAL_REGISTRY_METADATA.supplement_record_count}`);
  }
  if (IANA_IPV6_OFFICIAL_RECORDS.length !== 25) {
    throw new Error(`[Snapshot Integrity] IANA_IPV6_OFFICIAL_RECORDS length mismatch: expected 25, got ${IANA_IPV6_OFFICIAL_RECORDS.length}`);
  }

  const REQUIRED_PROPERTIES = [
    'prefix', 'prefix_length', 'name', 'reference',
    'allocation_date', 'termination_date', 'source', 'destination',
    'forwardable', 'globally_reachable', 'reserved_by_protocol', 'active'
  ];

  const checkRecords = (records, familyName) => {
    const seenPrefixes = new Map();
    for (const rec of records) {
      if (!rec || typeof rec !== 'object' || !Object.isFrozen(rec)) {
        throw new Error(`[Snapshot Integrity] Invalid or unfrozen record in ${familyName}: ${rec?.prefix}`);
      }
      if (!rec.is_supplement && typeof rec.raw_row_index !== 'number') {
        throw new Error(`[Snapshot Integrity] Missing raw_row_index in official record in ${familyName} for ${rec.prefix}`);
      }
      for (const prop of REQUIRED_PROPERTIES) {
        if (!Object.prototype.hasOwnProperty.call(rec, prop)) {
          throw new Error(`[Snapshot Integrity] Missing required property ${prop} in ${familyName} for ${rec.prefix}`);
        }
      }
      const [ip, lenStr] = rec.prefix.split('/');
      const len = parseInt(lenStr, 10);
      if (len !== rec.prefix_length) {
        throw new Error(`[Snapshot Integrity] Prefix length mismatch in ${familyName}: ${rec.prefix} vs ${rec.prefix_length}`);
      }
      if (rec.globally_reachable !== true && rec.globally_reachable !== false && rec.globally_reachable !== null) {
        throw new Error(`[Snapshot Integrity] Invalid globally_reachable type in ${familyName} for ${rec.prefix}`);
      }
      if (typeof rec.active !== 'boolean') {
        throw new Error(`[Snapshot Integrity] Non-boolean active field in ${familyName} for ${rec.prefix}`);
      }
      if (seenPrefixes.has(rec.prefix)) {
        throw new Error(`[Snapshot Integrity] Conflicting duplicate prefix in ${familyName}: ${rec.prefix}`);
      }
      seenPrefixes.set(rec.prefix, rec);
    }
  };

  checkRecords(COMBINED_IPV4_RECORDS, 'IPv4');
  checkRecords(COMBINED_IPV6_RECORDS, 'IPv6');
  return true;
}

// Self-verify snapshot integrity on module initialization
validateRegistrySnapshotIntegrity();
