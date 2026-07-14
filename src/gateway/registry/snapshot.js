import { addError, createDiagnostics, createRegistryResult } from './errors.js';
import { loadGatewayRegistrySources } from './loader.js';
import {
  normalizeLocalModels,
  normalizeModels,
  normalizeProviders,
  normalizeRoutingPresets,
} from './normalization.js';
import {
  RUNTIME_SCHEMA_VERSION,
  isObject,
  stableClone,
  validateNoSecrets,
} from './validation.js';

function indexBy(records, field) {
  const output = {};
  for (const record of records) {
    output[record[field]] = record;
  }
  return output;
}

function buildIndexes({ providers, models, localModels, routingPresets }) {
  const providersById = indexBy(providers, 'id');
  const modelsById = indexBy(models, 'id');
  const modelsByAlias = {};
  const modelsByProvider = {};
  const localModelsById = indexBy(localModels, 'id');
  const routingPresetsById = indexBy(routingPresets, 'id');

  for (const model of models) {
    if (model.provider_id) {
      modelsByProvider[model.provider_id] ||= [];
      modelsByProvider[model.provider_id].push(model.id);
    }
    for (const alias of model.aliases) {
      modelsByAlias[alias] = model.id;
    }
  }
  for (const providerId of Object.keys(modelsByProvider)) {
    modelsByProvider[providerId].sort();
  }

  return {
    providersById,
    modelsById,
    modelsByAlias,
    modelsByProvider,
    localModelsById,
    routingPresetsById,
  };
}

function mergeDiagnostics(target, source) {
  target.errors.push(...source.errors);
  target.warnings.push(...source.warnings);
}

function validateUnique(records, key, diagnostics, code, label) {
  const seen = new Set();
  for (const record of records) {
    const value = record[key];
    if (seen.has(value)) {
      addError(diagnostics, code, `${label}.${value}`, `Duplicate ${label} id: ${value}`);
    }
    seen.add(value);
  }
}

function validateCrossReferences(snapshot, diagnostics) {
  const { providers, models, local_models: localModels, routing_presets: routingPresets, indexes } = snapshot;
  validateUnique(providers, 'id', diagnostics, 'duplicate_provider', 'providers');
  validateUnique(models, 'id', diagnostics, 'duplicate_model', 'models');
  validateUnique(localModels, 'id', diagnostics, 'duplicate_local_model', 'local_models');
  validateUnique(routingPresets, 'id', diagnostics, 'duplicate_routing_preset', 'routing_presets');

  const aliasOwner = {};
  for (const model of models) {
    if (!model.local && !indexes.providersById[model.provider_id]) {
      addError(diagnostics, 'unknown_provider', `models.${model.id}.provider_id`, `Model ${model.id} references unknown provider: ${model.provider_id}`);
    }
    for (const alias of model.aliases) {
      if (aliasOwner[alias] && aliasOwner[alias] !== model.id) {
        addError(diagnostics, 'duplicate_alias', `models.${model.id}.aliases`, `Model alias is not unique: ${alias}`);
      }
      aliasOwner[alias] = model.id;
    }
  }

  for (const localModel of localModels) {
    if (!localModel.id || !localModel.engine || !localModel.endpoint) {
      addError(diagnostics, 'invalid_local_model', `local_models.${localModel.id || 'unknown'}`, 'Local model records must include id, engine, and endpoint');
    }
  }

  for (const preset of routingPresets) {
    for (const providerId of preset.provider_ids) {
      if (!indexes.providersById[providerId]) {
        addError(diagnostics, 'unknown_provider', `routing_presets.${preset.id}.provider_ids`, `Routing preset ${preset.id} references unknown provider: ${providerId}`);
      }
    }
    for (const modelId of preset.model_ids) {
      if (!indexes.modelsById[modelId] && !indexes.modelsByAlias[modelId]) {
        addError(diagnostics, 'unknown_model', `routing_presets.${preset.id}.model_ids`, `Routing preset ${preset.id} references unknown model: ${modelId}`);
      }
    }
  }

  validateNoSecrets(snapshot.providers, diagnostics, 'providers');
  validateNoSecrets(snapshot.models, diagnostics, 'models');
  validateNoSecrets(snapshot.local_models, diagnostics, 'local_models');
  validateNoSecrets(snapshot.routing_presets, diagnostics, 'routing_presets');
}

function freezeSnapshot(snapshot) {
  return Object.freeze(stableClone(snapshot));
}

export function buildGatewayRegistrySnapshot({ rootDir = process.cwd(), files = {}, strict = true } = {}) {
  const diagnostics = createDiagnostics();
  const sourceResult = loadGatewayRegistrySources({ rootDir, files });
  mergeDiagnostics(diagnostics, sourceResult.diagnostics);
  const sources = sourceResult.value || {};

  const providers = normalizeProviders(sources.providersSource || {}, diagnostics, sources.duplicateKeys?.providers || []);
  const models = normalizeModels(sources.modelsSource || {}, diagnostics, sources.duplicateKeys?.models || []);
  const modelsByIdForPresets = indexBy(models, 'id');
  const localModels = normalizeLocalModels(sources.localModelsSource || {}, diagnostics);
  const routingPresets = normalizeRoutingPresets(
    sources.routingPresetsSource || {},
    diagnostics,
    sources.duplicateKeys?.routingPresets || [],
    modelsByIdForPresets,
  );

  const snapshot = {
    schema_version: RUNTIME_SCHEMA_VERSION,
    providers,
    models,
    local_models: localModels,
    routing_presets: routingPresets,
    indexes: buildIndexes({
      providers,
      models,
      localModels,
      routingPresets,
    }),
    diagnostics,
    source_files: sources.sourceFiles || {},
  };

  validateCrossReferences(snapshot, diagnostics);

  if (!strict && diagnostics.errors.length > 0) {
    snapshot.diagnostics = diagnostics;
  }

  return createRegistryResult(freezeSnapshot(snapshot), diagnostics);
}

export function isGatewayRegistrySnapshot(value) {
  return isObject(value)
    && value.schema_version === RUNTIME_SCHEMA_VERSION
    && Array.isArray(value.providers)
    && Array.isArray(value.models)
    && Array.isArray(value.local_models)
    && Array.isArray(value.routing_presets)
    && isObject(value.indexes);
}
