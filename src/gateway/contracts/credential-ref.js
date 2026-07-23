export {
  validateCredentialRef,
} from '../protocol/validation.js';

import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

export function createCredentialRef(overrides = {}) {
  const { source, contract_version, ...rest } = overrides || {};
  return {
    contract_version: EXECUTION_CONTRACT_VERSION,
    env_var: null,
    required: true,
    ...rest,
    source: 'environment',
  };
}
