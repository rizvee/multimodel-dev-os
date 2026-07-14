import { buildGatewayRegistrySnapshot } from './snapshot.js';

function getSnapshot(input) {
  if (input?.routing_presets && input?.indexes) return input;
  const result = buildGatewayRegistrySnapshot(input || {});
  return result.value;
}

export function listRoutingPresets(input, filters = {}) {
  const snapshot = getSnapshot(input);
  return snapshot.routing_presets.filter((preset) => {
    if (filters.strategy && preset.strategy !== filters.strategy) return false;
    if (filters.capability && !preset.required_capabilities.includes(filters.capability) && !preset.preferred_capabilities.includes(filters.capability)) return false;
    if (filters.local_first !== undefined && preset.local_first !== filters.local_first) return false;
    return true;
  });
}

export function getRoutingPreset(input, id) {
  const snapshot = getSnapshot(input);
  return snapshot.indexes.routingPresetsById[id] || null;
}
