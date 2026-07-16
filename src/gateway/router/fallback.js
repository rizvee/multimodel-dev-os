function differences(primary, candidate) {
  const diff = [];
  if (primary.provider_id !== candidate.provider_id) diff.push('provider');
  if (primary.model_id !== candidate.model_id) diff.push('model');
  if (primary.local !== candidate.local) diff.push('locality');
  return diff;
}

export function planGatewayFallbackChain({ selectedCandidate, viableCandidates, policy }) {
  if (!policy.fallback_allowed || policy.max_fallbacks <= 0) return [];
  const fallbacks = [];
  const usedProviders = new Set([selectedCandidate.provider_id]);

  for (const candidate of viableCandidates) {
    if (candidate.provider_id === selectedCandidate.provider_id && candidate.model_id === selectedCandidate.model_id) continue;
    if (policy.provider_diverse_fallbacks && usedProviders.has(candidate.provider_id) && viableCandidates.some((entry) => !usedProviders.has(entry.provider_id))) {
      continue;
    }
    fallbacks.push({
      provider_id: candidate.provider_id,
      model_id: candidate.model_id,
      rank: fallbacks.length + 1,
      score: candidate.score,
      reasons: [`fallback candidate planned after ${selectedCandidate.provider_id}/${selectedCandidate.model_id}`],
      differences_from_primary: differences(selectedCandidate, candidate),
      warnings: candidate.warnings || [],
    });
    usedProviders.add(candidate.provider_id);
    if (fallbacks.length >= policy.max_fallbacks) break;
  }

  if (fallbacks.length < policy.max_fallbacks && policy.provider_diverse_fallbacks) {
    for (const candidate of viableCandidates) {
      if (fallbacks.length >= policy.max_fallbacks) break;
      if (candidate.provider_id === selectedCandidate.provider_id && candidate.model_id === selectedCandidate.model_id) continue;
      if (fallbacks.some((entry) => entry.provider_id === candidate.provider_id && entry.model_id === candidate.model_id)) continue;
      fallbacks.push({
        provider_id: candidate.provider_id,
        model_id: candidate.model_id,
        rank: fallbacks.length + 1,
        score: candidate.score,
        reasons: [`fallback candidate planned after ${selectedCandidate.provider_id}/${selectedCandidate.model_id}`],
        differences_from_primary: differences(selectedCandidate, candidate),
        warnings: candidate.warnings || [],
      });
    }
  }

  return fallbacks;
}
