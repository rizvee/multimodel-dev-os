import { validateProviderAdapter } from '../contracts/provider-adapter.js';
import { validateProviderEndpoint } from '../contracts/provider-endpoint.js';
import { validateExecutionPolicy } from '../contracts/execution-policy.js';
import { validateProviderExecutionCapability } from '../contracts/provider-execution-capability.js';
import { validateCredentialRef } from '../contracts/credential-ref.js';
import { validateTransport } from '../execution/transport-contract.js';
import { validateEndpointBinding } from '../execution/execution-gate.js';

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isString(val) {
  return typeof val === 'string' && val.length > 0;
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

  const validatedProviders = {};
  if (config.providers !== undefined) {
    if (!isObject(config.providers)) {
      errors.push({ code: 'invalid_providers', message: 'providers mapping must be an object' });
    } else {
      for (const [providerId, pConfig] of Object.entries(config.providers)) {
        if (!isObject(pConfig)) {
          errors.push({ code: 'invalid_provider_config', message: `Provider ${providerId} config must be an object` });
          continue;
        }
        const adapterCheck = validateProviderAdapter(pConfig.provider_adapter);
        if (!adapterCheck.success) {
          errors.push({ code: 'invalid_adapter', message: `Provider ${providerId} adapter validation failed` });
        } else if (pConfig.provider_adapter.type !== 'openai-compatible') {
          errors.push({ code: 'invalid_adapter_type', message: `Provider ${providerId} adapter type must be openai-compatible` });
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
        }

        const capCheck = validateProviderExecutionCapability(pConfig.capability);
        if (!capCheck.success) {
          errors.push({ code: 'invalid_capability', message: `Provider ${providerId} capability validation failed` });
        }

        if (pConfig.credential_ref) {
          const credCheck = validateCredentialRef(pConfig.credential_ref);
          if (!credCheck.success) {
            errors.push({ code: 'invalid_credential_ref', message: `Provider ${providerId} credential_ref validation failed` });
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

  const validatedRoutes = {};
  const seenModels = new Set();

  if (config.model_routes !== undefined) {
    if (Array.isArray(config.model_routes)) {
      for (const route of config.model_routes) {
        if (!isObject(route) || !isString(route.model_key || route.model_id)) {
          errors.push({ code: 'invalid_model_route', message: 'Model route entry must be an object with model_id' });
          continue;
        }
        const key = route.model_key || route.model_id;
        if (seenModels.has(key)) {
          errors.push({ code: 'duplicate_model_route', message: `Duplicate model route for ${key}` });
          continue;
        }
        seenModels.add(key);

        if (!isString(route.provider_id) || !isString(route.model_id)) {
          errors.push({ code: 'invalid_model_route', message: `Model route ${key} must contain provider_id and model_id` });
          continue;
        }

        const targetProvider = validatedProviders[route.provider_id];
        if (enabled && !targetProvider) {
          errors.push({ code: 'unconfigured_provider', message: `Model route ${key} references unconfigured provider ${route.provider_id}` });
          continue;
        }

        if (targetProvider) {
          const adapterModels = targetProvider.provider_adapter?.models || [];
          if (!adapterModels.includes(route.model_id)) {
            errors.push({ code: 'unknown_model', message: `Model ${route.model_id} not found in provider ${route.provider_id} metadata models` });
          }
        }

        validatedRoutes[key] = {
          provider_id: route.provider_id,
          model_id: route.model_id,
        };
      }
    } else if (isObject(config.model_routes)) {
      for (const [modelKey, rConfig] of Object.entries(config.model_routes)) {
        if (seenModels.has(modelKey)) {
          errors.push({ code: 'duplicate_model_route', message: `Duplicate model route for ${modelKey}` });
          continue;
        }
        seenModels.add(modelKey);

        if (!isObject(rConfig) || !isString(rConfig.provider_id) || !isString(rConfig.model_id)) {
          errors.push({ code: 'invalid_model_route', message: `Model route ${modelKey} must contain provider_id and model_id` });
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
    } else {
      errors.push({ code: 'invalid_model_routes', message: 'model_routes must be an object or array' });
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
      if (!requestedModel || typeof requestedModel !== 'string') {
        return { type: 'unknown', route: null };
      }

      if (validation.model_routes && validation.model_routes[requestedModel]) {
        const route = validation.model_routes[requestedModel];
        if (!validation.enabled) {
          return { type: 'disabled-external', provider_id: route.provider_id, model_id: route.model_id };
        }
        const providerConfig = validation.providers[route.provider_id];
        return {
          type: 'governed-external',
          provider_id: route.provider_id,
          model_id: route.model_id,
          provider_adapter: providerConfig.provider_adapter,
          endpoint: providerConfig.endpoint,
          policy: providerConfig.policy,
          capability: providerConfig.capability,
          credential_ref: providerConfig.credential_ref,
          transport: validation.transport,
          environment: validation.environment,
          clock: validation.clock,
        };
      }

      if (requestedModel.startsWith('mock') || requestedModel === 'gpt-3.5-turbo' || requestedModel === 'gpt-4') {
        return { type: 'mock', provider_id: 'mock', model_id: requestedModel };
      }

      return { type: 'unknown', route: null };
    },
    listExternalModels() {
      if (!validation.enabled || !validation.model_routes || !validation.providers) {
        return [];
      }
      const models = [];
      for (const [modelKey, route] of Object.entries(validation.model_routes)) {
        const providerConfig = validation.providers[route.provider_id];
        models.push({
          id: modelKey,
          object: 'model',
          created: 1800000000,
          owned_by: providerConfig ? providerConfig.provider_adapter.id : 'external',
        });
      }
      return models;
    },
  };
}
