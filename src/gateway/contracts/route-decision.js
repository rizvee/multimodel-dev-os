export {
  validateRouteDecision,
} from '../protocol/validation.js';

export function createRouteDecision(overrides = {}) {
  return {
    selected_provider: 'mock',
    selected_model: 'mock-chat',
    strategy: 'explicit',
    score: 1,
    reasons: ['explicit mock route'],
    rejected_candidates: [],
    fallback_chain: [],
    warnings: [],
    request_id: 'route_fixture',
    decision_timestamp: 1,
    ...overrides,
  };
}
