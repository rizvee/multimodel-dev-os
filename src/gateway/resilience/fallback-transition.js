function routeKey(route) {
  return `${route?.provider_id || route?.selected_provider || 'unknown'}:${route?.model_id || route?.selected_model || 'unknown'}`;
}

function asRoute(entry) {
  if (!entry) return null;
  return {
    provider_id: entry.provider_id || entry.selected_provider || null,
    model_id: entry.model_id || entry.selected_model || null,
  };
}

export function planFallbackTransition({
  primary,
  fallbackChain = [],
  failure,
  retryDecision,
  policy = {},
  transitionHistory = [],
} = {}) {
  const reasonCodes = [];
  const warnings = [];
  const skipped = [];
  const fallbackAllowed = policy.fallback_allowed !== false;
  const maxFallbacks = Number.isInteger(policy.max_fallbacks) ? policy.max_fallbacks : fallbackChain.length;
  const history = Array.isArray(transitionHistory) ? transitionHistory : [];
  const used = new Set(history.map((entry) => routeKey(entry.to || entry)).filter(Boolean));
  const from = asRoute(primary);

  if (!fallbackAllowed) reasonCodes.push('fallback-disabled');
  if (!failure?.fallback_eligible) reasonCodes.push('failure-not-fallback-eligible');
  if (failure?.policy_fault || failure?.category === 'policy-denied') reasonCodes.push('policy-denied');
  if (retryDecision?.eligible) reasonCodes.push('retry-still-eligible');
  if (history.length >= maxFallbacks) reasonCodes.push('fallback-limit-exhausted');

  let selected = null;
  for (const candidate of fallbackChain) {
    const candidateRoute = asRoute(candidate);
    if (!candidateRoute?.provider_id || !candidateRoute?.model_id) {
      skipped.push({ candidate, reason: 'invalid-candidate' });
      continue;
    }
    if (routeKey(candidateRoute) === routeKey(from)) {
      skipped.push({ candidate: candidateRoute, reason: 'same-as-current' });
      continue;
    }
    if (used.has(routeKey(candidateRoute))) {
      skipped.push({ candidate: candidateRoute, reason: 'previously-used' });
      continue;
    }
    selected = { ...candidateRoute, rank: candidate.rank || skipped.length + 1 };
    break;
  }
  if (!selected) reasonCodes.push('no-fallback-candidate');

  const transitionAllowed = reasonCodes.length === 0;
  if (!transitionAllowed && failure?.category === 'quota') warnings.push('quota exhausted and no fallback transition is available');

  return {
    transition_allowed: transitionAllowed,
    from,
    to: transitionAllowed ? { provider_id: selected.provider_id, model_id: selected.model_id } : null,
    fallback_rank: transitionAllowed ? selected.rank : null,
    trigger: failure?.category || 'unknown',
    reason_codes: reasonCodes,
    skipped_candidates: skipped,
    remaining_fallbacks: Math.max(0, fallbackChain.length - skipped.length - (transitionAllowed ? 1 : 0)),
    provider_changed: transitionAllowed ? from?.provider_id !== selected.provider_id : false,
    model_changed: transitionAllowed ? from?.model_id !== selected.model_id : false,
    warnings,
  };
}
