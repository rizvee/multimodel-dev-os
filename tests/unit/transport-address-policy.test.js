import { describe, it, expect } from 'vitest';
import {
  classifyAddress,
  evaluateResolvedAddressSet,
} from '../../src/gateway/transport/address-policy.js';

describe('Address Transport Policy & Resolved Sets', () => {
  it('classifies both IPv4 and IPv6 inputs universally', () => {
    const cls4 = classifyAddress('8.8.8.8');
    expect(cls4.family).toBe(4);
    expect(cls4.allowed).toBe(true);

    const cls6 = classifyAddress('2607:f8b0:4005:805::200e');
    expect(cls6.family).toBe(6);
    expect(cls6.allowed).toBe(true);

    const clsInvalid = classifyAddress('not-an-ip');
    expect(clsInvalid.allowed).toBe(false);
  });

  it('evaluates valid all-public resolved address sets with deterministic IPv4-first sorting', () => {
    const records = [
      { address: '2607:f8b0:4005:805::200e', family: 6, ttl: 300 },
      { address: '140.82.121.4', family: 4, ttl: 60 },
      { address: '8.8.8.8', family: 4, ttl: 120 },
    ];

    const res = evaluateResolvedAddressSet(records);
    expect(res.success).toBe(true);
    expect(res.min_ttl).toBe(60);
    expect(res.selected_address).toBe('8.8.8.8');
    expect(res.selected_family).toBe(4);
    expect(res.approved_addresses).toHaveLength(3);
    expect(res.approved_addresses[0].address).toBe('8.8.8.8');
    expect(res.approved_addresses[1].address).toBe('140.82.121.4');
    expect(res.approved_addresses[2].address).toBe('2607:f8b0:4005:805::200e');
  });

  it('fails closed if ANY address in the resolved set is non-global or private', () => {
    const mixedRecords = [
      { address: '8.8.8.8', family: 4 },
      { address: '10.0.0.1', family: 4 }, // private!
    ];

    const res = evaluateResolvedAddressSet(mixedRecords);
    expect(res.success).toBe(false);
    expect(res.error).toBe('non_global_or_forbidden_address_in_set');
  });

  it('deduplicates identical records deterministically', () => {
    const dups = [
      { address: '8.8.8.8', family: 4 },
      { address: '8.8.8.8', family: 4 },
    ];
    const res = evaluateResolvedAddressSet(dups);
    expect(res.success).toBe(true);
    expect(res.deduplicated_count).toBe(1);
  });

  it('rejects prototype-sensitive keys in record objects', () => {
    const badRec = [
      JSON.parse('{"address":"8.8.8.8","family":4,"__proto__":{"polluted":true}}'),
    ];
    const res = evaluateResolvedAddressSet(badRec);
    expect(res.success).toBe(false);
  });
});
