import { describe, it, expect } from 'vitest';
import { validateResolverInterface } from '../../src/gateway/transport/resolver-contract.js';

describe('Resolver Interface Contract Hardening', () => {
  it('accepts valid own method data property on plain objects', () => {
    const fakeResolver = {
      async resolveAll() { return []; },
    };
    expect(validateResolverInterface(fakeResolver).success).toBe(true);
  });

  it('rejects inherited resolveAll, getters returning functions, or non-plain objects', () => {
    // Inherited resolveAll
    const parent = { async resolveAll() { return []; } };
    const child = Object.create(parent);
    expect(validateResolverInterface(child).success).toBe(false);

    // Getter returning function
    const getterResolver = Object.defineProperty({}, 'resolveAll', {
      get() { return async () => []; },
      enumerable: true,
    });
    expect(validateResolverInterface(getterResolver).success).toBe(false);

    // Function/Class instance resolver
    class ResolverClass {
      async resolveAll() { return []; }
    }
    expect(validateResolverInterface(new ResolverClass()).success).toBe(false);
  });
});
