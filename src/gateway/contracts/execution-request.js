export {
  validateExecutionRequest,
} from '../protocol/validation.js';

import { EXECUTION_CONTRACT_VERSION, EXECUTION_DEFAULTS } from '../protocol/constants.js';

import { createExecutionPolicy } from './execution-policy.js';
import { createProviderExecutionCapability } from './provider-execution-capability.js';

export function createExecutionRequest(overrides = {}) {
  const { options, policy, capability, contract_version, ...rest } = overrides || {};
  const opts = options || {};
  const { follow_redirects, ...optsRest } = opts;
  return {
    contract_version: EXECUTION_CONTRACT_VERSION,
    request_id: null,
    provider_id: null,
    model_id: null,
    gateway_request: null,
    credential_ref: null,
    endpoint: null,
    policy: policy !== undefined ? policy : createExecutionPolicy(),
    capability: capability !== undefined ? capability : createProviderExecutionCapability(),
    options: {
      timeout_ms: EXECUTION_DEFAULTS.timeout_ms,
      max_response_bytes: EXECUTION_DEFAULTS.max_response_bytes,
      follow_redirects: false,
      ...optsRest,
    },
    metadata: {},
    ...rest,
  };
}
