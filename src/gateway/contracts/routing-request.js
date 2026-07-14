export {
  validateRoutingRequest,
} from '../protocol/validation.js';

export function createRoutingRequest(overrides = {}) {
  return {
    requested_model: null,
    requested_provider: null,
    required_capabilities: [],
    preferred_capabilities: [],
    estimated_input_tokens: null,
    required_context_window: null,
    privacy_policy: 'standard',
    cost_preference: 'none',
    latency_preference: 'none',
    fallback_allowed: false,
    excluded_providers: [],
    excluded_models: [],
    metadata: {},
    ...overrides,
  };
}
