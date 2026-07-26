import { describe, it, expect } from 'vitest';
import {
  parseCanonicalIPv6,
  classifyIPv6Address,
} from '../../src/gateway/transport/ipv6-policy.js';
import {
  IANA_IPV6_SPECIAL_RECORDS,
  IANA_IPV6_SPECIAL_REGISTRY_METADATA,
} from '../../src/gateway/transport/registry-snapshot.js';

describe('IPv6 Transport Policy & Registry Snapshot Integrity', () => {
  it('preserves expected metadata and normalized record counts in snapshot', () => {
    expect(IANA_IPV6_SPECIAL_REGISTRY_METADATA.source_url).toContain('iana-ipv6-special-registry-1.csv');
    expect(IANA_IPV6_SPECIAL_REGISTRY_METADATA.last_updated).toBe('2025-10-09');
    expect(IANA_IPV6_SPECIAL_REGISTRY_METADATA.normalized_record_count).toBe(20);
    expect(IANA_IPV6_SPECIAL_RECORDS.length).toBeGreaterThanOrEqual(20);
  });

  it('parses valid RFC 5952 canonical IPv6 addresses', () => {
    const validVector = [
      '2001:db8::1',
      '2607:f8b0:4005:805::200e',
      '::1',
      '::',
      'fe80::1',
      'ff02::1',
      '::ffff:192.0.2.1',
    ];
    for (const ip of validVector) {
      const res = parseCanonicalIPv6(ip);
      expect(res.success).toBe(true);
      expect(res.normalized_address).toBe(ip);
    }
  });

  it('classifies critical IANA IPv6 regression vectors accurately', () => {
    // 2001:1::1, ::2, ::3 select /128 records (allowed)
    expect(classifyIPv6Address('2001:1::1').allowed).toBe(true);
    expect(classifyIPv6Address('2001:1::2').allowed).toBe(true);
    expect(classifyIPv6Address('2001:1::3').allowed).toBe(true);
    expect(classifyIPv6Address('2001:1::1').matched_prefix).toBe('2001:1::1/128');

    // 2001:1::4 falls back to parent 2001::/23 (denied)
    expect(classifyIPv6Address('2001:1::4').allowed).toBe(false);

    // 2001:20::1 (ORCHIDv2) denied
    expect(classifyIPv6Address('2001:20::1').allowed).toBe(false);
    expect(classifyIPv6Address('2001:20::1').matched_prefix).toBe('2001:20::/28');

    // 2001:30::1 (DETs) denied
    expect(classifyIPv6Address('2001:30::1').allowed).toBe(false);
    expect(classifyIPv6Address('2001:30::1').matched_prefix).toBe('2001:30::/28');

    // TEREDO (2001::1) & 6to4 (2002::1) fail closed (N/A in registry)
    expect(classifyIPv6Address('2001::1').allowed).toBe(false);
    expect(classifyIPv6Address('2002::1').allowed).toBe(false);

    // 64:ff9b::1 allowed (64:ff9b::/96)
    expect(classifyIPv6Address('64:ff9b::1').allowed).toBe(true);

    // 64:ff9b:1::1 denied (64:ff9b:1::/48)
    expect(classifyIPv6Address('64:ff9b:1::1').allowed).toBe(false);

    // 100:0:0:1::1 denied (100:0:0:1::/64)
    expect(classifyIPv6Address('100:0:0:1::1').allowed).toBe(false);

    // 3fff::1 denied (3fff::/20)
    expect(classifyIPv6Address('3fff::1').allowed).toBe(false);

    // 5f00::1 denied (5f00::/16)
    expect(classifyIPv6Address('5f00::1').allowed).toBe(false);
  });
});
