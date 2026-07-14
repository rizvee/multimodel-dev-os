import { buildGatewayRegistrySnapshot } from './snapshot.js';

function getSnapshot(input) {
  if (input?.local_models && input?.indexes) return input;
  const result = buildGatewayRegistrySnapshot(input || {});
  return result.value;
}

export function listLocalModels(input, filters = {}) {
  const snapshot = getSnapshot(input);
  return snapshot.local_models.filter((model) => {
    if (filters.engine && model.engine !== filters.engine) return false;
    if (filters.capability && !model.capabilities.includes(filters.capability)) return false;
    if (filters.enabled !== undefined && model.enabled !== filters.enabled) return false;
    if (filters.status && model.status !== filters.status) return false;
    return true;
  });
}

export function getLocalModel(input, id) {
  const snapshot = getSnapshot(input);
  return snapshot.indexes.localModelsById[id] || null;
}
