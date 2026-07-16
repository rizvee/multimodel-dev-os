import { compareScoredCandidates, scoreGatewayRouteCandidates } from './scoring.js';

function bumpComponent(scored, name, multiplier) {
  return scored.map((candidate) => {
    const components = candidate.score_components.map((entry) => (
      entry.name === name ? { ...entry, contribution: Math.round(entry.contribution * multiplier) } : entry
    ));
    const totalWeight = components.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    const raw = components.reduce((sum, entry) => sum + entry.contribution, 0);
    return {
      ...candidate,
      score_components: components,
      score_raw: raw,
      score: Number(Math.max(0, Math.min(1, raw / totalWeight)).toFixed(6)),
    };
  });
}

export function rankGatewayRouteCandidates({ candidates, request, policy }) {
  const { scored, warnings } = scoreGatewayRouteCandidates({ candidates, request, policy });
  let adjusted = scored;
  if (policy.strategy === 'capability') adjusted = bumpComponent(adjusted, 'preferred_capability', 2);
  if (policy.strategy === 'cost-first') adjusted = bumpComponent(adjusted, 'cost', 2);
  if (policy.strategy === 'latency-first') adjusted = bumpComponent(adjusted, 'latency', 2);
  if (policy.strategy === 'context-aware') adjusted = bumpComponent(adjusted, 'context', 2);
  if (policy.strategy === 'local-first') adjusted = bumpComponent(adjusted, 'local', 2);
  if (policy.strategy === 'explicit') adjusted = bumpComponent(adjusted, 'explicit', 2);
  if (policy.strategy === 'fallback-chain') adjusted = bumpComponent(adjusted, 'status', 2);

  return {
    ranked: [...adjusted].sort(compareScoredCandidates(policy)),
    warnings,
  };
}
