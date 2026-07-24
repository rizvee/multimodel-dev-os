import { validateProviderAdapter } from '../contracts/provider-adapter.js';
import { validateCredentialRef } from '../contracts/credential-ref.js';
import { createExecutionError } from '../contracts/execution-error.js';
import { STRICT_ENV_VAR_REGEX, PROTOTYPE_NAMES_PATTERN, EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';
import { createResolvedCredential } from './resolved-credential.js';

export function resolveEnvironmentCredential({
  credential_ref = null,
  provider_id,
  provider_adapter,
  environment = null,
} = {}) {
  const adapterValidation = validateProviderAdapter(provider_adapter);
  if (!adapterValidation.success) {
    return {
      success: false,
      credential: null,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'configuration_error',
        category: 'credential_reference_invalid',
        message: 'Invalid provider adapter supplied to credential resolver',
        provider_id: provider_id || null,
        redacted: true,
      }),
    };
  }

  if (!provider_id || provider_adapter.id !== provider_id) {
    return {
      success: false,
      credential: null,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'configuration_error',
        category: 'credential_reference_invalid',
        message: 'Provider ID mismatch between request and adapter',
        provider_id: provider_id || null,
        redacted: true,
      }),
    };
  }

  const approvedEnvName = provider_adapter.credential_env;

  if (approvedEnvName === null || approvedEnvName === undefined) {
    return {
      success: true,
      credential: null,
      metadata: {
        contract_version: EXECUTION_CONTRACT_VERSION,
        resolved: true,
        provider_id,
        env_var: null,
        source: 'environment',
      },
    };
  }

  let isRequired = true;
  if (credential_ref !== null && credential_ref !== undefined) {
    const refValidation = validateCredentialRef(credential_ref);
    if (!refValidation.success) {
      return {
        success: false,
        credential: null,
        error: createExecutionError({
          contract_version: EXECUTION_CONTRACT_VERSION,
          code: 'credential_reference_invalid',
          category: 'credential_reference_invalid',
          message: 'Invalid credential_ref supplied to resolver',
          provider_id,
          redacted: true,
        }),
      };
    }
    if (credential_ref.env_var !== approvedEnvName) {
      return {
        success: false,
        credential: null,
        error: createExecutionError({
          contract_version: EXECUTION_CONTRACT_VERSION,
          code: 'credential_reference_invalid',
          category: 'credential_reference_invalid',
          message: 'Credential reference env_var does not match provider adapter credential_env',
          provider_id,
          redacted: true,
        }),
      };
    }
    isRequired = credential_ref.required !== false;
  }

  if (
    typeof approvedEnvName !== 'string' ||
    PROTOTYPE_NAMES_PATTERN.test(approvedEnvName) ||
    !STRICT_ENV_VAR_REGEX.test(approvedEnvName)
  ) {
    return {
      success: false,
      credential: null,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'credential_reference_invalid',
        category: 'credential_reference_invalid',
        message: 'Invalid environment variable name in provider adapter',
        provider_id,
        redacted: true,
      }),
    };
  }

  const envObj = environment && typeof environment === 'object' ? environment : process.env;
  const rawValue = envObj[approvedEnvName];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    if (!isRequired) {
      return {
        success: true,
        credential: null,
        metadata: {
          contract_version: EXECUTION_CONTRACT_VERSION,
          resolved: true,
          provider_id,
          env_var: approvedEnvName,
          source: 'environment',
        },
      };
    }
    return {
      success: false,
      credential: null,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'credential_unavailable',
        category: 'credential_unavailable',
        message: `Required environment credential ${approvedEnvName} is missing or empty`,
        provider_id,
        redacted: true,
      }),
    };
  }

  if (typeof rawValue !== 'string') {
    return {
      success: false,
      credential: null,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'credential_reference_invalid',
        category: 'credential_reference_invalid',
        message: `Environment credential ${approvedEnvName} must be a string`,
        provider_id,
        redacted: true,
      }),
    };
  }

  if (rawValue.trim() === '') {
    if (!isRequired) {
      return {
        success: true,
        credential: null,
        metadata: {
          contract_version: EXECUTION_CONTRACT_VERSION,
          resolved: true,
          provider_id,
          env_var: approvedEnvName,
          source: 'environment',
        },
      };
    }
    return {
      success: false,
      credential: null,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'credential_unavailable',
        category: 'credential_unavailable',
        message: `Environment credential ${approvedEnvName} cannot be whitespace-only`,
        provider_id,
        redacted: true,
      }),
    };
  }

  if (/[\x00\r\n]/.test(rawValue)) {
    return {
      success: false,
      credential: null,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'credential_reference_invalid',
        category: 'credential_reference_invalid',
        message: `Environment credential ${approvedEnvName} contains illegal control characters`,
        provider_id,
        redacted: true,
      }),
    };
  }

  if (rawValue.length > 16384) {
    return {
      success: false,
      credential: null,
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: 'credential_reference_invalid',
        category: 'credential_reference_invalid',
        message: `Environment credential ${approvedEnvName} exceeds maximum allowed length of 16 KiB`,
        provider_id,
        redacted: true,
      }),
    };
  }

  const credential = createResolvedCredential({
    provider_id,
    env_var: approvedEnvName,
    secret: rawValue,
    source: 'environment',
  });

  return {
    success: true,
    credential,
    metadata: {
      contract_version: EXECUTION_CONTRACT_VERSION,
      resolved: true,
      provider_id,
      env_var: approvedEnvName,
      source: 'environment',
    },
  };
}
