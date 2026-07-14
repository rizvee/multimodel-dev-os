import { buildGatewayRegistrySnapshot } from './snapshot.js';

function getSnapshot(input) {
  if (input?.providers && input?.indexes) return input;
  const result = buildGatewayRegistrySnapshot(input || {});
  return result.value;
}

export function listProviders(input, filters = {}) {
  const snapshot = getSnapshot(input);
  return snapshot.providers.filter((provider) => {
    if (filters.provider_id && provider.id !== filters.provider_id) return false;
    if (filters.provider_type && provider.type !== filters.provider_type) return false;
    if (filters.capability && !provider.capabilities.includes(filters.capability)) return false;
    if (filters.local !== undefined && provider.local !== filters.local) return false;
    if (filters.enabled !== undefined && provider.enabled !== filters.enabled) return false;
    if (filters.status && provider.status !== filters.status) return false;
    return true;
  });
}

export function getProvider(input, id) {
  const snapshot = getSnapshot(input);
  return snapshot.indexes.providersById[id] || null;
}

export function hasProvider(input, id) {
  return Boolean(getProvider(input, id));
}
