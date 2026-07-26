import { describe, it, expect } from 'vitest';
import {
  parseCanonicalIPv6,
  classifyIPv6Address,
} from '../../src/gateway/transport/ipv6-policy.js';

describe('IPv6 Transport Policy', () => {
  it('parses valid RFC 5952 canonical IPv6 addresses', () => {
    const validVector = [
      '2001:db8::1',
      '2607:f8b0:4005:805::200e',
      '::1',
      '::',
      'fe80::1',
      'ff02::1',
      '::ffff:192.0.2.1', // canonical mapped IPv4
    ];
    for (const ip of validVector) {
      const res = parseCanonicalIPv6(ip);
      expect(res.success).toBe(true);
      expect(res.normalized_address).toBe(ip);
      expect(res.words).toHaveLength(8);
    }
  });

  it('rejects non-canonical RFC 5952 and malformed IPv6 representations', () => {
    const invalidVector = [
      '2001:0db8::1', // leading zeros in hex word
      '2001:DB8::1', // uppercase
      '::1::2', // multiple double colons
      'fe80::1%eth0', // scope/zone identifier
      '[2001:db8::1]', // brackets in address parser
      '1:2:3:4:5:6:7:8:9', // 9 segments
      '::ffff:127.000.000.001', // non-canonical mapped octal
      '::ffff:256.1.1.1', // out of range mapped
    ];
    for (const ip of invalidVector) {
      const res = parseCanonicalIPv6(ip);
      expect(res.success).toBe(false);
    }
  });

  it('classifies public global unicast IPv6 as allowed', () => {
    const publicVector = ['2607:f8b0:4005:805::200e', '2001:4860:4860::8888'];
    for (const ip of publicVector) {
      const cls = classifyIPv6Address(ip);
      expect(cls.globally_reachable).toBe(true);
      expect(cls.allowed).toBe(true);
      expect(cls.family).toBe(6);
    }
  });

  it('classifies non-global / special IPv6 ranges as disallowed', () => {
    const nonGlobalVector = [
      '::1', // loopback
      '::', // unspecified
      'fe80::1', // link-local
      'fc00::1', // ULA
      'fd00::1', // ULA
      'ff02::1', // multicast
      '2001:db8::1', // documentation
      '::ffff:10.0.0.1', // mapped private IPv4
      '::ffff:127.0.0.1', // mapped loopback IPv4
      '::ffff:169.254.169.254', // mapped link local
    ];
    for (const ip of nonGlobalVector) {
      const cls = classifyIPv6Address(ip);
      expect(cls.globally_reachable).toBe(false);
      expect(cls.allowed).toBe(false);
    }
  });

  it('allows public IPv4-mapped IPv6 addresses', () => {
    const publicMapped = '::ffff:8.8.8.8';
    const cls = classifyIPv6Address(publicMapped);
    expect(cls.globally_reachable).toBe(true);
    expect(cls.allowed).toBe(true);
  });
});
