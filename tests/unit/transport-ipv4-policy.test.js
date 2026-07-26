import { describe, it, expect } from 'vitest';
import {
  parseCanonicalIPv4,
  classifyIPv4Address,
} from '../../src/gateway/transport/ipv4-policy.js';

describe('IPv4 Transport Policy', () => {
  it('parses valid canonical IPv4 addresses', () => {
    const validVector = [
      '1.1.1.1',
      '8.8.8.8',
      '93.184.216.34',
      '140.82.121.4',
      '0.0.0.0',
      '255.255.255.255',
    ];
    for (const ip of validVector) {
      const res = parseCanonicalIPv4(ip);
      expect(res.success).toBe(true);
      expect(res.normalized_address).toBe(ip);
      expect(typeof res.numeric_value).toBe('number');
      expect(res.octets).toHaveLength(4);
    }
  });

  it('rejects non-canonical and malformed IPv4 representations', () => {
    const invalidVector = [
      '127.1', // shortened
      '0177.0.0.1', // octal leading zero
      '127.000.000.001', // excessive leading zeros
      '0x7f000001', // hex
      '2130706433', // dword
      '-1.2.3.4', // signed
      '+1.2.3.4', // signed
      ' 1.1.1.1', // leading space
      '1.1.1.1 ', // trailing space
      '1.1.1.1.', // trailing dot
      '256.0.0.1', // octet out of range
      '1.2.3.4.5', // 5 octets
      '1..3.4', // empty octet
      'abc.def.ghi.jkl', // non-numeric
    ];
    for (const ip of invalidVector) {
      const res = parseCanonicalIPv4(ip);
      expect(res.success).toBe(false);
    }
  });

  it('classifies public addresses as globally reachable and allowed', () => {
    const publicIps = ['8.8.8.8', '1.1.1.1', '93.184.216.34', '140.82.121.4'];
    for (const ip of publicIps) {
      const cls = classifyIPv4Address(ip);
      expect(cls.globally_reachable).toBe(true);
      expect(cls.allowed).toBe(true);
      expect(cls.family).toBe(4);
    }
  });

  it('classifies forbidden non-global ranges as disallowed', () => {
    const forbiddenVector = [
      { ip: '127.0.0.1', name: 'Loopback' },
      { ip: '10.0.0.1', name: 'Private-Use' },
      { ip: '172.16.0.1', name: 'Private-Use' },
      { ip: '192.168.1.1', name: 'Private-Use' },
      { ip: '100.64.0.1', name: 'Shared Address Space' },
      { ip: '169.254.169.254', name: 'Link Local' },
      { ip: '0.0.0.0', name: 'This host on this network' },
      { ip: '192.0.2.1', name: 'Documentation (TEST-NET-1)' },
      { ip: '198.51.100.1', name: 'Documentation (TEST-NET-2)' },
      { ip: '203.0.113.1', name: 'Documentation (TEST-NET-3)' },
      { ip: '198.18.0.1', name: 'Benchmarking' },
      { ip: '224.0.0.1', name: 'Multicast' },
      { ip: '240.0.0.1', name: 'Reserved for Future Use' },
      { ip: '255.255.255.255', name: 'Limited Broadcast' },
    ];
    for (const { ip } of forbiddenVector) {
      const cls = classifyIPv4Address(ip);
      expect(cls.globally_reachable).toBe(false);
      expect(cls.allowed).toBe(false);
    }
  });

  it('correctly respects longest-prefix IANA exceptions (e.g. 192.0.0.9 vs 192.0.0.0/24)', () => {
    // 192.0.0.0/24 is reserved/non-global
    const generalP = classifyIPv4Address('192.0.0.1');
    expect(generalP.globally_reachable).toBe(false);
    expect(generalP.allowed).toBe(false);

    // 192.0.0.9/32 is PCP Server exception (globally reachable)
    const exceptionP = classifyIPv4Address('192.0.0.9');
    expect(exceptionP.globally_reachable).toBe(true);
    expect(exceptionP.allowed).toBe(true);
    expect(exceptionP.matched_prefix).toBe('192.0.0.9/32');
  });
});
