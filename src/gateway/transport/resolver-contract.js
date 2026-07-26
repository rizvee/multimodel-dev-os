/**
 * Resolver Interface Descriptor Contract Validator (Sprint F1 Hardened)
 *
 * Preferred contract:
 *   resolver.resolveAll(hostname, { signal }) -> Promise<Array<{ address: string, family: 4|6, ttl?: number }>>
 */
export function validateResolverInterface(resolver) {
  if (!resolver || typeof resolver !== 'object' || Array.isArray(resolver)) {
    return Object.freeze({
      success: false,
      error: 'resolver_must_be_non_null_object',
      message: 'Resolver instance must be a valid non-null object',
    });
  }

  // Reject functions, arrays, dates, regexes
  const proto = Object.getPrototypeOf(resolver);
  if (proto !== Object.prototype && proto !== null) {
    return Object.freeze({
      success: false,
      error: 'resolver_prototype_must_be_object_or_null',
      message: 'Resolver object must be a plain object or null prototype record',
    });
  }

  // Check own property descriptor for resolveAll without accessing property getter
  const desc = Object.getOwnPropertyDescriptor(resolver, 'resolveAll');

  if (!desc) {
    return Object.freeze({
      success: false,
      error: 'resolver_missing_own_resolveAll',
      message: 'Resolver object must define an own resolveAll property',
    });
  }

  if (desc.get || desc.set) {
    return Object.freeze({
      success: false,
      error: 'resolver_resolveAll_accessor_rejected',
      message: 'resolveAll must be a data property, getters/setters are rejected',
    });
  }

  if (typeof desc.value !== 'function') {
    return Object.freeze({
      success: false,
      error: 'resolver_resolveAll_not_callable',
      message: 'resolveAll descriptor value must be a callable function',
    });
  }

  return Object.freeze({
    success: true,
    message: 'Resolver interface valid',
  });
}
