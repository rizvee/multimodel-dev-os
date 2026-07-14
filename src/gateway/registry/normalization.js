import { addError } from './errors.js';
import {
  isCredentialEnvName,
  isObject,
  isSafeAlias,
  isSlug,
  normalizeCapabilities,
  normalizeInteger,
  normalizeNullableNumber,
  normalizeProviderType,
  normalizeStringArray,
  ROUTING_PRESET_STRATEGIES,
  sortedEntries,
  stableClone,
  validateLocalEndpoint,
  validateNoSecrets,
  validateProviderUrl,
} from './validation.js';

function normalizeStatus(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : 'available';
}

function normalizeEnabled(value) {
  return value === undefined ? true : value !== false;
}

function safeMetadata(source, omitKeys) {
  const metadata = {};
  for (const key of Object.keys(source || {}).sort()) {
    if (!omitKeys.includes(key)) {
      metadata[key] = stableClone(source[key]);
    }
  }
  return metadata;
}

export function normalizeProviders(providersSource, diagnostics, duplicateIds = []) {
  const providers = [];
  const rawProviders = providersSource.providers || {};

  for (const duplicateId of duplicateIds) {
    addError(diagnostics, 'duplicate_provider', `providers.${duplicateId}`, `Duplicate provider id: ${duplicateId}`);
  }

  for (const [id, source] of sortedEntries(rawProviders)) {
    if (!isSlug(id)) {
      addError(diagnostics, 'invalid_provider_id', `providers.${id}`, `Provider id must be a stable slug: ${id}`);
    }
    if (!isObject(source)) {
      addError(diagnostics, 'invalid_provider', `providers.${id}`, `Provider ${id} must be an object`);
      continue;
    }

    const local = source.local === true || id === 'local' || source.type === 'local';
    const type = normalizeProviderType(source.type, local);
    const baseUrl = validateProviderUrl(source.base_url || source.api_endpoint || null, {
      local,
      path: `providers.${id}.base_url`,
      diagnostics,
    });
    const credentialEnv = source.credential_env ?? source.env_key ?? null;
    if (!isCredentialEnvName(credentialEnv)) {
      addError(diagnostics, 'invalid_credential_env', `providers.${id}.credential_env`, `Provider ${id} credential_env must be an environment variable name`);
    }

    const record = {
      id,
      name: source.name || id,
      type,
      enabled: normalizeEnabled(source.enabled),
      base_url: baseUrl,
      credential_env: credentialEnv || null,
      capabilities: normalizeCapabilities(source.capabilities || [], diagnostics, `providers.${id}.capabilities`),
      model_ids: normalizeStringArray(source.model_ids),
      local,
      status: normalizeStatus(source.status),
      priority: normalizeInteger(source.priority ?? null, diagnostics, `providers.${id}.priority`) ?? null,
      metadata: safeMetadata(source, [
        'name',
        'type',
        'enabled',
        'base_url',
        'api_endpoint',
        'credential_env',
        'env_key',
        'capabilities',
        'model_ids',
        'local',
        'status',
        'priority',
      ]),
    };
    validateNoSecrets(record.metadata, diagnostics, `providers.${id}.metadata`);
    providers.push(record);
  }

  return providers.sort((a, b) => a.id.localeCompare(b.id));
}

export function normalizeModels(modelsSource, diagnostics, duplicateIds = []) {
  const models = [];
  const rawModels = modelsSource.models || {};

  for (const duplicateId of duplicateIds) {
    addError(diagnostics, 'duplicate_model', `models.${duplicateId}`, `Duplicate model id: ${duplicateId}`);
  }

  for (const [id, source] of sortedEntries(rawModels)) {
    if (!isSafeAlias(id)) {
      addError(diagnostics, 'invalid_model_id', `models.${id}`, `Model id must be stable and alias-safe: ${id}`);
    }
    if (!isObject(source)) {
      addError(diagnostics, 'invalid_model', `models.${id}`, `Model ${id} must be an object`);
      continue;
    }
    const aliases = normalizeStringArray(source.aliases);
    if (source.alias) aliases.push(source.alias);
    const uniqueAliases = [...new Set(aliases.filter(Boolean))].sort();
    for (const alias of uniqueAliases) {
      if (!isSafeAlias(alias)) {
        addError(diagnostics, 'invalid_alias', `models.${id}.aliases`, `Model alias is not safe: ${alias}`);
      }
    }

    const inputCost = normalizeNullableNumber(source.input_cost ?? source.pricing?.input ?? null, diagnostics, `models.${id}.input_cost`);
    const outputCost = normalizeNullableNumber(source.output_cost ?? source.pricing?.output ?? null, diagnostics, `models.${id}.output_cost`);
    const record = {
      id,
      provider_id: source.provider || source.provider_id || null,
      name: source.name || source.alias || id,
      aliases: uniqueAliases,
      capabilities: normalizeCapabilities(source.capabilities || [], diagnostics, `models.${id}.capabilities`),
      context_window: normalizeInteger(source.context_window, diagnostics, `models.${id}.context_window`),
      max_output_tokens: normalizeInteger(source.max_output_tokens ?? null, diagnostics, `models.${id}.max_output_tokens`),
      input_cost: inputCost,
      output_cost: outputCost,
      currency: source.currency || source.pricing?.currency || null,
      local: source.local === true,
      enabled: normalizeEnabled(source.enabled),
      status: normalizeStatus(source.status),
      metadata: safeMetadata(source, [
        'provider',
        'provider_id',
        'name',
        'alias',
        'aliases',
        'capabilities',
        'context_window',
        'max_output_tokens',
        'input_cost',
        'output_cost',
        'currency',
        'pricing',
        'local',
        'enabled',
        'status',
      ]),
    };
    validateNoSecrets(record.metadata, diagnostics, `models.${id}.metadata`);
    models.push(record);
  }

  return models.sort((a, b) => a.id.localeCompare(b.id));
}

export function normalizeLocalModels(localModelsSource, diagnostics) {
  const records = [];
  const engines = localModelsSource.local_engines || {};

  for (const [engine, source] of sortedEntries(engines)) {
    if (!isSlug(engine)) {
      addError(diagnostics, 'invalid_local_engine', `local_engines.${engine}`, `Local engine id must be a stable slug: ${engine}`);
    }
    if (!isObject(source)) {
      addError(diagnostics, 'invalid_local_engine', `local_engines.${engine}`, `Local engine ${engine} must be an object`);
      continue;
    }
    const endpoint = validateLocalEndpoint(source.endpoint || source.host || null, diagnostics, `local_engines.${engine}.endpoint`);
    const models = Array.isArray(source.models) ? source.models : [];
    for (const [index, modelSource] of models.entries()) {
      if (!isObject(modelSource)) {
        addError(diagnostics, 'invalid_local_model', `local_engines.${engine}.models[${index}]`, 'Local model entry must be an object');
        continue;
      }
      const alias = modelSource.id || modelSource.alias || `${engine}-${index}`;
      const id = `${engine}:${alias}`;
      if (!isSafeAlias(alias)) {
        addError(diagnostics, 'invalid_local_model_id', `local_engines.${engine}.models[${index}].alias`, `Local model alias is not safe: ${alias}`);
      }
      const record = {
        id,
        name: modelSource.name || alias,
        engine,
        endpoint,
        model: modelSource.model || modelSource.official_id || alias,
        capabilities: normalizeCapabilities(modelSource.capabilities || ['local'], diagnostics, `local_engines.${engine}.models[${index}].capabilities`),
        context_window: normalizeInteger(modelSource.context_window, diagnostics, `local_engines.${engine}.models[${index}].context_window`),
        enabled: normalizeEnabled(modelSource.enabled),
        status: normalizeStatus(modelSource.status || 'metadata-only'),
        metadata: safeMetadata(modelSource, [
          'id',
          'alias',
          'name',
          'model',
          'official_id',
          'capabilities',
          'context_window',
          'enabled',
          'status',
        ]),
      };
      validateNoSecrets(record.metadata, diagnostics, `local_engines.${engine}.models[${index}].metadata`);
      records.push(record);
    }
  }

  return records.sort((a, b) => a.id.localeCompare(b.id));
}

function normalizePresetStrategy(source) {
  if (source.strategy && ROUTING_PRESET_STRATEGIES.includes(source.strategy)) return source.strategy;
  if (source.local_first === true) return 'local-first';
  if (source.fallback || source.fallback_chain) return 'fallback-chain';
  return 'explicit';
}

export function normalizeRoutingPresets(presetsSource, diagnostics, duplicateIds = [], modelsById = {}) {
  const records = [];
  const rawPresets = presetsSource.presets || {};

  for (const duplicateId of duplicateIds) {
    addError(diagnostics, 'duplicate_routing_preset', `presets.${duplicateId}`, `Duplicate routing preset id: ${duplicateId}`);
  }

  for (const [id, source] of sortedEntries(rawPresets)) {
    if (!isSlug(id)) {
      addError(diagnostics, 'invalid_routing_preset_id', `presets.${id}`, `Routing preset id must be a stable slug: ${id}`);
    }
    if (!isObject(source)) {
      addError(diagnostics, 'invalid_routing_preset', `presets.${id}`, `Routing preset ${id} must be an object`);
      continue;
    }
    const explicitModelIds = [
      ...normalizeStringArray(source.model_ids),
      ...normalizeStringArray(source.models),
      ...normalizeStringArray(source.primary),
      ...normalizeStringArray(source.fallback),
      ...normalizeStringArray(source.cost_saving),
    ];
    const modelIds = [...new Set(explicitModelIds)].filter(Boolean).sort();
    const providerIds = [...new Set([
      ...normalizeStringArray(source.provider_ids),
      ...modelIds.map((modelId) => modelsById[modelId]?.provider_id).filter(Boolean),
    ])].sort();
    const strategy = normalizePresetStrategy(source);
    if (!ROUTING_PRESET_STRATEGIES.includes(strategy)) {
      addError(diagnostics, 'invalid_strategy', `presets.${id}.strategy`, `Unknown routing preset strategy: ${strategy}`);
    }
    const record = {
      id,
      name: source.name || id,
      strategy,
      provider_ids: providerIds,
      model_ids: modelIds,
      required_capabilities: normalizeCapabilities(source.required_capabilities || [], diagnostics, `presets.${id}.required_capabilities`),
      preferred_capabilities: normalizeCapabilities(source.preferred_capabilities || [], diagnostics, `presets.${id}.preferred_capabilities`),
      fallback_allowed: source.fallback_allowed ?? Boolean(source.fallback || source.fallback_chain),
      local_first: source.local_first === true,
      cost_preference: source.cost_preference || (source.cost_saving ? 'low' : 'none'),
      latency_preference: source.latency_preference || 'none',
      metadata: safeMetadata(source, [
        'id',
        'name',
        'strategy',
        'provider_ids',
        'model_ids',
        'models',
        'primary',
        'fallback',
        'cost_saving',
        'required_capabilities',
        'preferred_capabilities',
        'fallback_allowed',
        'fallback_chain',
        'local_first',
        'cost_preference',
        'latency_preference',
      ]),
    };
    validateNoSecrets(record.metadata, diagnostics, `presets.${id}.metadata`);
    records.push(record);
  }

  return records.sort((a, b) => a.id.localeCompare(b.id));
}
