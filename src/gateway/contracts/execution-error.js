export {
  validateExecutionError,
} from '../protocol/validation.js';

import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

export function createExecutionError(overrides = {}) {
  const { redacted, contract_version, ...rest } = overrides || {};

  return {
    contract_version: EXECUTION_CONTRACT_VERSION,
    code: 'internal_execution_error',
    category: 'internal_execution_error',
    message: 'An execution error occurred',
    retryable: false,
    request_id: null,
    provider_id: null,
    status: 500,
    details: null,
    ...rest,
    redacted: true,
  };
}
