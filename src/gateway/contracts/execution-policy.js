export {
  validateExecutionPolicy,
} from '../protocol/validation.js';

import { EXECUTION_CONTRACT_VERSION, EXECUTION_DEFAULTS } from '../protocol/constants.js';

export function createExecutionPolicy(overrides = {}) {
  const {
    enabled,
    require_https,
    allow_private_networks,
    follow_redirects,
    max_attempts,
    fallback_enabled,
    retry_enabled,
    contract_version,
    ...rest
  } = overrides || {};

  return {
    contract_version: EXECUTION_CONTRACT_VERSION,
    allowed_provider_ids: [],
    request_timeout_ms: EXECUTION_DEFAULTS.timeout_ms,
    response_timeout_ms: EXECUTION_DEFAULTS.timeout_ms,
    max_request_bytes: 1048576,
    max_response_bytes: EXECUTION_DEFAULTS.max_response_bytes,
    observability_policy_id: 'standard-redacted',
    metadata: {},
    ...rest,
    enabled: enabled === true,
    require_https: true,
    allow_private_networks: false,
    follow_redirects: false,
    max_attempts: 1,
    fallback_enabled: false,
    retry_enabled: false,
  };
}
