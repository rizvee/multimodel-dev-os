export {
  validateExecutionResult,
} from '../protocol/validation.js';

export function createExecutionResult(overrides = {}) {
  const { timing, ...rest } = overrides;
  return {
    request_id: null,
    provider_id: null,
    model_id: null,
    state: 'pending',
    gateway_response: null,
    error: null,
    timing: {
      started_at: null,
      completed_at: null,
      duration_ms: null,
      ...(timing || {}),
    },
    usage: null,
    metadata: {},
    redacted: true,
    ...rest,
  };
}
