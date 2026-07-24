import { validateProviderAdapter } from '../contracts/provider-adapter.js';
import { validateProviderEndpoint } from '../contracts/provider-endpoint.js';
import { validateExecutionPolicy } from '../contracts/execution-policy.js';
import { validateProviderExecutionCapability } from '../contracts/provider-execution-capability.js';
import { validateCredentialRef } from '../contracts/credential-ref.js';
import { validateTransport } from '../execution/transport-contract.js';
import { validateEndpointBinding } from '../execution/execution-gate.js';

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

export function validateGovernedRuntimeConfig(config = {}) {
  const errors = [];
  if (!isObject(config)) {
    return { success: false, errors: [{ code: 'invalid_config', message: 'governed_execution must be an object' }] };
  }

  const enabled = config.enabled === true;

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
          continue;
        }
        if (pConfig.provider_adapter.type !== 'openai-compatible') {
          errors.push({ code: 'invalid_adapter_type', message: `Provider ${providerId} adapter type must be openai-compatible` });
        }
        if (providerId !== pConfig.provider_adapter.id) {
          errors.push({ code: 'provider_id_mismatch', message: `Provider key (${providerId}) must match provider_adapter.id (${pConfig.provider_adapter.id})` });
        }

        const endpointCheck = validateProviderEndpoint(pConfig.endpoint);
        if (!endpointCheck.success) {
          errors.push({ code: 'invalid_endpoint', message: `Provider ${providerId} endpoint validation failed` });
        }

        if (pConfig.provider_adapter && pConfig.endpoint) {
          const bindingCheck = validateEndpointBinding({
            endpoint: pConfig.endpoint,
            base_url: pConfig.provider_adapter.base_url,
          });
          if (!bindingCheck.success) {
            errors.push({ code: 'invalid_endpoint_binding', message: `Provider ${providerId} endpoint binding failed: ${bindingCheck.reason}` });
          }
        }

        const policyCheck = validateExecutionPolicy(pConfig.policy);
        if (!policyCheck.success) {
          errors.push({ code: 'invalid_policy', message: `Provider ${providerId} policy validation failed` });
        } else {
          if (pConfig.policy.enabled !== true) {
            errors.push({ code: 'provider_not_enabled', message: `Provider ${providerId} policy enabled must be true` });
          }
          if (!Array.isArray(pConfig.policy.allowed_provider_ids) || !pConfig.policy.allowed_provider_ids.includes(providerId)) {
            errors.push({ code: 'provider_not_allowed', message: `Provider ${providerId} must be in allowed_provider_ids` });
          }
        }

        const capCheck = validateProviderExecutionCapability(pConfig.capability);
        if (!capCheck.success) {
          errors.push({ code: 'invalid_capability', message: `Provider ${providerId} capability validation failed` });
        } else {
          if (pConfig.capability.chat_completions !== true) {
            errors.push({ code: 'unusable_capability', message: `Provider ${providerId} must support chat_completions` });
          }
          if (pConfig.capability.non_streaming !== true && pConfig.capability.sse_streaming !== true) {
            errors.push({ code: 'unusable_capability', message: `Provider ${providerId} must support non_streaming or sse_streaming` });
          }
        }

        if (pConfig.credential_ref) {
          const credCheck = validateCredentialRef(pConfig.credential_ref);
          if (!credCheck.success) {
            errors.push({ code: 'invalid_credential_ref', message: `Provider ${providerId} credential_ref validation failed` });
          } else if (pConfig.credential_ref.env_var !== pConfig.provider_adapter.credential_env) {
            errors.push({ code: 'credential_ref_mismatch', message: `Provider ${providerId} credential_ref env_var (${pConfig.credential_ref.env_var}) must match adapter credential_env (${pConfig.provider_adapter.credential_env})` });
          }
        }

        validatedProviders[providerId] = {
          provider_adapter: pConfig.provider_adapter,
          endpoint: pConfig.endpoint,
          policy: pConfig.policy,
          capability: pConfig.capability,
          credential_ref: pConfig.credential_ref || null,
        };
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

        validatedRoutes[modelKey] = {
          provider_id: rConfig.provider_id,
          model_id: rConfig.model_id,
        };
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    enabled,
    providers: validatedProviders,
    model_routes: validatedRoutes,
    transport: config.transport,
    environment: config.environment || null,
    clock: config.clock || null,
  };
}

export function createExecutionDispatcher(governedConfig = {}) {
  const validation = validateGovernedRuntimeConfig(governedConfig);

  return {
    get success() {
      return validation.success;
    },
    get errors() {
      return validation.errors || [];
    },
    get enabled() {
      return validation.enabled === true;
    },
    resolveRoute(requestedModel) {
      if (!requestedModel || typeof requestedModel !== 'string' || !isValidSafeKey(requestedModel)) {
        return Object.freeze({
          type: 'unknown',
          strategy: 'none',
          provider_id: null,
          requested_model: String(requestedModel || ''),
          resolved_model: null,
          enabled: validation.enabled === true,
        });
      }

      if (validation.model_routes && Object.prototype.hasOwnProperty.call(validation.model_routes, requestedModel)) {
        const route = validation.model_routes[requestedModel];
        if (!validation.enabled) {
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
        resolved_model: null,
        enabled: validation.enabled === true,
      });
    },
    getExecutionTarget(requestedModel) {
      if (!validation.enabled || !validation.model_routes || !Object.prototype.hasOwnProperty.call(validation.model_routes, requestedModel)) {
        return null;
      }
      const route = validation.model_routes[requestedModel];
      const providerConfig = validation.providers ? validation.providers[route.provider_id] : null;
      if (!providerConfig) return null;

      return {
        provider_id: route.provider_id,
        requested_model: requestedModel,
        resolved_model: route.model_id,
        provider_adapter: providerConfig.provider_adapter,
        endpoint: providerConfig.endpoint,
        policy: providerConfig.policy,
        capability: providerConfig.capability,
        credential_ref: providerConfig.credential_ref,
        transport: validation.transport,
        environment: validation.environment,
        clock: validation.clock,
      };
    },
    listExternalModels() {
      if (!validation.enabled || !validation.model_routes || !validation.providers) {
        return [];
      }
      const models = [];
      for (const [modelKey, route] of Object.entries(validation.model_routes)) {
        const providerConfig = validation.providers[route.provider_id];
        if (providerConfig && providerConfig.policy?.enabled === true) {
          models.push({
            id: modelKey,
            object: 'model',
            created: 1800000000,
            owned_by: providerConfig.provider_adapter.id,
          });
        }
      }
      return models;
    },
  };
}
