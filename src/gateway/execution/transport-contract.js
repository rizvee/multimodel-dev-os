import { createExecutionError } from '../contracts/execution-error.js';
import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

export function validateTransport(transport, { requiresStream = false, requiresExecute = true } = {}) {
  if (!transport || typeof transport !== 'object') {
    return {
      success: false,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'internal_execution_error',
        category: 'internal_execution_error',
        message: 'Injected transport contract is required and must be an object',
        redacted: true,
      }),
    };
  }

  if (requiresExecute && typeof transport.execute !== 'function') {
    return {
      success: false,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'internal_execution_error',
        category: 'internal_execution_error',
        message: 'Injected transport contract requires an execute() function',
        redacted: true,
      }),
    };
  }

  if (requiresStream && typeof transport.stream !== 'function') {
    return {
      success: false,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'internal_execution_error',
        category: 'internal_execution_error',
        message: 'Injected transport contract requires a stream() function',
        redacted: true,
      }),
    };
  }

  return { success: true };
}

