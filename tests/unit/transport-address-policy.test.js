import { describe, it, expect } from 'vitest';
import { evaluateResolvedAddressSet } from '../../src/gateway/transport/address-policy.js';

describe('Resolved Address Set Hardening', () => {
  it('rejects records with getter properties or prototype pollution attempts', () => {
    const getterRecord = [
      Object.defineProperty({}, 'address', {
        get() { return '8.8.8.8'; },
        enumerable: true,
      }),
    ];
    expect(evaluateResolvedAddressSet(getterRecord).success).toBe(false);

    const classRecord = [new (class { address = '8.8.8.8'; family = 4; })()];
    expect(evaluateResolvedAddressSet(classRecord).success).toBe(false);

    const extraFieldRecord = [{ address: '8.8.8.8', family: 4, extra: 'bad' }];
    expect(evaluateResolvedAddressSet(extraFieldRecord).success).toBe(false);
  });

  it('accepts null-prototype records and valid plain objects', () => {
    const nullProtoRec = Object.create(null);
    nullProtoRec.address = '8.8.8.8';
    nullProtoRec.family = 4;
    nullProtoRec.ttl = 300;

    const res = evaluateResolvedAddressSet([nullProtoRec]);
    expect(res.success).toBe(true);
  });
});
