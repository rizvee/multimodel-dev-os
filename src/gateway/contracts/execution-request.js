export {
  validateExecutionRequest,
} from '../protocol/validation.js';

import { EXECUTION_DEFAULTS } from '../protocol/constants.js';

export function createExecutionRequest(overrides = {}) {
  const { options, ...rest } = overrides;
  return {
    request_id: null,
    provider_id: null,
    model_id: null,
    gateway_request: null,
    credential_ref: null,
    endpoint: null,
    options: {
      timeout_ms: EXECUTION_DEFAULTS.timeout_ms,
      max_response_bytes: EXECUTION_DEFAULTS.max_response_bytes,
      stream: EXECUTION_DEFAULTS.stream,
      follow_redirects: EXECUTION_DEFAULTS.follow_redirects,
      ...(options || {}),
    },
    metadata: {},
    ...rest,
  };
}
