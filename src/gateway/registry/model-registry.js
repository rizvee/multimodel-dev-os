import { buildGatewayRegistrySnapshot } from './snapshot.js';

function getSnapshot(input) {
  if (input?.models && input?.indexes) return input;
  const result = buildGatewayRegistrySnapshot(input || {});
  return result.value;
}

export function listModels(input, filters = {}) {
  const snapshot = getSnapshot(input);
  return snapshot.models.filter((model) => {
    if (filters.provider_id && model.provider_id !== filters.provider_id) return false;
    if (filters.capability && !model.capabilities.includes(filters.capability)) return false;
    if (filters.local !== undefined && model.local !== filters.local) return false;
    if (filters.enabled !== undefined && model.enabled !== filters.enabled) return false;
    if (filters.status && model.status !== filters.status) return false;
    return true;
  });
}

export function getModel(input, idOrAlias) {
  const snapshot = getSnapshot(input);
  const modelId = snapshot.indexes.modelsById[idOrAlias] ? idOrAlias : snapshot.indexes.modelsByAlias[idOrAlias];
  return modelId ? snapshot.indexes.modelsById[modelId] || null : null;
}

export function hasModel(input, idOrAlias) {
  return Boolean(getModel(input, idOrAlias));
}

export function listModelsByProvider(input, providerId) {
  const snapshot = getSnapshot(input);
  return (snapshot.indexes.modelsByProvider[providerId] || []).map((modelId) => snapshot.indexes.modelsById[modelId]);
}
