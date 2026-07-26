import { describe, it, expect } from 'vitest';
import { validateResolverInterface } from '../../src/gateway/transport/resolver-contract.js';

describe('Resolver Interface Contract', () => {
  it('validates a compliant injectable resolver interface', () => {
    const fakeResolver = {
      async resolveAll(hostname, { signal } = {}) {
        return [{ address: '8.8.8.8', family: 4, ttl: 300 }];
      },
    };

    const res = validateResolverInterface(fakeResolver);
    expect(res.success).toBe(true);
  });

  it('rejects missing, non-object, or uncallable resolveAll resolvers', () => {
    expect(validateResolverInterface(null).success).toBe(false);
    expect(validateResolverInterface('not-an-object').success).toBe(false);
    expect(validateResolverInterface({}).success).toBe(false);
    expect(validateResolverInterface({ resolveAll: 'not-a-function' }).success).toBe(false);
  });
});
