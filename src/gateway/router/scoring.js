import { requiredContextWindow, requestedOutputTokens } from './filters.js';

function component(name, value, weight, reason) {
  const normalized = Math.max(0, Math.min(1, value));
  return {
    name,
    value: Number(normalized.toFixed(6)),
    weight,
    contribution: Math.round(normalized * weight),
    reason,
  };
}

function estimatedCost(candidate, request) {
  const input = Number.isInteger(request.estimated_input_tokens) ? request.estimated_input_tokens : null;
  const output = requestedOutputTokens(request);
  if (input === null || output === null || candidate.input_cost === null || candidate.output_cost === null) return null;
  return ((input / 1000000) * candidate.input_cost) + ((output / 1000000) * candidate.output_cost);
}

function maxKnown(values) {
  const known = values.filter((value) => Number.isFinite(value));
  return known.length > 0 ? Math.max(...known) : null;
}

function minKnown(values) {
  const known = values.filter((value) => Number.isFinite(value));
  return known.length > 0 ? Math.min(...known) : null;
}

function costScore(cost, minCost, maxCost, unknownPolicy) {
  if (cost === null) return unknownPolicy === 'neutral' ? 0.5 : 0.15;
  if (minCost === maxCost) return 1;
  return 1 - ((cost - minCost) / (maxCost - minCost));
}

function latencyScore(latency, minLatency, maxLatency, unknownPolicy) {
  if (latency === null) return unknownPolicy === 'neutral' ? 0.5 : 0.2;
  if (minLatency === maxLatency) return 1;
  return 1 - ((latency - minLatency) / (maxLatency - minLatency));
}

function contextScore(candidate, request) {
  const required = requiredContextWindow(request);
  if (required === null || candidate.context_window === null) return 0.5;
  if (candidate.context_window < required) return 0;
  const excess = candidate.context_window - required;
  return Math.max(0.25, 1 - (excess / Math.max(candidate.context_window, 1)));
}

function priorityScore(candidate) {
  const value = candidate.provider_priority + candidate.model_priority;
  if (value <= 0) return 0.5;
  return Math.min(1, value / 100);
}

function explicitScore(candidate, request) {
  let value = 0;
  if (request.requested_provider && request.requested_provider === candidate.provider_id) value += 0.5;
  if (request.requested_model && (request.requested_model === candidate.model_id || candidate.aliases.includes(request.requested_model))) value += 0.5;
  return value;
}

export function scoreGatewayRouteCandidates({ candidates, request = {}, policy }) {
  const costs = candidates.map((candidate) => estimatedCost(candidate, request));
  const minCost = minKnown(costs);
  const maxCost = maxKnown(costs);
  const latencies = candidates.map((candidate) => candidate.latency_ms);
  const minLatency = minKnown(latencies);
  const maxLatency = maxKnown(latencies);
  const currencies = new Set(candidates.map((candidate) => candidate.currency).filter(Boolean));
  const warnings = [];
  if ((policy.strategy === 'cost-first' || policy.cost_preference === 'low') && costs.every((cost) => cost === null)) {
    warnings.push('cost metrics unavailable for all viable candidates');
  }
  if (currencies.size > 1) warnings.push('multiple pricing currencies present; costs were not converted');
  if (policy.strategy === 'latency-first' && latencies.every((latency) => latency === null)) {
    warnings.push('latency metrics unavailable for all viable candidates');
  }

  const scored = candidates.map((candidate, index) => {
    const cost = estimatedCost(candidate, request);
    const components = [
      component('capability', 1, policy.weights.capability, 'all required capabilities passed hard filters'),
      component(
        'preferred_capability',
        policy.preferred_capabilities.length === 0
          ? 0.5
          : policy.preferred_capabilities.filter((capability) => candidate.capabilities.includes(capability)).length / policy.preferred_capabilities.length,
        policy.weights.preferred_capability,
        'preferred capability match ratio',
      ),
      component('priority', priorityScore(candidate), policy.weights.priority, 'static provider/model priority metadata'),
      component('cost', costScore(cost, minCost, maxCost, policy.unknown_metric_policy), policy.weights.cost, 'static estimated cost comparison'),
      component('latency', latencyScore(candidate.latency_ms, minLatency, maxLatency, policy.unknown_metric_policy), policy.weights.latency, 'static latency metadata comparison'),
      component('context', contextScore(candidate, request), policy.weights.context, 'context window fit based on caller-supplied estimates'),
      component('local', candidate.local ? 1 : policy.local_preferred ? 0 : 0.5, policy.weights.local, 'local preference metadata'),
      component('explicit', explicitScore(candidate, request), policy.weights.explicit, 'explicit provider/model preference'),
      component('status', candidate.status === 'available' ? 1 : 0.6, policy.weights.status, 'static status confidence'),
    ];

    const totalWeight = components.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    const raw = components.reduce((sum, entry) => sum + entry.contribution, 0);
    const candidateWarnings = [];
    if (cost === null) candidateWarnings.push('cost unknown');
    if (candidate.latency_ms === null) candidateWarnings.push('latency unknown');
    if (candidate.context_window === null) candidateWarnings.push('context window unknown');

    return {
      ...candidate,
      route_index: index,
      estimated_cost: cost === null ? null : Number(cost.toFixed(10)),
      score_components: components,
      score_raw: raw,
      score: Number(Math.max(0, Math.min(1, raw / totalWeight)).toFixed(6)),
      warnings: candidateWarnings,
    };
  });

  return { scored, warnings };
}

export function compareScoredCandidates(policy) {
  return (a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.warnings.length !== b.warnings.length) return a.warnings.length - b.warnings.length;
    if (policy.local_preferred && a.local !== b.local) return a.local ? -1 : 1;
    if (Number.isFinite(a.estimated_cost) && Number.isFinite(b.estimated_cost) && a.estimated_cost !== b.estimated_cost) return a.estimated_cost - b.estimated_cost;
    if (Number.isFinite(a.latency_ms) && Number.isFinite(b.latency_ms) && a.latency_ms !== b.latency_ms) return a.latency_ms - b.latency_ms;
    const priorityDiff = (b.provider_priority + b.model_priority) - (a.provider_priority + a.model_priority);
    if (priorityDiff !== 0) return priorityDiff;
    const provider = a.provider_id.localeCompare(b.provider_id);
    if (provider !== 0) return provider;
    return a.model_id.localeCompare(b.model_id);
  };
}
