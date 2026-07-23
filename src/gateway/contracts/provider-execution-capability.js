export {
  validateProviderExecutionCapability,
} from '../protocol/validation.js';

import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

export function createProviderExecutionCapability(overrides = {}) {
  const { contract_version, ...rest } = overrides || {};

  return {
    contract_version: EXECUTION_CONTRACT_VERSION,
    chat_completions: true,
    non_streaming: true,
    sse_streaming: false,
    usage_reporting: true,
    tool_calls: false,
    structured_output: false,
    system_messages: true,
    custom_endpoint_support: true,
    supported_auth_schemes: ['bearer_environment_variable'],
    metadata: {},
    ...rest,
  };
}
