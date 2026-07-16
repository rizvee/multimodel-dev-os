import { ROUTING_PRESET_STRATEGIES } from '../registry/validation.js';

export const ROUTER_STRATEGIES = Object.freeze([
  'explicit',
  'capability',
  'cost-first',
  'latency-first',
  'context-aware',
  'local-first',
  'fallback-chain',
  'balanced',
  'user-policy',
]);

export const DECISION_STRATEGY_BY_ROUTER_STRATEGY = Object.freeze({
  explicit: 'explicit',
  capability: 'capability-based',
  'cost-first': 'cost-first',
  'latency-first': 'latency-first',
  'context-aware': 'context-window-aware',
  'local-first': 'privacy-local-first',
  'fallback-chain': 'fallback-chain',
  balanced: 'balanced',
  'user-policy': 'user-policy',
});

const DEFAULT_WEIGHTS = Object.freeze({
  capability: 30,
  preferred_capability: 20,
  priority: 10,
  cost: 15,
  latency: 10,
  context: 10,
  local: 10,
  explicit: 20,
  status: 5,
});

export const DEFAULT_ROUTING_POLICY = Object.freeze({
  strategy: 'balanced',
  required_capabilities: [],
  preferred_capabilities: [],
  local_required: false,
  local_preferred: false,
  fallback_allowed: true,
  max_fallbacks: 3,
  allow_disabled: false,
  allowed_statuses: ['available', 'metadata-only'],
  unknown_metric_policy: 'penalize',
  weights: DEFAULT_WEIGHTS,
  tie_breakers: [
    'score',
    'warnings',
    'local_preferred',
    'known_cost',
    'known_latency',
    'priority',
    'provider_id',
    'model_id',
  ],
  provider_diverse_fallbacks: true,
  metadata: {},
});

function uniqueStrings(...values) {
  return [...new Set(values.flat().filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))].sort();
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeInteger(value, fallback, { min = 0, max = 20 } = {}) {
  if (!Number.isInteger(value) || value < min) return fallback;
  return Math.min(value, max);
}

function normalizeStrategy(value, fallback = 'balanced') {
  if (value === 'capability-based') return 'capability';
  if (value === 'context-window-aware') return 'context-aware';
  if (value === 'privacy-local-first') return 'local-first';
  if (ROUTER_STRATEGIES.includes(value)) return value;
  if (ROUTING_PRESET_STRATEGIES.includes(value)) return value;
  return fallback;
}

function normalizeWeights(value = {}) {
  const weights = { ...DEFAULT_WEIGHTS };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return weights;
  for (const [key, entry] of Object.entries(value)) {
    if (Object.prototype.hasOwnProperty.call(weights, key) && Number.isFinite(entry) && entry >= 0) {
      weights[key] = Math.round(entry);
    }
  }
  return weights;
}

export function getRoutingPreset(snapshot, presetId) {
  if (!presetId) return null;
  return snapshot?.indexes?.routingPresetsById?.[presetId] || null;
}

export function normalizeRoutingPolicy({ request = {}, policy = {}, preset = null } = {}) {
  const presetStrategy = preset?.strategy || null;
  const explicitSelection = Boolean(request.requested_provider || request.requested_model);
  const requestedPrivacy = request.privacy_policy || 'standard';
  const requestedFallback = typeof request.fallback_allowed === 'boolean' ? request.fallback_allowed : undefined;
  const strategy = normalizeStrategy(
    policy.strategy || request.strategy || (explicitSelection ? 'explicit' : null) || presetStrategy || DEFAULT_ROUTING_POLICY.strategy,
  );

  return {
    ...DEFAULT_ROUTING_POLICY,
    strategy,
    required_capabilities: uniqueStrings(
      preset?.required_capabilities || [],
      request.required_capabilities || [],
      policy.required_capabilities || [],
    ),
    preferred_capabilities: uniqueStrings(
      preset?.preferred_capabilities || [],
      request.preferred_capabilities || [],
      policy.preferred_capabilities || [],
    ),
    local_required: normalizeBoolean(
      policy.local_required,
      requestedPrivacy === 'local-only',
    ),
    local_preferred: normalizeBoolean(
      policy.local_preferred,
      requestedPrivacy === 'local-first' || preset?.local_first === true || strategy === 'local-first',
    ),
    fallback_allowed: normalizeBoolean(
      policy.fallback_allowed,
      requestedFallback ?? preset?.fallback_allowed ?? DEFAULT_ROUTING_POLICY.fallback_allowed,
    ),
    max_fallbacks: normalizeInteger(policy.max_fallbacks, DEFAULT_ROUTING_POLICY.max_fallbacks, { min: 0, max: 10 }),
    allow_disabled: normalizeBoolean(policy.allow_disabled, DEFAULT_ROUTING_POLICY.allow_disabled),
    allowed_statuses: uniqueStrings(policy.allowed_statuses || DEFAULT_ROUTING_POLICY.allowed_statuses),
    unknown_metric_policy: policy.unknown_metric_policy === 'neutral' ? 'neutral' : 'penalize',
    weights: normalizeWeights(policy.weights),
    excluded_providers: uniqueStrings(preset?.provider_exclusions || [], request.excluded_providers || [], policy.excluded_providers || []),
    excluded_models: uniqueStrings(preset?.model_exclusions || [], request.excluded_models || [], policy.excluded_models || []),
    provider_ids: uniqueStrings(preset?.provider_ids || [], policy.provider_ids || []),
    model_ids: uniqueStrings(preset?.model_ids || [], policy.model_ids || []),
    cost_preference: policy.cost_preference || request.cost_preference || preset?.cost_preference || 'none',
    latency_preference: policy.latency_preference || request.latency_preference || preset?.latency_preference || 'none',
    provider_diverse_fallbacks: normalizeBoolean(policy.provider_diverse_fallbacks, DEFAULT_ROUTING_POLICY.provider_diverse_fallbacks),
    metadata: {
      preset_id: preset?.id || null,
      policy_source: policy && Object.keys(policy).length > 0 ? 'caller' : preset ? 'preset' : 'defaults',
    },
  };
}

export function validateRoutingPolicy(policy) {
  const errors = [];
  if (!ROUTER_STRATEGIES.includes(policy.strategy)) {
    errors.push({ code: 'invalid_strategy', path: 'strategy', message: `Unsupported routing strategy: ${policy.strategy}` });
  }
  if (!Array.isArray(policy.required_capabilities)) {
    errors.push({ code: 'invalid_policy', path: 'required_capabilities', message: 'required_capabilities must be an array' });
  }
  if (!Array.isArray(policy.preferred_capabilities)) {
    errors.push({ code: 'invalid_policy', path: 'preferred_capabilities', message: 'preferred_capabilities must be an array' });
  }
  return {
    success: errors.length === 0,
    errors,
    value: policy,
  };
}

export function toDecisionStrategy(strategy) {
  return DECISION_STRATEGY_BY_ROUTER_STRATEGY[strategy] || 'balanced';
}
