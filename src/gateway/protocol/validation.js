import {
  ALLOWED_TRANSPORT_HEADERS,
  CHAT_MESSAGE_ROLES,
  CHAT_REQUEST_FIELDS,
  COST_PREFERENCES,
  CREDENTIAL_REF_KEYS,
  CREDENTIAL_REF_REQUIRED_FIELDS,
  CREDENTIAL_SOURCES,
  DEFAULT_GATEWAY_CONFIG,
  ERROR_CODES,
  EXECUTION_CONTRACT_VERSION,
  EXECUTION_ERROR_CATEGORIES,
  EXECUTION_ERROR_KEYS,
  EXECUTION_ERROR_REQUIRED_FIELDS,
  EXECUTION_POLICY_KEYS,
  EXECUTION_POLICY_REQUIRED_FIELDS,
  EXECUTION_PROTOCOLS,
  EXECUTION_REQUEST_KEYS,
  EXECUTION_REQUEST_REQUIRED_FIELDS,
  EXECUTION_RESULT_KEYS,
  EXECUTION_RESULT_REQUIRED_FIELDS,
  EXECUTION_STATES,
  LATENCY_PREFERENCES,
  PRIVACY_POLICIES,
  PROTOTYPE_NAMES_PATTERN,
  PROVIDER_CAPABILITIES,
  PROVIDER_CAPABILITY_KEYS,
  PROVIDER_CAPABILITY_REQUIRED_FIELDS,
  PROVIDER_ENDPOINT_KEYS,
  PROVIDER_ENDPOINT_REQUIRED_FIELDS,
  PROVIDER_TYPES,
  ROUTING_STRATEGIES,
  SENSITIVE_KEY_PATTERN,
  STRICT_ENV_VAR_REGEX,
} from './constants.js';


function createResult(value = null) {
  return {
    success: true,
    errors: [],
    warnings: [],
    value,
  };
}

function addError(result, code, path, message) {
  result.success = false;
  result.errors.push({ code, path, message });
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateStringArray(value, result, path, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) addError(result, 'invalid_request', path, `${path} is required`);
    return;
  }
  if (!Array.isArray(value)) {
    addError(result, 'invalid_request', path, `${path} must be an array`);
    return;
  }
  for (const [index, item] of value.entries()) {
    if (!isString(item)) {
      addError(result, 'invalid_request', `${path}[${index}]`, `${path}[${index}] must be a non-empty string`);
    }
  }
}

function validateMetadata(value, result, path = 'metadata') {
  if (value === undefined || value === null) return;
  if (!isObject(value)) {
    addError(result, 'invalid_request', path, `${path} must be an object`);
    return;
  }
  for (const key of Object.keys(value)) {
    const keyPath = `${path}.${key}`;
    if (PROTOTYPE_NAMES_PATTERN.test(key)) {
      addError(result, 'policy_denied', keyPath, `prototype-sensitive property forbidden in metadata: ${key}`);
    }
  }
}

const EXTENDED_SENSITIVE_KEY_PATTERN =
  /(?:api[_-]?key|apiKey|authorization|access[_-]?token|refresh[_-]?token|auth[_-]?token|bearer[_-]?token|session[_-]?token|id[_-]?token|^token$|secret|credential|password|cookie|set-cookie|private[_-]?key|client[_-]?secret|stack(?:[_-]?trace)?|raw[_-]?(?:response|headers)|(?:request|response)[_-]?headers|^environment$|^env$)/i;

const ABSOLUTE_PATH_REGEX = /^(?:[a-zA-Z]:[\\\/]|\/[^\/])/;

function validateRequiredFields(obj, requiredFields, result, prefix = '') {
  if (!isObject(obj)) return;
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null) {
      const fieldPath = prefix ? `${prefix}.${field}` : field;
      addError(result, 'invalid_request', fieldPath, `${fieldPath} is required`);
    }
  }
}

function validateSafeMetadata(value, result, path = 'metadata', depth = 0, nodeCount = { count: 0 }) {
  if (value === undefined || value === null) return;
  if (depth > 10) {
    addError(result, 'policy_denied', path, `metadata depth limit exceeded at ${path}`);
    return;
  }
  nodeCount.count++;
  if (nodeCount.count > 100) {
    addError(result, 'policy_denied', path, `metadata node size limit exceeded at ${path}`);
    return;
  }
  if (!isObject(value) && !Array.isArray(value)) {
    if (path === 'metadata') {
      addError(result, 'invalid_request', path, `${path} must be an object`);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const itemPath = `${path}[${index}]`;
      if (typeof item === 'string' && ABSOLUTE_PATH_REGEX.test(item.trim())) {
        addError(result, 'policy_denied', itemPath, `absolute path forbidden in metadata: ${item}`);
      } else if (isObject(item) || Array.isArray(item)) {
        validateSafeMetadata(item, result, itemPath, depth + 1, nodeCount);
      }
    }
    return;
  }

  for (const [key, val] of Object.entries(value)) {
    const keyPath = `${path}.${key}`;
    if (PROTOTYPE_NAMES_PATTERN.test(key)) {
      addError(result, 'policy_denied', keyPath, `prototype-sensitive property forbidden in metadata: ${key}`);
    } else if (EXTENDED_SENSITIVE_KEY_PATTERN.test(key)) {
      addError(result, 'policy_denied', keyPath, `sensitive property forbidden in metadata: ${key}`);
    } else {
      if (typeof val === 'string' && ABSOLUTE_PATH_REGEX.test(val.trim())) {
        addError(result, 'policy_denied', keyPath, `absolute path forbidden in metadata: ${val}`);
      } else if (isObject(val) || Array.isArray(val)) {
        validateSafeMetadata(val, result, keyPath, depth + 1, nodeCount);
      }
    }
  }
}



function validateAllowedKeys(obj, allowedKeys, result, path = '$') {
  if (!isObject(obj)) return;
  for (const key of Object.keys(obj)) {
    const keyPath = path === '$' ? key : `${path}.${key}`;
    if (PROTOTYPE_NAMES_PATTERN.test(key)) {
      addError(result, 'policy_denied', keyPath, `prototype-sensitive property forbidden: ${key}`);
    } else if (!allowedKeys.includes(key)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        addError(result, 'policy_denied', keyPath, `sensitive property forbidden: ${key}`);
      } else {
        addError(result, 'unsupported_field', keyPath, `unsupported property: ${key}`);
      }
    }
  }
}


function validateContractVersion(obj, result, path = 'contract_version') {
  if (!isObject(obj)) return;
  if (!isString(obj.contract_version)) {
    addError(result, 'invalid_request', path, `${path} is required and must be a string`);
  } else if (obj.contract_version !== EXECUTION_CONTRACT_VERSION) {
    addError(result, 'invalid_request', path, `${path} must be ${EXECUTION_CONTRACT_VERSION}`);
  }
}


function normalizeHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return String(value || '').trim();
  }
}

function isPrivateOrLocalHost(value) {
  const host = normalizeHost(value).toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host === '::1' || host === '[::1]') return true;
  if (host.startsWith('127.') || host === '0.0.0.0') return true;
  if (host.startsWith('10.') || host.startsWith('192.168.')) return true;
  if (host.startsWith('169.254.')) return true;
  const octets = host.split('.').map((part) => Number.parseInt(part, 10));
  return octets.length === 4 && octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31;
}

export function validateGatewayRequest(request) {
  const result = createResult(request);
  if (!isObject(request)) {
    addError(result, 'invalid_request', '$', 'Gateway request must be an object');
    return result;
  }

  for (const field of Object.keys(request)) {
    if (!CHAT_REQUEST_FIELDS.includes(field)) {
      addError(result, 'unsupported_field', field, `Unsupported chat request field: ${field}`);
    }
  }

  if (!isString(request.model)) {
    addError(result, 'invalid_request', 'model', 'model must be a non-empty string');
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    addError(result, 'invalid_request', 'messages', 'messages must be a non-empty array');
  } else {
    for (const [index, message] of request.messages.entries()) {
      const path = `messages[${index}]`;
      if (!isObject(message)) {
        addError(result, 'invalid_request', path, `${path} must be an object`);
        continue;
      }
      if (!CHAT_MESSAGE_ROLES.includes(message.role)) {
        addError(result, 'invalid_request', `${path}.role`, `${path}.role must be one of: ${CHAT_MESSAGE_ROLES.join(', ')}`);
      }
      if (!Object.prototype.hasOwnProperty.call(message, 'content')) {
        addError(result, 'invalid_request', `${path}.content`, `${path}.content is required`);
      } else if (
        message.content !== null
        && typeof message.content !== 'string'
        && !Array.isArray(message.content)
      ) {
        addError(result, 'invalid_request', `${path}.content`, `${path}.content must be a string, array, or null`);
      }
    }
  }

  if (request.stream !== undefined && typeof request.stream !== 'boolean') {
    addError(result, 'invalid_request', 'stream', 'stream must be a boolean when provided');
  }
  if (request.temperature !== undefined && (!isNumber(request.temperature) || request.temperature < 0 || request.temperature > 2)) {
    addError(result, 'invalid_request', 'temperature', 'temperature must be a number from 0 to 2');
  }
  if (request.top_p !== undefined && (!isNumber(request.top_p) || request.top_p < 0 || request.top_p > 1)) {
    addError(result, 'invalid_request', 'top_p', 'top_p must be a number from 0 to 1');
  }
  if (request.max_tokens !== undefined && (!Number.isInteger(request.max_tokens) || request.max_tokens <= 0)) {
    addError(result, 'invalid_request', 'max_tokens', 'max_tokens must be a positive integer');
  }
  if (request.stop !== undefined) {
    const validStop = isString(request.stop) || (Array.isArray(request.stop) && request.stop.every(isString));
    if (!validStop) addError(result, 'invalid_request', 'stop', 'stop must be a string or array of strings');
  }
  if (request.tools !== undefined && !Array.isArray(request.tools)) {
    addError(result, 'invalid_request', 'tools', 'tools must be an array when provided');
  }
  if (request.tool_choice !== undefined && !isString(request.tool_choice) && !isObject(request.tool_choice)) {
    addError(result, 'invalid_request', 'tool_choice', 'tool_choice must be a string or object when provided');
  }
  if (request.user !== undefined && !isString(request.user)) {
    addError(result, 'invalid_request', 'user', 'user must be a non-empty string when provided');
  }
  validateMetadata(request.metadata, result);

  return result;
}

export function validateUsage(usage) {
  const result = createResult(usage);
  if (!isObject(usage)) {
    addError(result, 'invalid_request', '$', 'usage must be an object');
    return result;
  }

  for (const field of [
    'input_tokens',
    'output_tokens',
    'total_tokens',
    'cached_input_tokens',
    'reasoning_tokens',
  ]) {
    const value = usage[field];
    if (value !== undefined && value !== null && (!Number.isInteger(value) || value < 0)) {
      addError(result, 'invalid_request', field, `${field} must be null or a non-negative integer`);
    }
  }

  if (usage.estimated !== undefined && typeof usage.estimated !== 'boolean') {
    addError(result, 'invalid_request', 'estimated', 'estimated must be a boolean');
  }
  if (usage.cost !== undefined && usage.cost !== null && (!isNumber(usage.cost) || usage.cost < 0)) {
    addError(result, 'invalid_request', 'cost', 'cost must be null or a non-negative number');
  }
  if (usage.currency !== undefined && usage.currency !== null && !isString(usage.currency)) {
    addError(result, 'invalid_request', 'currency', 'currency must be null or a string');
  }
  if (usage.provider_reported !== undefined && typeof usage.provider_reported !== 'boolean') {
    addError(result, 'invalid_request', 'provider_reported', 'provider_reported must be a boolean');
  }
  if (usage.tokenizer !== undefined && usage.tokenizer !== null && !isString(usage.tokenizer)) {
    addError(result, 'invalid_request', 'tokenizer', 'tokenizer must be null or a string');
  }
  validateMetadata(usage.metadata, result);

  return result;
}

export function validateGatewayResponse(response) {
  const result = createResult(response);
  if (!isObject(response)) {
    addError(result, 'invalid_request', '$', 'gateway response must be an object');
    return result;
  }

  for (const field of ['id', 'object', 'gateway_version', 'created']) {
    if (field === 'created') {
      if (!Number.isInteger(response[field]) || response[field] <= 0) {
        addError(result, 'invalid_request', field, `${field} must be a positive integer timestamp`);
      }
    } else if (!isString(response[field])) {
      addError(result, 'invalid_request', field, `${field} must be a non-empty string`);
    }
  }

  if (response.object === 'chat.completion' || response.object === 'chat.completion.chunk') {
    if (!isString(response.model)) addError(result, 'invalid_request', 'model', 'model must be a non-empty string');
    if (!isString(response.request_id)) addError(result, 'invalid_request', 'request_id', 'request_id must be a non-empty string');
    if (!isString(response.provider_id)) addError(result, 'invalid_request', 'provider_id', 'provider_id must be a non-empty string');
    if (!Array.isArray(response.choices)) addError(result, 'invalid_request', 'choices', 'choices must be an array');
  }

  if (response.usage !== undefined && response.usage !== null) {
    const usageResult = validateUsage(response.usage);
    for (const error of usageResult.errors) addError(result, error.code, `usage.${error.path}`, error.message);
  }

  return result;
}

export function validateProviderAdapter(adapter) {
  const result = createResult(adapter);
  if (!isObject(adapter)) {
    addError(result, 'configuration_error', '$', 'provider adapter must be an object');
    return result;
  }

  for (const field of ['id', 'name', 'type', 'version', 'credential_env', 'base_url']) {
    if (field === 'credential_env') {
      if (adapter[field] !== null && adapter[field] !== undefined && !isString(adapter[field])) {
        addError(result, 'configuration_error', field, `${field} must be null or a string`);
      }
    } else if (!isString(adapter[field])) {
      addError(result, 'configuration_error', field, `${field} must be a non-empty string`);
    }
  }
  if (!PROVIDER_TYPES.includes(adapter.type)) {
    addError(result, 'configuration_error', 'type', `type must be one of: ${PROVIDER_TYPES.join(', ')}`);
  }
  validateStringArray(adapter.capabilities, result, 'capabilities', { required: true });
  for (const capability of adapter.capabilities || []) {
    if (!PROVIDER_CAPABILITIES.includes(capability)) {
      addError(result, 'unsupported_capability', 'capabilities', `Unsupported provider capability: ${capability}`);
    }
  }
  if (!Array.isArray(adapter.models) || adapter.models.length === 0) {
    addError(result, 'configuration_error', 'models', 'models must be a non-empty array');
  }
  for (const method of [
    'validateConfig',
    'listModels',
    'normalizeRequest',
    'invoke',
    'normalizeResponse',
    'stream',
    'classifyError',
    'health',
    'redact',
  ]) {
    if (typeof adapter[method] !== 'function') {
      addError(result, 'configuration_error', method, `${method} must be a function`);
    }
  }

  return result;
}

export function validateRoutingRequest(request) {
  const result = createResult(request);
  if (!isObject(request)) {
    addError(result, 'invalid_request', '$', 'routing request must be an object');
    return result;
  }
  if (request.requested_model !== undefined && request.requested_model !== null && !isString(request.requested_model)) {
    addError(result, 'invalid_request', 'requested_model', 'requested_model must be null or a string');
  }
  if (request.requested_provider !== undefined && request.requested_provider !== null && !isString(request.requested_provider)) {
    addError(result, 'invalid_request', 'requested_provider', 'requested_provider must be null or a string');
  }
  validateStringArray(request.required_capabilities || [], result, 'required_capabilities');
  validateStringArray(request.preferred_capabilities || [], result, 'preferred_capabilities');
  validateStringArray(request.excluded_providers || [], result, 'excluded_providers');
  validateStringArray(request.excluded_models || [], result, 'excluded_models');
  for (const capability of [...(request.required_capabilities || []), ...(request.preferred_capabilities || [])]) {
    if (!PROVIDER_CAPABILITIES.includes(capability)) {
      addError(result, 'unsupported_capability', 'capabilities', `Unsupported routing capability: ${capability}`);
    }
  }
  if (request.estimated_input_tokens !== undefined && request.estimated_input_tokens !== null && (!Number.isInteger(request.estimated_input_tokens) || request.estimated_input_tokens < 0)) {
    addError(result, 'invalid_request', 'estimated_input_tokens', 'estimated_input_tokens must be null or a non-negative integer');
  }
  if (request.required_context_window !== undefined && request.required_context_window !== null && (!Number.isInteger(request.required_context_window) || request.required_context_window <= 0)) {
    addError(result, 'invalid_request', 'required_context_window', 'required_context_window must be null or a positive integer');
  }
  if (request.privacy_policy !== undefined && !PRIVACY_POLICIES.includes(request.privacy_policy)) {
    addError(result, 'invalid_request', 'privacy_policy', `privacy_policy must be one of: ${PRIVACY_POLICIES.join(', ')}`);
  }
  if (request.cost_preference !== undefined && !COST_PREFERENCES.includes(request.cost_preference)) {
    addError(result, 'invalid_request', 'cost_preference', `cost_preference must be one of: ${COST_PREFERENCES.join(', ')}`);
  }
  if (request.latency_preference !== undefined && !LATENCY_PREFERENCES.includes(request.latency_preference)) {
    addError(result, 'invalid_request', 'latency_preference', `latency_preference must be one of: ${LATENCY_PREFERENCES.join(', ')}`);
  }
  if (request.fallback_allowed !== undefined && typeof request.fallback_allowed !== 'boolean') {
    addError(result, 'invalid_request', 'fallback_allowed', 'fallback_allowed must be a boolean');
  }
  validateMetadata(request.metadata, result);
  return result;
}

export function validateRouteDecision(decision) {
  const result = createResult(decision);
  if (!isObject(decision)) {
    addError(result, 'invalid_request', '$', 'route decision must be an object');
    return result;
  }
  for (const field of ['selected_provider', 'selected_model', 'strategy', 'request_id']) {
    if (!isString(decision[field])) addError(result, 'invalid_request', field, `${field} must be a non-empty string`);
  }
  if (!ROUTING_STRATEGIES.includes(decision.strategy)) {
    addError(result, 'invalid_request', 'strategy', `strategy must be one of: ${ROUTING_STRATEGIES.join(', ')}`);
  }
  if (!isNumber(decision.score) || decision.score < 0 || decision.score > 1) {
    addError(result, 'invalid_request', 'score', 'score must be a number from 0 to 1');
  }
  validateStringArray(decision.reasons, result, 'reasons', { required: true });
  if (!Array.isArray(decision.rejected_candidates)) addError(result, 'invalid_request', 'rejected_candidates', 'rejected_candidates must be an array');
  if (!Array.isArray(decision.fallback_chain)) addError(result, 'invalid_request', 'fallback_chain', 'fallback_chain must be an array');
  validateStringArray(decision.warnings || [], result, 'warnings');
  if (!Number.isInteger(decision.decision_timestamp) || decision.decision_timestamp <= 0) {
    addError(result, 'invalid_request', 'decision_timestamp', 'decision_timestamp must be a positive integer timestamp');
  }
  return result;
}

export function validateGatewayConfig(config = DEFAULT_GATEWAY_CONFIG) {
  const result = createResult(config);
  if (!isObject(config)) {
    addError(result, 'configuration_error', '$', 'gateway config must be an object');
    return result;
  }
  if (!isString(config.host)) addError(result, 'configuration_error', 'host', 'host must be a non-empty string');
  if (!Number.isInteger(config.port) || config.port <= 0 || config.port > 65535) {
    addError(result, 'configuration_error', 'port', 'port must be an integer from 1 to 65535');
  }
  if (config.host !== '127.0.0.1' && config.host !== 'localhost' && config.allow_remote_binding !== true) {
    addError(result, 'policy_denied', 'host', 'remote binding requires allow_remote_binding=true');
  }
  if (!isObject(config.auth)) {
    addError(result, 'configuration_error', 'auth', 'auth must be an object');
  } else if (config.allow_remote_binding === true && config.auth.mode === 'none') {
    addError(result, 'policy_denied', 'auth.mode', 'non-local gateway access cannot be anonymous');
  }
  for (const field of ['request_size_limit', 'request_timeout_ms', 'stream_idle_timeout_ms', 'provider_timeout_ms']) {
    if (!Number.isInteger(config[field]) || config[field] <= 0) {
      addError(result, 'configuration_error', field, `${field} must be a positive integer`);
    }
  }
  if (!Number.isInteger(config.retry_limit) || config.retry_limit < 0 || config.retry_limit > 3) {
    addError(result, 'configuration_error', 'retry_limit', 'retry_limit must be an integer from 0 to 3');
  }
  if (config.redact_prompts !== true) {
    addError(result, 'policy_denied', 'redact_prompts', 'redact_prompts must default to true');
  }
  if (!Array.isArray(config.allowed_provider_hosts)) {
    addError(result, 'configuration_error', 'allowed_provider_hosts', 'allowed_provider_hosts must be an array');
  } else {
    for (const [index, host] of config.allowed_provider_hosts.entries()) {
      if (!isString(host)) {
        addError(result, 'configuration_error', `allowed_provider_hosts[${index}]`, 'allowed_provider_hosts entries must be non-empty strings');
      } else if (isPrivateOrLocalHost(host)) {
        addError(result, 'policy_denied', `allowed_provider_hosts[${index}]`, 'private or local provider hosts require a future explicit approval path');
      }
    }
  }
  if (config.allow_private_provider_networks !== false) {
    addError(result, 'policy_denied', 'allow_private_provider_networks', 'private provider networks require a future explicit approval path');
  }
  if (!ROUTING_STRATEGIES.includes(config.default_routing_strategy)) {
    addError(result, 'configuration_error', 'default_routing_strategy', `default_routing_strategy must be one of: ${ROUTING_STRATEGIES.join(', ')}`);
  }
  if (typeof config.fallback_enabled !== 'boolean') {
    addError(result, 'configuration_error', 'fallback_enabled', 'fallback_enabled must be a boolean');
  }
  return result;
}

export function validateGatewayErrorShape(errorResponse) {
  const result = createResult(errorResponse);
  if (!isObject(errorResponse) || !isObject(errorResponse.error)) {
    addError(result, 'invalid_request', '$', 'error response must contain error object');
    return result;
  }
  const error = errorResponse.error;
  if (!ERROR_CODES.includes(error.code)) addError(result, 'invalid_request', 'error.code', 'error.code is not in taxonomy');
  if (!isString(error.message)) addError(result, 'invalid_request', 'error.message', 'error.message must be a string');
  if (!isString(error.type)) addError(result, 'invalid_request', 'error.type', 'error.type must be a string');
  if (!Number.isInteger(error.status)) addError(result, 'invalid_request', 'error.status', 'error.status must be an integer');
  if (typeof error.retryable !== 'boolean') addError(result, 'invalid_request', 'error.retryable', 'error.retryable must be a boolean');
  return result;
}

export function validateCredentialRef(ref) {
  const result = createResult(ref);
  if (!isObject(ref)) {
    addError(result, 'authentication_required', '$', 'credential reference must be an object');
    return result;
  }
  validateAllowedKeys(ref, CREDENTIAL_REF_KEYS, result);
  validateContractVersion(ref, result);
  validateRequiredFields(ref, CREDENTIAL_REF_REQUIRED_FIELDS, result);
  if (ref.source !== 'environment') {
    addError(result, 'authentication_required', 'source', 'source must be environment');
  }
  if (!isString(ref.env_var)) {
    addError(result, 'authentication_required', 'env_var', 'env_var must be a non-empty string');
  } else {
    if (PROTOTYPE_NAMES_PATTERN.test(ref.env_var)) {
      addError(result, 'policy_denied', 'env_var', 'env_var cannot be prototype-sensitive name');
    }
    if (!STRICT_ENV_VAR_REGEX.test(ref.env_var)) {
      addError(result, 'policy_denied', 'env_var', 'env_var must be a valid uppercase variable name (^[A-Z_][A-Z0-9_]{0,127}$)');
    }
    if (SENSITIVE_KEY_PATTERN.test(ref.env_var) && ref.env_var.length > 64) {
      addError(result, 'policy_denied', 'env_var', 'env_var appears to contain an actual secret value instead of a variable name');
    }
  }
  if (ref.required !== undefined && typeof ref.required !== 'boolean') {
    addError(result, 'invalid_request', 'required', 'required must be a boolean');
  }
  return result;
}

export function validateProviderEndpoint(endpoint) {
  const result = createResult(endpoint);
  if (!isObject(endpoint)) {
    addError(result, 'configuration_error', '$', 'provider endpoint must be an object');
    return result;
  }
  validateAllowedKeys(endpoint, PROVIDER_ENDPOINT_KEYS, result);
  validateContractVersion(endpoint, result);
  validateRequiredFields(endpoint, PROVIDER_ENDPOINT_REQUIRED_FIELDS, result);
  if (!isString(endpoint.url)) {
    addError(result, 'configuration_error', 'url', 'url must be a non-empty string');
  } else {
    let parsed;
    try {
      parsed = new URL(endpoint.url);
    } catch {
      addError(result, 'configuration_error', 'url', 'url must be a valid URL');
    }
    if (parsed) {
      if (!EXECUTION_PROTOCOLS.includes(parsed.protocol.replace(':', ''))) {
        addError(result, 'policy_denied', 'url', `url protocol must be one of: ${EXECUTION_PROTOCOLS.join(', ')}`);
      }
      if (parsed.username || parsed.password) {
        addError(result, 'policy_denied', 'url', 'url must not contain embedded credentials');
      }
      if (isPrivateOrLocalHost(parsed.hostname)) {
        addError(result, 'policy_denied', 'url', 'url must not target private or local network addresses');
      }
    }
  }
  if (endpoint.protocol !== undefined && endpoint.protocol !== 'https') {
    addError(result, 'policy_denied', 'protocol', 'protocol must be https');
  }
  if (endpoint.headers_allowlist !== undefined) {
    if (!Array.isArray(endpoint.headers_allowlist)) {
      addError(result, 'configuration_error', 'headers_allowlist', 'headers_allowlist must be an array');
    } else {
      for (const [index, header] of endpoint.headers_allowlist.entries()) {
        if (!ALLOWED_TRANSPORT_HEADERS.includes(header)) {
          addError(result, 'policy_denied', `headers_allowlist[${index}]`, `header "${header}" is not in the transport allowlist`);
        }
      }
    }
  }
  if (endpoint.follow_redirects !== undefined && endpoint.follow_redirects !== false) {
    addError(result, 'policy_denied', 'follow_redirects', 'follow_redirects must be false for security');
  }
  if (endpoint.ssrf_check_required !== undefined && endpoint.ssrf_check_required !== true) {
    addError(result, 'policy_denied', 'ssrf_check_required', 'ssrf_check_required must be true');
  }
  return result;
}

export function validateExecutionPolicy(policy) {
  const result = createResult(policy);
  if (!isObject(policy)) {
    addError(result, 'configuration_error', '$', 'execution policy must be an object');
    return result;
  }
  validateAllowedKeys(policy, EXECUTION_POLICY_KEYS, result);
  validateContractVersion(policy, result);
  validateRequiredFields(policy, EXECUTION_POLICY_REQUIRED_FIELDS, result);
  if (policy.enabled !== undefined && typeof policy.enabled !== 'boolean') {
    addError(result, 'configuration_error', 'enabled', 'enabled must be a boolean');
  }
  validateStringArray(policy.allowed_provider_ids, result, 'allowed_provider_ids');
  if (policy.require_https !== undefined && policy.require_https !== true) {
    addError(result, 'policy_denied', 'require_https', 'require_https must be true');
  }
  if (policy.allow_private_networks !== undefined && policy.allow_private_networks !== false) {
    addError(result, 'policy_denied', 'allow_private_networks', 'allow_private_networks must be false');
  }
  if (policy.follow_redirects !== undefined && policy.follow_redirects !== false) {
    addError(result, 'policy_denied', 'follow_redirects', 'follow_redirects must be false');
  }
  if (policy.max_attempts !== undefined && policy.max_attempts !== 1) {
    addError(result, 'policy_denied', 'max_attempts', 'max_attempts must be 1 in Sprint A contract');
  }
  if (policy.retry_enabled !== undefined && policy.retry_enabled !== false) {
    addError(result, 'policy_denied', 'retry_enabled', 'retry_enabled must be false in Sprint A contract');
  }
  if (policy.fallback_enabled !== undefined && policy.fallback_enabled !== false) {
    addError(result, 'policy_denied', 'fallback_enabled', 'fallback_enabled must be false in Sprint A contract');
  }
  for (const field of ['request_timeout_ms', 'response_timeout_ms']) {
    if (policy[field] !== undefined && (!Number.isInteger(policy[field]) || policy[field] <= 0 || policy[field] > 300000)) {
      addError(result, 'configuration_error', field, `${field} must be a positive integer <= 300000`);
    }
  }
  for (const field of ['max_request_bytes', 'max_response_bytes']) {
    if (policy[field] !== undefined && (!Number.isInteger(policy[field]) || policy[field] <= 0 || policy[field] > 52428800)) {
      addError(result, 'configuration_error', field, `${field} must be a positive integer <= 52428800`);
    }
  }
  if (policy.observability_policy_id !== undefined && policy.observability_policy_id !== null && !isString(policy.observability_policy_id)) {
    addError(result, 'configuration_error', 'observability_policy_id', 'observability_policy_id must be null or a string');
  }
  validateSafeMetadata(policy.metadata, result);
  return result;
}

export function validateProviderExecutionCapability(capability) {
  const result = createResult(capability);
  if (!isObject(capability)) {
    addError(result, 'invalid_request', '$', 'provider execution capability must be an object');
    return result;
  }
  validateAllowedKeys(capability, PROVIDER_CAPABILITY_KEYS, result);
  validateContractVersion(capability, result);
  validateRequiredFields(capability, PROVIDER_CAPABILITY_REQUIRED_FIELDS, result);
  for (const field of [
    'chat_completions',
    'non_streaming',
    'sse_streaming',
    'usage_reporting',
    'tool_calls',
    'structured_output',
    'system_messages',
    'custom_endpoint_support',
  ]) {
    if (capability[field] !== undefined && typeof capability[field] !== 'boolean') {
      addError(result, 'invalid_request', field, `${field} must be a boolean`);
    }
  }
  if (capability.supported_auth_schemes !== undefined) {
    validateStringArray(capability.supported_auth_schemes, result, 'supported_auth_schemes');
  }
  validateSafeMetadata(capability.metadata, result);
  return result;
}

export function validateExecutionError(error) {
  const result = createResult(error);
  if (!isObject(error)) {
    addError(result, 'invalid_request', '$', 'execution error must be an object');
    return result;
  }
  validateAllowedKeys(error, EXECUTION_ERROR_KEYS, result);
  validateContractVersion(error, result);
  validateRequiredFields(error, EXECUTION_ERROR_REQUIRED_FIELDS, result);
  if (!isString(error.code) || !EXECUTION_ERROR_CATEGORIES.includes(error.code)) {
    addError(result, 'invalid_request', 'code', `code must be one of: ${EXECUTION_ERROR_CATEGORIES.join(', ')}`);
  }
  if (!isString(error.category)) {
    addError(result, 'invalid_request', 'category', 'category must be a non-empty string');
  }
  if (!isString(error.message)) {
    addError(result, 'invalid_request', 'message', 'message must be a non-empty string');
  }
  if (typeof error.retryable !== 'boolean') {
    addError(result, 'invalid_request', 'retryable', 'retryable must be a boolean');
  }
  if (error.request_id !== undefined && error.request_id !== null && !isString(error.request_id)) {
    addError(result, 'invalid_request', 'request_id', 'request_id must be null or a string');
  }
  if (error.provider_id !== undefined && error.provider_id !== null && !isString(error.provider_id)) {
    addError(result, 'invalid_request', 'provider_id', 'provider_id must be null or a string');
  }
  if (error.status !== undefined && error.status !== null && (!Number.isInteger(error.status) || error.status < 100 || error.status > 599)) {
    addError(result, 'invalid_request', 'status', 'status must be null or an integer from 100 to 599');
  }
  if (error.details !== undefined && error.details !== null) {
    if (!isObject(error.details)) {
      addError(result, 'invalid_request', 'details', 'details must be an object or null');
    } else {
      validateSafeMetadata(error.details, result, 'details');
    }
  }
  if (error.redacted !== true) {
    addError(result, 'policy_denied', 'redacted', 'redacted must be true on execution errors');
  }
  return result;
}

export function validateExecutionRequest(request) {
  const result = createResult(request);
  if (!isObject(request)) {
    addError(result, 'invalid_request', '$', 'execution request must be an object');
    return result;
  }
  validateAllowedKeys(request, EXECUTION_REQUEST_KEYS, result);
  validateContractVersion(request, result);
  validateRequiredFields(request, EXECUTION_REQUEST_REQUIRED_FIELDS, result);
  if (!isString(request.request_id)) {
    addError(result, 'invalid_request', 'request_id', 'request_id must be a non-empty string');
  }
  if (!isString(request.provider_id)) {
    addError(result, 'invalid_request', 'provider_id', 'provider_id must be a non-empty string');
  }
  if (!isString(request.model_id)) {
    addError(result, 'invalid_request', 'model_id', 'model_id must be a non-empty string');
  }
  if (!isObject(request.gateway_request)) {
    addError(result, 'invalid_request', 'gateway_request', 'gateway_request must be an object');
  } else {
    const gwReqResult = validateGatewayRequest(request.gateway_request);
    for (const err of gwReqResult.errors) {
      addError(result, err.code, `gateway_request.${err.path}`, err.message);
    }
    if (gwReqResult.success && request.gateway_request.model !== request.model_id) {
      addError(result, 'invalid_request', 'model_id', `model_id (${request.model_id}) must match gateway_request.model (${request.gateway_request.model})`);
    }
  }
  if (request.credential_ref !== undefined && request.credential_ref !== null) {
    const credResult = validateCredentialRef(request.credential_ref);
    for (const err of credResult.errors) {
      addError(result, err.code, `credential_ref.${err.path}`, err.message);
    }
  }
  if (request.endpoint !== undefined && request.endpoint !== null) {
    const epResult = validateProviderEndpoint(request.endpoint);
    for (const err of epResult.errors) {
      addError(result, err.code, `endpoint.${err.path}`, err.message);
    }
  }
  if (request.policy !== undefined && request.policy !== null) {
    const polResult = validateExecutionPolicy(request.policy);
    for (const err of polResult.errors) {
      addError(result, err.code, `policy.${err.path}`, err.message);
    }
    if (request.policy.enabled === true) {
      if (!request.endpoint) {
        addError(result, 'policy_denied', 'endpoint', 'endpoint is required when execution policy is enabled');
      }
      if (!request.credential_ref) {
        addError(result, 'policy_denied', 'credential_ref', 'credential_ref is required when execution policy is enabled');
      }
    }
  }
  if (request.capability !== undefined && request.capability !== null) {
    const capResult = validateProviderExecutionCapability(request.capability);
    for (const err of capResult.errors) {
      addError(result, err.code, `capability.${err.path}`, err.message);
    }
    if (request.gateway_request && request.gateway_request.stream === true && request.capability.sse_streaming !== true) {
      addError(result, 'unsupported_capability', 'capability.sse_streaming', 'stream requested but provider capability sse_streaming is false');
    }
  }
  if (request.options !== undefined && request.options !== null) {
    if (!isObject(request.options)) {
      addError(result, 'invalid_request', 'options', 'options must be an object');
    } else {
      const allowedOptions = ['timeout_ms', 'max_response_bytes', 'stream', 'follow_redirects'];
      for (const key of Object.keys(request.options)) {
        if (!allowedOptions.includes(key)) {
          addError(result, 'unsupported_field', `options.${key}`, `unsupported option key: ${key}`);
        }
      }
      if (request.options.timeout_ms !== undefined && (!Number.isInteger(request.options.timeout_ms) || request.options.timeout_ms <= 0)) {
        addError(result, 'invalid_request', 'options.timeout_ms', 'timeout_ms must be a positive integer');
      }
      if (request.options.max_response_bytes !== undefined && (!Number.isInteger(request.options.max_response_bytes) || request.options.max_response_bytes <= 0)) {
        addError(result, 'invalid_request', 'options.max_response_bytes', 'max_response_bytes must be a positive integer');
      }
      if (request.options.stream !== undefined && typeof request.options.stream !== 'boolean') {
        addError(result, 'invalid_request', 'options.stream', 'stream must be a boolean');
      }
      if (request.options.follow_redirects !== undefined && request.options.follow_redirects !== false) {
        addError(result, 'policy_denied', 'options.follow_redirects', 'follow_redirects must be false for security');
      }
    }
  }
  validateSafeMetadata(request.metadata, result);
  return result;
}

export function validateExecutionResult(executionResult) {
  const result = createResult(executionResult);
  if (!isObject(executionResult)) {
    addError(result, 'invalid_request', '$', 'execution result must be an object');
    return result;
  }
  validateAllowedKeys(executionResult, EXECUTION_RESULT_KEYS, result);
  validateContractVersion(executionResult, result);
  validateRequiredFields(executionResult, EXECUTION_RESULT_REQUIRED_FIELDS, result);
  if (!isString(executionResult.request_id)) {
    addError(result, 'invalid_request', 'request_id', 'request_id must be a non-empty string');
  }
  if (!isString(executionResult.provider_id)) {
    addError(result, 'invalid_request', 'provider_id', 'provider_id must be a non-empty string');
  }
  if (!isString(executionResult.model_id)) {
    addError(result, 'invalid_request', 'model_id', 'model_id must be a non-empty string');
  }
  if (!EXECUTION_STATES.includes(executionResult.state)) {
    addError(result, 'invalid_request', 'state', `state must be one of: ${EXECUTION_STATES.join(', ')}`);
  }
  if (executionResult.attempt_count !== undefined && executionResult.attempt_count !== 1 && (executionResult.state !== 'pending' || executionResult.attempt_count !== 0)) {
    addError(result, 'policy_denied', 'attempt_count', 'attempt_count must be 1');
  }
  if (executionResult.state === 'completed') {
    if (!isObject(executionResult.gateway_response)) {
      addError(result, 'invalid_request', 'gateway_response', 'gateway_response is required when state is completed');
    } else {
      const respResult = validateGatewayResponse(executionResult.gateway_response);
      for (const err of respResult.errors) {
        addError(result, err.code, `gateway_response.${err.path}`, err.message);
      }
    }
    if (executionResult.error !== null && executionResult.error !== undefined) {
      addError(result, 'invalid_request', 'error', 'error must be null when state is completed');
    }
  }
  if (executionResult.state === 'failed') {
    if (!isObject(executionResult.error)) {
      addError(result, 'invalid_request', 'error', 'error is required when state is failed');
    } else {
      const errResult = validateExecutionError(executionResult.error);
      for (const err of errResult.errors) {
        addError(result, err.code, `error.${err.path}`, err.message);
      }
    }
    if (executionResult.gateway_response !== null && executionResult.gateway_response !== undefined) {
      addError(result, 'invalid_request', 'gateway_response', 'gateway_response must be null when state is failed');
    }
  }
  if (executionResult.timing !== undefined && executionResult.timing !== null) {
    if (!isObject(executionResult.timing)) {
      addError(result, 'invalid_request', 'timing', 'timing must be an object');
    } else {
      for (const field of ['started_at', 'completed_at', 'duration_ms']) {
        const value = executionResult.timing[field];
        if (value !== undefined && value !== null && (!isNumber(value) || value < 0)) {
          addError(result, 'invalid_request', `timing.${field}`, `${field} must be null or a non-negative number`);
        }
      }
      const { started_at, completed_at, duration_ms } = executionResult.timing;
      if (isNumber(started_at) && isNumber(completed_at)) {
        if (completed_at < started_at) {
          addError(result, 'invalid_request', 'timing.completed_at', 'completed_at cannot be before started_at');
        }
        if (isNumber(duration_ms) && duration_ms !== (completed_at - started_at)) {
          addError(result, 'invalid_request', 'timing.duration_ms', `duration_ms (${duration_ms}) must match completed_at - started_at (${completed_at - started_at})`);
        }
      }
    }
  }
  if (executionResult.usage !== undefined && executionResult.usage !== null) {
    const usageResult = validateUsage(executionResult.usage);
    for (const err of usageResult.errors) {
      addError(result, err.code, `usage.${err.path}`, err.message);
    }
  }
  if (executionResult.redacted !== true) {
    addError(result, 'policy_denied', 'redacted', 'redacted must be true on execution results');
  }
  validateSafeMetadata(executionResult.metadata, result);
  return result;
}
