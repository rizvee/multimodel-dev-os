import { validateProviderAdapter } from '../contracts/provider-adapter.js';
import { validateProviderEndpoint } from '../contracts/provider-endpoint.js';
import { validateExecutionPolicy } from '../contracts/execution-policy.js';
import { validateProviderExecutionCapability } from '../contracts/provider-execution-capability.js';
import { validateExecutionRequest } from '../contracts/execution-request.js';
import { createExecutionError } from '../contracts/execution-error.js';
import {
  EXECUTION_CONTRACT_VERSION,
  PROVIDER_TYPES,
  STRICT_ENV_VAR_REGEX,
  PROTOTYPE_NAMES_PATTERN,
} from '../protocol/constants.js';

export function evaluateExecutionGate({
  policy = null,
  provider_id = null,
  provider_adapter = null,
  request = null,
  endpoint = null,
  capability = null,
  credential_ref = null,
} = {}) {
  const reqId = request?.request_id || null;
  const provId = provider_id || request?.provider_id || null;

  function deny(code, message, category = null) {
    const errorCat = category || code;
    return {
      allowed: false,
      code,
      reason: message,
      provider_id: provId,
      request_id: reqId,
      policy_summary: {
        enabled: policy?.enabled ?? false,
        max_attempts: policy?.max_attempts ?? 0,
        https_required: policy?.require_https ?? true,
      },
      error: createExecutionError({
        contract_version: EXECUTION_CONTRACT_VERSION,
        code: errorCat,
        category: errorCat,
        message,
        provider_id: provId,
        request_id: reqId,
        redacted: true,
      }),
      metadata: {
        contract_version: EXECUTION_CONTRACT_VERSION,
        evaluated: true,
        allowed: false,
      },
    };
  }

  if (!policy || typeof policy !== 'object') {
    return deny('execution_disabled', 'Execution policy missing or invalid', 'execution_disabled');
  }

  const policyValidation = validateExecutionPolicy(policy);
  if (!policyValidation.success) {
    return deny('execution_disabled', 'Invalid execution policy contract', 'execution_disabled');
  }

  if (policy.enabled !== true) {
    return deny('execution_disabled', 'External execution path is disabled by policy', 'execution_disabled');
  }

  if (!Array.isArray(policy.allowed_provider_ids) || !policy.allowed_provider_ids.includes(provId)) {
    return deny('provider_not_enabled', `Provider ${provId} is not in allowed_provider_ids list`, 'provider_not_enabled');
  }

  if (policy.max_attempts !== 1 || policy.retry_enabled === true || policy.fallback_enabled === true) {
    return deny('execution_disabled', 'Execution policy must enforce exactly one attempt with retries and fallback disabled', 'execution_disabled');
  }

  if (!policy.request_timeout_ms || policy.request_timeout_ms <= 0 || policy.request_timeout_ms > 600000) {
    return deny('execution_disabled', 'Invalid request_timeout_ms in policy', 'execution_disabled');
  }

  if (!policy.response_timeout_ms || policy.response_timeout_ms <= 0 || policy.response_timeout_ms > 600000) {
    return deny('execution_disabled', 'Invalid response_timeout_ms in policy', 'execution_disabled');
  }

  if (!policy.max_request_bytes || policy.max_request_bytes <= 0) {
    return deny('execution_disabled', 'Invalid max_request_bytes in policy', 'execution_disabled');
  }

  if (!policy.max_response_bytes || policy.max_response_bytes <= 0) {
    return deny('execution_disabled', 'Invalid max_response_bytes in policy', 'execution_disabled');
  }

  if (policy.follow_redirects === true) {
    return deny('execution_disabled', 'Redirects must be disabled in execution policy', 'execution_disabled');
  }

  if (!provider_adapter || typeof provider_adapter !== 'object') {
    return deny('provider_not_enabled', 'Provider adapter is required for gate evaluation', 'provider_not_enabled');
  }

  const adapterValidation = validateProviderAdapter(provider_adapter);
  if (!adapterValidation.success) {
    return deny('provider_not_enabled', 'Provider adapter validation failed', 'provider_not_enabled');
  }

  if (provider_adapter.id !== provId) {
    return deny('provider_not_enabled', `Provider adapter ID mismatch (${provider_adapter.id} vs ${provId})`, 'provider_not_enabled');
  }

  if (!PROVIDER_TYPES.includes(provider_adapter.type)) {
    return deny('provider_not_enabled', `Provider adapter type ${provider_adapter.type} is not supported`, 'provider_not_enabled');
  }

  if (!request || typeof request !== 'object') {
    return deny('request_invalid', 'Execution request object is required', 'request_invalid');
  }

  const requestValidation = validateExecutionRequest(request);
  if (!requestValidation.success) {
    return deny('request_invalid', 'Execution request contract validation failed', 'request_invalid');
  }

  const activeEndpoint = endpoint || request.endpoint;
  if (!activeEndpoint || typeof activeEndpoint !== 'object') {
    return deny('endpoint_invalid', 'Provider endpoint is required for gate evaluation', 'endpoint_invalid');
  }

  const endpointValidation = validateProviderEndpoint(activeEndpoint);
  if (!endpointValidation.success) {
    return deny('endpoint_invalid', 'Provider endpoint validation failed', 'endpoint_invalid');
  }

  if (policy.require_https === true && activeEndpoint.protocol !== 'https') {
    return deny('endpoint_forbidden', 'HTTPS protocol is required by execution policy', 'endpoint_forbidden');
  }

  if (activeEndpoint.follow_redirects === true) {
    return deny('endpoint_forbidden', 'Endpoint must have follow_redirects disabled', 'endpoint_forbidden');
  }

  const parsedUrl = new URL(activeEndpoint.url);
  const host = parsedUrl.hostname.toLowerCase();

  if (policy.allow_private_networks === false) {
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return deny('endpoint_forbidden', `Private/loopback endpoint host ${host} rejected by policy`, 'endpoint_forbidden');
    }
  }

  const activeCapability = capability || request.capability;
  if (!activeCapability || typeof activeCapability !== 'object') {
    return deny('unsupported_capability', 'Provider execution capability is required', 'unsupported_capability');
  }

  const capValidation = validateProviderExecutionCapability(activeCapability);
  if (!capValidation.success) {
    return deny('unsupported_capability', 'Provider capability validation failed', 'unsupported_capability');
  }

  if (activeCapability.chat_completions !== true && activeCapability.non_streaming !== true) {
    return deny('unsupported_capability', 'Provider does not support chat completions capability', 'unsupported_capability');
  }

  const isStreamRequest = request.gateway_request?.stream === true;
  if (isStreamRequest && activeCapability.sse_streaming !== true) {
    return deny('unsupported_capability', 'Streaming requested but provider capability sse_streaming is false', 'unsupported_capability');
  }

  const hasToolsRequest = Array.isArray(request.gateway_request?.tools) && request.gateway_request.tools.length > 0;
  if (hasToolsRequest && activeCapability.tool_calls !== true) {
    return deny('unsupported_capability', 'Tool calls requested but provider capability tool_calls is false', 'unsupported_capability');
  }

  const approvedEnv = provider_adapter.credential_env;
  if (approvedEnv !== null && approvedEnv !== undefined) {
    if (
      typeof approvedEnv !== 'string' ||
      PROTOTYPE_NAMES_PATTERN.test(approvedEnv) ||
      !STRICT_ENV_VAR_REGEX.test(approvedEnv)
    ) {
      return deny('credential_reference_invalid', 'Invalid provider adapter credential_env name', 'credential_reference_invalid');
    }
    const activeRef = credential_ref || request.credential_ref;
    if (activeRef && activeRef.env_var !== approvedEnv) {
      return deny('credential_reference_invalid', 'Credential reference env_var mismatch with adapter credential_env', 'credential_reference_invalid');
    }
  }

  return {
    allowed: true,
    code: 'allowed',
    reason: 'Execution preflight gate evaluation passed',
    provider_id: provId,
    request_id: reqId,
    policy_summary: {
      enabled: policy.enabled,
      max_attempts: policy.max_attempts,
      https_required: policy.require_https,
    },
    metadata: {
      contract_version: EXECUTION_CONTRACT_VERSION,
      evaluated: true,
      allowed: true,
    },
  };
}
