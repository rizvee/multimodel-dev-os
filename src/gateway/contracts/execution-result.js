export {
  validateExecutionResult,
} from '../protocol/validation.js';

import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

export function createExecutionResult(overrides = {}) {
  const { redacted, contract_version, timing, ...rest } = overrides || {};
  return {
    contract_version: EXECUTION_CONTRACT_VERSION,
    execution_id: null,
    request_id: null,
    provider_id: null,
    model_id: null,
    state: 'pending',
    attempt_count: 1,
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
    ...rest,
    redacted: true,
  };
}
