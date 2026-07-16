function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function numberOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function providerForModel(snapshot, model) {
  return snapshot.indexes.providersById[model.provider_id] || null;
}

function normalizePriority(value) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function latencyFromMetadata(...sources) {
  for (const source of sources) {
    const value = source?.latency_ms ?? source?.expected_latency_ms ?? source?.metadata?.latency_ms ?? source?.metadata?.expected_latency_ms;
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return null;
}

export function createGatewayRouteCandidates(snapshot) {
  const candidates = [];

  for (const model of snapshot.models || []) {
    const provider = providerForModel(snapshot, model);
    candidates.push({
      provider_id: provider?.id || model.provider_id || 'unknown',
      model_id: model.id,
      aliases: clone(model.aliases || []),
      capabilities: clone(model.capabilities || []),
      context_window: model.context_window,
      max_output_tokens: model.max_output_tokens,
      input_cost: model.input_cost,
      output_cost: model.output_cost,
      currency: model.currency,
      local: model.local === true || provider?.local === true,
      enabled: model.enabled === true,
      provider_enabled: provider ? provider.enabled === true : false,
      status: model.status || 'available',
      provider_status: provider?.status || 'missing',
      provider_priority: normalizePriority(provider?.priority),
      model_priority: normalizePriority(model.metadata?.priority),
      latency_ms: latencyFromMetadata(model, provider),
      metadata: clone(model.metadata || {}),
    });
  }

  const localProvider = snapshot.indexes.providersById.local || null;
  for (const localModel of snapshot.local_models || []) {
    candidates.push({
      provider_id: localProvider?.id || `local-${localModel.engine}`,
      model_id: localModel.id,
      aliases: [localModel.model, localModel.name].filter(Boolean).sort(),
      capabilities: clone(localModel.capabilities || ['local']),
      context_window: localModel.context_window,
      max_output_tokens: localModel.max_output_tokens ?? null,
      input_cost: null,
      output_cost: null,
      currency: null,
      local: true,
      enabled: localModel.enabled === true,
      provider_enabled: localProvider ? localProvider.enabled === true : true,
      status: localModel.status || 'metadata-only',
      provider_status: localProvider?.status || 'metadata-only',
      provider_priority: normalizePriority(localProvider?.priority),
      model_priority: normalizePriority(localModel.metadata?.priority),
      latency_ms: latencyFromMetadata(localModel, localProvider),
      metadata: clone(localModel.metadata || {}),
    });
  }

  return candidates
    .map((candidate) => ({
      ...candidate,
      input_cost: numberOrNull(candidate.input_cost),
      output_cost: numberOrNull(candidate.output_cost),
      context_window: Number.isInteger(candidate.context_window) ? candidate.context_window : null,
      max_output_tokens: Number.isInteger(candidate.max_output_tokens) ? candidate.max_output_tokens : null,
      aliases: [...new Set(candidate.aliases || [])].sort(),
      capabilities: [...new Set(candidate.capabilities || [])].sort(),
    }))
    .sort((a, b) => `${a.provider_id}:${a.model_id}`.localeCompare(`${b.provider_id}:${b.model_id}`));
}

export function findCandidateByModel(candidates, idOrAlias) {
  return candidates.find((candidate) => candidate.model_id === idOrAlias || candidate.aliases.includes(idOrAlias)) || null;
}
