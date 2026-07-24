import { createExecutionError } from '../contracts/execution-error.js';
import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

export function validateTransport(transport) {
  if (!transport || typeof transport !== 'object' || typeof transport.execute !== 'function') {
    return {
      success: false,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'internal_execution_error',
        category: 'internal_execution_error',
        message: 'Injected transport contract is required and must expose an execute() function',
        redacted: true,
      }),
    };
  }
  return { success: true };
}
