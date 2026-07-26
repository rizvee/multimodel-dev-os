/**
 * Resolver Contract Validator (Sprint F1)
 *
 * Preferred contract:
 *   resolver.resolveAll(hostname, { signal }) -> Promise<Array<{ address: string, family: 4|6, ttl?: number }>>
 */
export function validateResolverInterface(resolver) {
  if (!resolver || typeof resolver !== 'object') {
    return Object.freeze({
      success: false,
      error: 'resolver_must_be_object',
      message: 'Resolver instance must be a valid non-null object',
    });
  }

  if (typeof resolver.resolveAll !== 'function') {
    return Object.freeze({
      success: false,
      error: 'resolver_missing_resolveAll',
      message: 'Resolver object must define a callable resolveAll method',
    });
  }

  // Ensure resolveAll is an own property or prototype method
  if (typeof resolver.resolveAll !== 'function') {
    return Object.freeze({
      success: false,
      error: 'invalid_resolver_method',
      message: 'resolveAll must be a callable function',
    });
  }

  return Object.freeze({
    success: true,
    message: 'Resolver interface valid',
  });
}
