import {
  CLIENT_CATEGORIES,
  CLIENT_PROTOCOLS,
  CLIENT_STATUSES,
  COMPATIBILITY_LEVELS,
  EXECUTABLE_MOCK_MODELS,
} from './profiles.js';
import { validateGatewayEndpointConfig } from './endpoint.js';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function add(errors, code, path, message) {
  errors.push({ code, path, message });
}

export function validateGatewayClientProfile(profile) {
  const errors = [];
  if (!isObject(profile)) {
    add(errors, 'invalid_profile', '$', 'client profile must be an object');
    return { success: false, errors, warnings: [], value: profile };
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(profile.id || '')) add(errors, 'invalid_id', 'id', 'id must be a lowercase slug');
  if (!isNonEmptyString(profile.name)) add(errors, 'missing_name', 'name', 'name is required');
  if (!CLIENT_CATEGORIES.includes(profile.category)) add(errors, 'invalid_category', 'category', 'category is not recognized');
  if (!CLIENT_STATUSES.includes(profile.status)) add(errors, 'invalid_status', 'status', 'status is not recognized');
  if (!CLIENT_PROTOCOLS.includes(profile.protocol)) add(errors, 'invalid_protocol', 'protocol', 'protocol is not recognized');
  for (const field of [
    'supports_base_url',
    'supports_model_override',
    'supports_streaming',
    'supports_tools',
    'supports_custom_headers',
    'supports_bearer_token',
  ]) {
    if (typeof profile[field] !== 'boolean') add(errors, 'invalid_boolean', field, `${field} must be boolean`);
  }
  for (const field of ['configuration_formats', 'configuration_locations', 'executable_mock_models', 'limitations']) {
    if (!Array.isArray(profile[field])) add(errors, 'invalid_array', field, `${field} must be an array`);
  }
  for (const model of profile.executable_mock_models || []) {
    if (!EXECUTABLE_MOCK_MODELS.includes(model)) add(errors, 'invalid_model', 'executable_mock_models', `unsupported mock model: ${model}`);
  }
  if (profile.status === 'validated' && profile.metadata?.validated_local !== true) {
    add(errors, 'missing_evidence', 'metadata.validated_local', 'validated profiles must include local validation evidence');
  }
  return { success: errors.length === 0, errors, warnings: [], value: profile };
}

export function validateGatewayClientCompatibility({
  client,
  endpoint,
  requestedFeatures = {},
  model = 'mock-chat',
} = {}) {
  const errors = [];
  const warnings = [];
  const unsupported = [];
  const supported = [];
  const endpointResult = validateGatewayEndpointConfig(endpoint);
  if (!endpointResult.success) errors.push(...endpointResult.errors);
  if (!client) add(errors, 'unknown_client', 'client', 'client profile is required');
  if (!EXECUTABLE_MOCK_MODELS.includes(model)) {
    unsupported.push('model');
    warnings.push('Only mock models are executable in Sprint F client plans.');
  } else {
    supported.push('mock-model');
  }
  if (requestedFeatures.streaming === true) {
    if (client?.supports_streaming && endpointResult.value?.streaming && model === 'mock-stream') supported.push('streaming');
    else unsupported.push('streaming');
  }
  if (requestedFeatures.tools === true) {
    if (client?.supports_tools && model === 'mock-tools') supported.push('tools');
    else unsupported.push('tools');
  }
  if (endpointResult.value?.auth_mode === 'bearer-token') {
    if (client?.supports_bearer_token || client?.supports_custom_headers) supported.push('bearer-token');
    else unsupported.push('bearer-token');
  }
  if (client?.supports_base_url) supported.push('base-url');
  else unsupported.push('base-url');

  let level = 'unsupported';
  if (errors.length > 0 || client?.status === 'unsupported') level = 'unsupported';
  else if (client?.metadata?.validated_local === true) level = 'validated-local';
  else if (client?.status === 'adapter-ready') level = 'protocol-compatible';
  else if (client?.status === 'example-only') level = 'configuration-example';
  else level = 'manual-review';

  return {
    compatible: errors.length === 0 && unsupported.length === 0 && level !== 'unsupported',
    level: COMPATIBILITY_LEVELS.includes(level) ? level : 'manual-review',
    supported_features: Array.from(new Set(supported)).sort(),
    unsupported_features: Array.from(new Set(unsupported)).sort(),
    required_manual_steps: client?.metadata?.manual_steps || [],
    warnings,
    reasons: errors.map((error) => error.message),
    validation: { endpoint: endpointResult },
  };
}
