import { describe, it, expect } from 'vitest';
import {
  parseCanonicalIPv4,
  classifyIPv4Address,
} from '../../src/gateway/transport/ipv4-policy.js';
import {
  IANA_IPV4_SPECIAL_RECORDS,
  IANA_IPV4_SPECIAL_REGISTRY_METADATA,
} from '../../src/gateway/transport/registry-snapshot.js';

describe('IPv4 Transport Policy & Registry Snapshot Integrity', () => {
  it('preserves expected metadata and normalized record counts in snapshot', () => {
    expect(IANA_IPV4_SPECIAL_REGISTRY_METADATA.source_url).toContain('iana-ipv4-special-registry-1.csv');
    expect(IANA_IPV4_SPECIAL_REGISTRY_METADATA.last_updated).toBe('2025-10-09');
    expect(IANA_IPV4_SPECIAL_REGISTRY_METADATA.normalized_record_count).toBe(22);
    expect(IANA_IPV4_SPECIAL_RECORDS.length).toBeGreaterThanOrEqual(22);
  });

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
      '127.1',
      '0177.0.0.1',
      '127.000.000.001',
      '0x7f000001',
      '2130706433',
      '-1.2.3.4',
      '+1.2.3.4',
      ' 1.1.1.1',
      '1.1.1.1 ',
      '1.1.1.1.',
      '256.0.0.1',
      '1.2.3.4.5',
      '1..3.4',
      'abc.def.ghi.jkl',
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

  it('classifies critical IANA IPv4 regression vectors accurately', () => {
    // 192.0.0.9 and .10 allowed
    expect(classifyIPv4Address('192.0.0.9').allowed).toBe(true);
    expect(classifyIPv4Address('192.0.0.10').allowed).toBe(true);

    // 192.0.0.170 and .171 denied (N/A in registry -> fail closed)
    expect(classifyIPv4Address('192.0.0.170').allowed).toBe(false);
    expect(classifyIPv4Address('192.0.0.171').allowed).toBe(false);

    // 192.0.0.8 denied (falls into 192.0.0.0/24)
    expect(classifyIPv4Address('192.0.0.8').allowed).toBe(false);

    // 192.88.99.2 denied (6to4 Benchmark Testing)
    expect(classifyIPv4Address('192.88.99.2').allowed).toBe(false);

    // 192.31.196.1 allowed
    expect(classifyIPv4Address('192.31.196.1').allowed).toBe(true);

    // 192.175.48.1 allowed
    expect(classifyIPv4Address('192.175.48.1').allowed).toBe(true);
  });
});
