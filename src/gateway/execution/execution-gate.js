import { validateProviderAdapter } from '../contracts/provider-adapter.js';
import { validateProviderEndpoint } from '../contracts/provider-endpoint.js';
import { validateExecutionPolicy } from '../contracts/execution-policy.js';
import { validateProviderExecutionCapability } from '../contracts/provider-execution-capability.js';
import { validateExecutionRequest } from '../contracts/execution-request.js';
import { createExecutionError } from '../contracts/execution-error.js';
import {
  EXECUTION_CONTRACT_VERSION,
  STRICT_ENV_VAR_REGEX,
  PROTOTYPE_NAMES_PATTERN,
} from '../protocol/constants.js';

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isString(val) {
  return typeof val === 'string';
}

export function validateEndpointBinding({ endpoint = null, base_url = null } = {}) {
  if (!endpoint || !isObject(endpoint) || !isString(endpoint.url)) {
    return { success: false, code: 'endpoint_invalid', reason: 'Endpoint URL is required and must be a string' };
  }
  if (!base_url || !isString(base_url)) {
    return { success: false, code: 'endpoint_forbidden', reason: 'Trusted adapter base_url is required and must be a string' };
  }

  const rawEndpointUrl = endpoint.url.trim();
  const rawBaseUrl = base_url.trim();

  if (/%2e|%2f|\/\.\./i.test(rawEndpointUrl)) {
    return { success: false, code: 'endpoint_forbidden', reason: 'Endpoint URL contains illegal path traversal' };
  }

  let endUrl;
  let baseUrl;
  try {
    endUrl = new URL(rawEndpointUrl);
    baseUrl = new URL(rawBaseUrl);
  } catch (_) {
    return { success: false, code: 'endpoint_invalid', reason: 'Invalid URL format' };
  }

  if (endUrl.protocol !== 'https:' || baseUrl.protocol !== 'https:') {
    return { success: false, code: 'endpoint_forbidden', reason: 'HTTPS protocol is required' };
  }

  if (endUrl.hostname.toLowerCase() !== baseUrl.hostname.toLowerCase()) {
    return { success: false, code: 'endpoint_forbidden', reason: `Endpoint origin hostname mismatch (${endUrl.hostname} vs ${baseUrl.hostname})` };
  }

  const endPort = endUrl.port || '443';
  const basePort = baseUrl.port || '443';
  if (endPort !== basePort) {
    return { success: false, code: 'endpoint_forbidden', reason: `Endpoint port mismatch (${endPort} vs ${basePort})` };
  }

  if (endUrl.username || endUrl.password || baseUrl.username || baseUrl.password) {
    return { success: false, code: 'endpoint_forbidden', reason: 'Embedded userinfo is forbidden in endpoint URL' };
  }

  if (endUrl.hash) {
    return { success: false, code: 'endpoint_forbidden', reason: 'URL fragment identifier is forbidden' };
  }

  if (endUrl.search) {
    return { success: false, code: 'endpoint_forbidden', reason: 'Query parameters are forbidden unless explicitly configured' };
  }

  const normBasePath = baseUrl.pathname.replace(/\/+$/, '');
  const normEndPath = endUrl.pathname.replace(/\/+$/, '');

  if (normEndPath === normBasePath) {
    return { success: true };
  }

  if (normBasePath === '') {
    if (normEndPath.startsWith('/')) {
      return { success: true };
    }
  } else {
    if (normEndPath.startsWith(`${normBasePath}/`)) {
      return { success: true };
    }
  }

  return {
    success: false,
    code: 'endpoint_forbidden',
    reason: `Endpoint path ${normEndPath} is not a true path descendant of base path ${normBasePath}`,
  };
}

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

  if (!policy || !isObject(policy)) {
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

  if (!provider_adapter || !isObject(provider_adapter)) {
    return deny('provider_not_enabled', 'Provider adapter is required for gate evaluation', 'provider_not_enabled');
  }

  const adapterValidation = validateProviderAdapter(provider_adapter);
  if (!adapterValidation.success) {
    return deny('provider_not_enabled', 'Provider adapter validation failed', 'provider_not_enabled');
  }

  if (provider_adapter.id !== provId) {
    return deny('provider_not_enabled', `Provider adapter ID mismatch (${provider_adapter.id} vs ${provId})`, 'provider_not_enabled');
  }

  if (provider_adapter.type !== 'openai-compatible') {
    return deny('provider_not_enabled', `Provider adapter type ${provider_adapter.type} is not supported by current executor`, 'provider_not_enabled');
  }

  if (!request || !isObject(request)) {
    return deny('request_invalid', 'Execution request object is required', 'request_invalid');
  }

  const requestValidation = validateExecutionRequest(request);
  if (!requestValidation.success) {
    const firstErr = requestValidation.errors?.[0];
    const errCode = (firstErr?.code && EXECUTION_ERROR_CATEGORIES.includes(firstErr.code)) ? firstErr.code : 'request_invalid';
    return deny(errCode, firstErr?.message || 'Execution request contract validation failed', errCode);
  }

  const activeEndpoint = endpoint || request.endpoint;
  if (!activeEndpoint || !isObject(activeEndpoint)) {
    return deny('endpoint_invalid', 'Provider endpoint is required for gate evaluation', 'endpoint_invalid');
  }

  const endpointValidation = validateProviderEndpoint(activeEndpoint);
  if (!endpointValidation.success) {
    return deny('endpoint_invalid', 'Provider endpoint validation failed', 'endpoint_invalid');
  }

  const bindingResult = validateEndpointBinding({
    endpoint: activeEndpoint,
    base_url: provider_adapter.base_url,
  });
  if (!bindingResult.success) {
    return deny(bindingResult.code, bindingResult.reason, bindingResult.code);
  }

  if (policy.require_https === true && activeEndpoint.protocol !== 'https') {
    return deny('endpoint_forbidden', 'HTTPS protocol is required by execution policy', 'endpoint_forbidden');
  }

  if (activeEndpoint.follow_redirects === true) {
    return deny('endpoint_forbidden', 'Endpoint must have follow_redirects disabled', 'endpoint_forbidden');
  }

  const activeCapability = capability || request.capability;
  if (!activeCapability || !isObject(activeCapability)) {
    return deny('unsupported_capability', 'Provider execution capability is required', 'unsupported_capability');
  }

  const capValidation = validateProviderExecutionCapability(activeCapability);
  if (!capValidation.success) {
    return deny('unsupported_capability', 'Provider capability validation failed', 'unsupported_capability');
  }

  if (activeCapability.chat_completions !== true) {
    return deny('unsupported_capability', 'Provider capability chat_completions must be true', 'unsupported_capability');
  }

  const isStreamRequest = request.gateway_request?.stream === true;
  if (isStreamRequest && activeCapability.sse_streaming !== true) {
    return deny('unsupported_capability', 'Streaming requested but provider capability sse_streaming is false', 'unsupported_capability');
  }
  if (!isStreamRequest && activeCapability.non_streaming !== true) {
    return deny('unsupported_capability', 'Non-streaming requested but provider capability non_streaming is false', 'unsupported_capability');
  }

  const hasToolsRequest = (Array.isArray(request.gateway_request?.tools) && request.gateway_request.tools.length > 0) || request.gateway_request?.tool_choice !== undefined;
  if (hasToolsRequest && activeCapability.tool_calls !== true) {
    return deny('unsupported_capability', 'Tools or tool_choice requested but provider capability tool_calls is false', 'unsupported_capability');
  }

  if (Array.isArray(provider_adapter.capabilities)) {
    if (activeCapability.chat_completions && !provider_adapter.capabilities.includes('chat')) {
      return deny('unsupported_capability', 'Adapter capabilities vocabulary missing chat', 'unsupported_capability');
    }
    if (activeCapability.sse_streaming && isStreamRequest && !provider_adapter.capabilities.includes('streaming')) {
      return deny('unsupported_capability', 'Adapter capabilities vocabulary missing streaming', 'unsupported_capability');
    }
    if (activeCapability.tool_calls && hasToolsRequest && !provider_adapter.capabilities.includes('tools')) {
      return deny('unsupported_capability', 'Adapter capabilities vocabulary missing tools', 'unsupported_capability');
    }
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
