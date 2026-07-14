export {
  validateProviderAdapter,
} from '../protocol/validation.js';

export function describeProviderAdapter(adapter) {
  return {
    id: adapter.id,
    name: adapter.name,
    type: adapter.type,
    version: adapter.version,
    capabilities: [...(adapter.capabilities || [])],
    credential_env: adapter.credential_env || null,
    base_url: adapter.base_url,
    models: [...(adapter.models || [])],
  };
}
