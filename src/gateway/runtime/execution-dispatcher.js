import { validateProviderAdapter } from '../contracts/provider-adapter.js';
import { validateProviderEndpoint } from '../contracts/provider-endpoint.js';
import { validateExecutionPolicy } from '../contracts/execution-policy.js';
import { validateProviderExecutionCapability } from '../contracts/provider-execution-capability.js';
import { validateCredentialRef } from '../contracts/credential-ref.js';
import { validateTransport } from '../execution/transport-contract.js';
import { validateEndpointBinding } from '../execution/execution-gate.js';
import { createExecutionRequest } from '../contracts/execution-request.js';
import { executeGovernedRequest } from '../execution/executor.js';
import { executeGovernedStream } from '../execution/stream-executor.js';
import { createExecutionError } from '../contracts/execution-error.js';
import { createRuntimeError } from './errors.js';
import { EXECUTION_CONTRACT_VERSION } from '../protocol/constants.js';

const RESERVED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-.:]{1,128}$/;

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isString(val) {
  return typeof val === 'string' && val.length > 0;
}

function isValidSafeKey(key) {
  if (!isString(key) || key.length > 128) return false;
  if (RESERVED_KEYS.has(key)) return false;
  if (!SAFE_ID_REGEX.test(key)) return false;
  if (key.includes('/') || key.includes('\\') || key.includes('..')) return false;
  if (/[\x00-\x1F\x7F-\x9F]/.test(key)) return false;
  return true;
}

function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const prop = obj[key];
    if (prop !== null && typeof prop === 'object') {
      deepFreeze(prop);
    }
  }
  return obj;
}

function cloneStructural(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (typeof obj === 'function') return obj;
  return deepFreeze(JSON.parse(JSON.stringify(obj)));
}

function freezeAdapterFacade(adapter) {
  if (!adapter || typeof adapter !== 'object') return adapter;
  return Object.freeze({
    id: adapter.id,
    name: adapter.name,
    type: adapter.type,
    version: adapter.version,
    capabilities: Object.freeze(Array.isArray(adapter.capabilities) ? [...adapter.capabilities] : []),
    credential_env: adapter.credential_env || null,
    base_url: adapter.base_url,
    models: Object.freeze(Array.isArray(adapter.models) ? [...adapter.models] : []),
    validateConfig: adapter.validateConfig,
    listModels: adapter.listModels,
    normalizeRequest: adapter.normalizeRequest,
    invoke: adapter.invoke,
    normalizeResponse: adapter.normalizeResponse,
    stream: adapter.stream,
    classifyError: adapter.classifyError,
    health: adapter.health,
    redact: adapter.redact,
  });
}

function compileGovernedRuntimeConfig(config = {}) {
  const errors = [];
  if (!isObject(config)) {
    return { success: false, enabled: false, errors: [{ code: 'invalid_config', message: 'governed_execution must be an object' }] };
  }

  const enabled = config.enabled === true;

  if (config.environment !== undefined && config.environment !== null && !isObject(config.environment)) {
    errors.push({ code: 'invalid_environment', message: 'environment must be an object or null' });
  }

  if (config.clock !== undefined && config.clock !== null && typeof config.clock !== 'function') {
    errors.push({ code: 'invalid_clock', message: 'clock must be a function or null' });
  }

  if (enabled) {
    if (config.transport) {
      const transportCheck = validateTransport(config.transport);
      if (!transportCheck.success) {
        errors.push({ code: 'invalid_transport', message: 'Injected transport contract validation failed' });
      }
    } else {
      errors.push({ code: 'invalid_transport', message: 'Injected transport is required when governed_execution is enabled' });
    }
  }

  const validatedProviders = Object.create(null);
  if (config.providers !== undefined) {
    if (!isObject(config.providers)) {
      errors.push({ code: 'invalid_providers', message: 'providers mapping must be an object' });
    } else {
      for (const [providerId, pConfig] of Object.entries(config.providers)) {
        let providerValid = true;

        if (!isValidSafeKey(providerId)) {
          errors.push({ code: 'invalid_provider_id', message: `Invalid or reserved provider ID: ${providerId}` });
          continue;
        }
        if (!isObject(pConfig)) {
          errors.push({ code: 'invalid_provider_config', message: `Provider ${providerId} config must be an object` });
          continue;
        }

        const adapterCheck = validateProviderAdapter(pConfig.provider_adapter);
        if (!adapterCheck.success) {
          errors.push({ code: 'invalid_adapter', message: `Provider ${providerId} adapter validation failed` });
          providerValid = false;
        } else {
          if (pConfig.provider_adapter.type !== 'openai-compatible') {
            errors.push({ code: 'invalid_adapter_type', message: `Provider ${providerId} adapter type must be openai-compatible` });
            providerValid = false;
          }
          if (providerId !== pConfig.provider_adapter.id) {
            errors.push({ code: 'provider_id_mismatch', message: `Provider key (${providerId}) must match provider_adapter.id (${pConfig.provider_adapter.id})` });
            providerValid = false;
          }
        }

        const endpointCheck = validateProviderEndpoint(pConfig.endpoint);
        if (!endpointCheck.success) {
          errors.push({ code: 'invalid_endpoint', message: `Provider ${providerId} endpoint validation failed` });
          providerValid = false;
        }

        if (pConfig.provider_adapter && pConfig.endpoint) {
          const bindingCheck = validateEndpointBinding({
            endpoint: pConfig.endpoint,
            base_url: pConfig.provider_adapter.base_url,
          });
          if (!bindingCheck.success) {
            errors.push({ code: 'invalid_endpoint_binding', message: `Provider ${providerId} endpoint binding failed: ${bindingCheck.reason}` });
            providerValid = false;
          }
        }

        const policyCheck = validateExecutionPolicy(pConfig.policy);
        if (!policyCheck.success) {
          errors.push({ code: 'invalid_policy', message: `Provider ${providerId} policy validation failed` });
          providerValid = false;
        } else {
          if (pConfig.policy.enabled !== true) {
            errors.push({ code: 'provider_not_enabled', message: `Provider ${providerId} policy enabled must be true` });
            providerValid = false;
          }
          if (!Array.isArray(pConfig.policy.allowed_provider_ids) || !pConfig.policy.allowed_provider_ids.includes(providerId)) {
            errors.push({ code: 'provider_not_allowed', message: `Provider ${providerId} must be in allowed_provider_ids` });
            providerValid = false;
          }
        }

        const capCheck = validateProviderExecutionCapability(pConfig.capability);
        if (!capCheck.success) {
          errors.push({ code: 'invalid_capability', message: `Provider ${providerId} capability validation failed` });
          providerValid = false;
        } else {
          if (pConfig.capability.chat_completions !== true) {
            errors.push({ code: 'unusable_capability', message: `Provider ${providerId} must support chat_completions` });
            providerValid = false;
          }
          if (pConfig.capability.non_streaming !== true && pConfig.capability.sse_streaming !== true) {
            errors.push({ code: 'unusable_capability', message: `Provider ${providerId} must support non_streaming or sse_streaming` });
            providerValid = false;
          }
          if (enabled) {
            if (pConfig.capability.non_streaming === true && typeof config.transport?.execute !== 'function') {
              errors.push({ code: 'invalid_transport', message: `Provider ${providerId} requires non-streaming transport but transport.execute is not a function` });
              providerValid = false;
            }
            if (pConfig.capability.sse_streaming === true && typeof config.transport?.stream !== 'function') {
              errors.push({ code: 'invalid_transport', message: `Provider ${providerId} requires streaming transport but transport.stream is not a function` });
              providerValid = false;
            }
          }
        }

        const requiresCred = isString(pConfig.provider_adapter?.credential_env);
        if (requiresCred) {
          if (!pConfig.credential_ref) {
            errors.push({ code: 'missing_credential_ref', message: `Provider ${providerId} requires credential_ref` });
            providerValid = false;
          } else {
            const credCheck = validateCredentialRef(pConfig.credential_ref);
            if (!credCheck.success) {
              errors.push({ code: 'invalid_credential_ref', message: `Provider ${providerId} credential_ref validation failed` });
              providerValid = false;
            } else if (pConfig.credential_ref.env_var !== pConfig.provider_adapter.credential_env) {
              errors.push({ code: 'credential_ref_mismatch', message: `Provider ${providerId} credential_ref env_var must match adapter credential_env` });
              providerValid = false;
            }
          }
        } else {
          if (pConfig.credential_ref) {
            errors.push({ code: 'forbidden_credential_ref', message: `Provider ${providerId} does not accept credential_ref when credential_env is null` });
            providerValid = false;
          }
        }

        if (providerValid) {
          validatedProviders[providerId] = Object.freeze({
            provider_adapter: freezeAdapterFacade(pConfig.provider_adapter),
            endpoint: cloneStructural(pConfig.endpoint),
            policy: cloneStructural(pConfig.policy),
            capability: cloneStructural(pConfig.capability),
            credential_ref: pConfig.credential_ref ? cloneStructural(pConfig.credential_ref) : null,
          });
        }
      }
    }
  }

  const validatedRoutes = Object.create(null);
  const seenModels = new Set();

  if (config.model_routes !== undefined) {
    const routeEntries = Array.isArray(config.model_routes)
      ? config.model_routes.map((r) => [r?.model_key || r?.model_id, r])
      : isObject(config.model_routes)
      ? Object.entries(config.model_routes)
      : null;

    if (!routeEntries) {
      errors.push({ code: 'invalid_model_routes', message: 'model_routes must be an object or array' });
    } else {
      for (const [modelKey, rConfig] of routeEntries) {
        if (!isValidSafeKey(modelKey)) {
          errors.push({ code: 'invalid_model_key', message: `Invalid or reserved model route key: ${modelKey}` });
          continue;
        }
        if (seenModels.has(modelKey)) {
          errors.push({ code: 'duplicate_model_route', message: `Duplicate model route for ${modelKey}` });
          continue;
        }
        seenModels.add(modelKey);

        if (!isObject(rConfig) || !isString(rConfig.provider_id) || !isString(rConfig.model_id)) {
          errors.push({ code: 'invalid_model_route', message: `Model route ${modelKey} must contain provider_id and model_id` });
          continue;
        }

        if (!isValidSafeKey(rConfig.provider_id) || !isValidSafeKey(rConfig.model_id)) {
          errors.push({ code: 'invalid_model_route', message: `Model route ${modelKey} provider_id or model_id is invalid or reserved` });
          continue;
        }

        const targetProvider = validatedProviders[rConfig.provider_id];
        if (enabled && !targetProvider) {
          errors.push({ code: 'unconfigured_provider', message: `Model route ${modelKey} references unconfigured provider ${rConfig.provider_id}` });
          continue;
        }

        if (targetProvider) {
          const adapterModels = targetProvider.provider_adapter?.models || [];
          if (!adapterModels.includes(rConfig.model_id)) {
            errors.push({ code: 'unknown_model', message: `Model ${rConfig.model_id} not found in provider ${rConfig.provider_id} metadata models` });
          }
        }

        validatedRoutes[modelKey] = Object.freeze({
          provider_id: rConfig.provider_id,
          model_id: rConfig.model_id,
        });
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, enabled: false, errors };
  }

  return {
    success: true,
    enabled,
    providers: deepFreeze(validatedProviders),
    model_routes: deepFreeze(validatedRoutes),
    transport: config.transport,
    environment: config.environment || null,
    clock: config.clock || null,
  };
}

export function validateGovernedRuntimeConfig(config = {}) {
  const result = compileGovernedRuntimeConfig(config);
  return {
    success: result.success,
    enabled: result.enabled === true,
    errors: result.errors || [],
  };
}

export function createExecutionDispatcher(governedConfig = {}) {
  const compiled = compileGovernedRuntimeConfig(governedConfig);

  const privateProviders = compiled.providers;
  const privateRoutes = compiled.model_routes;
  const privateTransport = compiled.transport;
  const privateEnvironment = compiled.environment;
  const privateClock = compiled.clock;

  return Object.freeze({
    get success() {
      return compiled.success;
    },
    get errors() {
      return compiled.errors || [];
    },
    get enabled() {
      return compiled.enabled === true;
    },
    resolveRoute(requestedModel) {
      if (!requestedModel || typeof requestedModel !== 'string' || !isValidSafeKey(requestedModel)) {
        return Object.freeze({
          type: 'unknown',
          strategy: 'none',
          provider_id: null,
          requested_model: String(requestedModel || ''),
          resolved_model: null,
          enabled: compiled.enabled === true,
        });
      }

      if (privateRoutes && Object.prototype.hasOwnProperty.call(privateRoutes, requestedModel)) {
        const route = privateRoutes[requestedModel];
        if (!compiled.enabled) {
          return Object.freeze({
            type: 'disabled-external',
            strategy: 'governed-external',
            provider_id: route.provider_id,
            requested_model: requestedModel,
            resolved_model: route.model_id,
            enabled: false,
          });
        }
        return Object.freeze({
          type: 'governed-external',
          strategy: 'governed-external',
          provider_id: route.provider_id,
          requested_model: requestedModel,
          resolved_model: route.model_id,
          enabled: true,
        });
      }

      if (requestedModel.startsWith('mock') || requestedModel === 'gpt-3.5-turbo' || requestedModel === 'gpt-4') {
        return Object.freeze({
          type: 'mock',
          strategy: 'mock-local',
          provider_id: 'mock',
          requested_model: requestedModel,
          resolved_model: requestedModel,
          enabled: true,
        });
      }

      return Object.freeze({
        type: 'unknown',
        strategy: 'none',
        provider_id: null,
        requested_model: requestedModel,
        resolved_model: requestedModel,
        enabled: compiled.enabled === true,
      });
    },
    async executeRoute({ requested_model, gateway_request, request_id, signal, runtime_timeout_ms = null } = {}) {
      if (!compiled.enabled) {
        throw createRuntimeError({
          code: 'execution_disabled',
          message: `Governed execution is disabled for model ${requested_model}`,
          request_id,
          status: 403,
          cause: 'execution_disabled',
        });
      }

      if (!requested_model || !privateRoutes || !Object.prototype.hasOwnProperty.call(privateRoutes, requested_model)) {
        throw createRuntimeError({
          code: 'model_not_found',
          message: `Model not found: ${requested_model}`,
          request_id,
          status: 404,
          cause: 'unknown_model',
        });
      }

      const route = privateRoutes[requested_model];
      const providerConfig = privateProviders ? privateProviders[route.provider_id] : null;
      if (!providerConfig) {
        throw createRuntimeError({
          code: 'internal_error',
          message: `Provider ${route.provider_id} configuration missing`,
          request_id,
          status: 500,
          cause: 'target_missing',
        });
      }

      const gatewayPayload = {
        ...gateway_request,
        model: route.model_id,
      };

      const execReq = createExecutionRequest({
        request_id,
        provider_id: route.provider_id,
        model_id: route.model_id,
        gateway_request: gatewayPayload,
        policy: providerConfig.policy,
        endpoint: providerConfig.endpoint,
        capability: providerConfig.capability,
        credential_ref: providerConfig.credential_ref,
      });

      return executeGovernedRequest({
        execution_request: execReq,
        provider_adapter: providerConfig.provider_adapter,
        transport: privateTransport,
        environment: privateEnvironment,
        clock: privateClock,
        requestId: request_id,
        signal,
        runtime_timeout_ms,
      });
    },
    async executeStreamRoute({ requested_model, gateway_request, request_id, signal, runtime_timeout_ms = null, idle_timeout_ms = null } = {}) {
      if (!compiled.enabled) {
        return {
          success: false,
          error: createExecutionError({
            contract_version: EXECUTION_CONTRACT_VERSION,
            code: 'execution_disabled',
            category: 'policy_denied',
            message: `Governed execution is disabled for model ${requested_model}`,
            status: 403,
            provider_id: null,
            request_id: request_id || null,
            redacted: true,
          }),
        };
      }

      if (!requested_model || !privateRoutes || !Object.prototype.hasOwnProperty.call(privateRoutes, requested_model)) {
        return {
          success: false,
          error: createExecutionError({
            contract_version: EXECUTION_CONTRACT_VERSION,
            code: 'model_not_found',
            category: 'request_invalid',
            message: `Model not found: ${requested_model}`,
            status: 404,
            provider_id: null,
            request_id: request_id || null,
            redacted: true,
          }),
        };
      }

      const route = privateRoutes[requested_model];
      const providerConfig = privateProviders ? privateProviders[route.provider_id] : null;
      if (!providerConfig) {
        return {
          success: false,
          error: createExecutionError({
            contract_version: EXECUTION_CONTRACT_VERSION,
            code: 'internal_execution_error',
            category: 'internal_execution_error',
            message: `Provider ${route.provider_id} configuration missing`,
            status: 500,
            provider_id: route.provider_id,
            request_id: request_id || null,
            redacted: true,
          }),
        };
      }

      const gatewayPayload = {
        ...gateway_request,
        model: route.model_id,
      };

      const execReq = createExecutionRequest({
        request_id,
        provider_id: route.provider_id,
        model_id: route.model_id,
        gateway_request: gatewayPayload,
        policy: providerConfig.policy,
        endpoint: providerConfig.endpoint,
        capability: providerConfig.capability,
        credential_ref: providerConfig.credential_ref,
      });

      return executeGovernedStream({
        execution_request: execReq,
        provider_adapter: providerConfig.provider_adapter,
        transport: privateTransport,
        environment: privateEnvironment,
        clock: privateClock,
        requestId: request_id,
        signal,
        runtime_timeout_ms,
        idle_timeout_ms,
      });
    },
    listExternalModels() {
      if (!compiled.enabled || !privateRoutes || !privateProviders) {
        return [];
      }
      const models = [];
      for (const [modelKey, route] of Object.entries(privateRoutes)) {
        const providerConfig = privateProviders[route.provider_id];
        if (providerConfig && providerConfig.policy?.enabled === true) {
          models.push(Object.freeze({
            id: modelKey,
            object: 'model',
            created: 1800000000,
            owned_by: providerConfig.provider_adapter.id,
          }));
        }
      }
      return Object.freeze(models);
    },
  });
}
