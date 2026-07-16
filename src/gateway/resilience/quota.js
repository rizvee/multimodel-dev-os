export function normalizeQuotaState(quota = {}) {
  return {
    exhausted: quota.exhausted === true,
    remaining: Number.isFinite(quota.remaining) && quota.remaining >= 0 ? quota.remaining : null,
    reset_at: Number.isFinite(quota.reset_at) ? quota.reset_at : null,
    scope: typeof quota.scope === 'string' && quota.scope ? quota.scope : 'provider',
    provider_reported: quota.provider_reported === true,
    metadata: quota.metadata && typeof quota.metadata === 'object' && !Array.isArray(quota.metadata) ? { ...quota.metadata } : {},
  };
}

export function planQuotaResponse({
  quota = {},
  failure,
  fallbackChain = [],
  policy = {},
} = {}) {
  const normalized = normalizeQuotaState(quota);
  const fallbackAllowed = policy.fallback_allowed !== false && fallbackChain.length > 0 && failure?.fallback_eligible !== false;
  if (!normalized.exhausted && failure?.category !== 'quota') {
    return {
      action: 'continue',
      retry_allowed: false,
      fallback_recommended: false,
      user_action_required: false,
      reasons: ['quota-not-exhausted'],
      warnings: [],
    };
  }
  if (fallbackAllowed) {
    return {
      action: 'fallback',
      retry_allowed: false,
      fallback_recommended: true,
      user_action_required: false,
      reasons: ['quota-exhausted-use-fallback'],
      warnings: [],
    };
  }
  return {
    action: 'require-user-action',
    retry_allowed: false,
    fallback_recommended: false,
    user_action_required: true,
    reasons: ['quota-exhausted-no-fallback'],
    warnings: ['quota exhaustion is not a spending decision'],
  };
}
