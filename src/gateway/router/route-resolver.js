import { validateRouteDecision, validateRoutingRequest } from '../protocol/validation.js';
import { createGatewayError } from '../protocol/errors.js';
import { isGatewayRegistrySnapshot } from '../registry/snapshot.js';
import { createGatewayRouteCandidates, findCandidateByModel } from './candidates.js';
import { filterGatewayRouteCandidates } from './filters.js';
import { planGatewayFallbackChain } from './fallback.js';
import { createRouteExplanation } from './explanation.js';
import {
  getRoutingPreset,
  normalizeRoutingPolicy,
  toDecisionStrategy,
  validateRoutingPolicy,
} from './policy.js';
import { rankGatewayRouteCandidates } from './strategies.js';
import { createRoutingError, toRoutingErrorPayload } from './errors.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function explicitReferenceErrors({ request, snapshot, candidates, requestId }) {
  if (request.requested_provider && !snapshot.indexes.providersById[request.requested_provider]) {
    throw createRoutingError({
      code: 'provider_not_found',
      message: `Provider not found: ${request.requested_provider}`,
      request_id: requestId,
      provider: request.requested_provider,
      cause: 'provider_not_found',
    });
  }
  if (request.requested_model && !findCandidateByModel(candidates, request.requested_model)) {
    throw createRoutingError({
      code: 'model_not_found',
      message: `Model not found: ${request.requested_model}`,
      request_id: requestId,
      model: request.requested_model,
      cause: 'model_not_found',
    });
  }
  if (request.requested_provider && request.requested_model) {
    const modelCandidate = findCandidateByModel(candidates, request.requested_model);
    if (modelCandidate && modelCandidate.provider_id !== request.requested_provider) {
      throw createRoutingError({
        code: 'invalid_request',
        message: `Provider/model mismatch: ${request.requested_provider} cannot serve ${request.requested_model}`,
        request_id: requestId,
        provider: request.requested_provider,
        model: request.requested_model,
        details: {
          actual_provider: modelCandidate.provider_id,
        },
        cause: 'provider_model_mismatch',
      });
    }
  }
}

function rejectIfInvalid(result, requestId) {
  if (!result.success) {
    throw createRoutingError({
      code: result.errors?.[0]?.code === 'unsupported_capability' ? 'unsupported_capability' : 'invalid_request',
      message: result.errors?.map((error) => error.message).join('; ') || 'Invalid routing request',
      request_id: requestId,
      details: { errors: result.errors },
      cause: 'validation_failed',
    });
  }
}

export function resolveGatewayRoute({
  request,
  snapshot,
  policy = {},
  presetId = null,
  requestId = 'route-dry-run',
  decisionTime = 1,
} = {}) {
  if (!isGatewayRegistrySnapshot(snapshot)) {
    throw createRoutingError({
      code: 'configuration_error',
      message: 'A valid gateway registry snapshot is required',
      request_id: requestId,
      cause: 'missing_snapshot',
    });
  }

  const normalizedRequest = clone(request || {});
  rejectIfInvalid(validateRoutingRequest(normalizedRequest), requestId);

  const preset = getRoutingPreset(snapshot, presetId);
  if (presetId && !preset) {
    throw createRoutingError({
      code: 'invalid_request',
      message: `Routing preset not found: ${presetId}`,
      request_id: requestId,
      details: { preset_id: presetId },
      cause: 'preset_not_found',
    });
  }

  const normalizedPolicy = normalizeRoutingPolicy({ request: normalizedRequest, policy: clone(policy || {}), preset });
  rejectIfInvalid(validateRoutingPolicy(normalizedPolicy), requestId);

  const candidates = createGatewayRouteCandidates(snapshot);
  explicitReferenceErrors({ request: normalizedRequest, snapshot, candidates, requestId });
  const { viable, rejected } = filterGatewayRouteCandidates({
    candidates,
    request: normalizedRequest,
    policy: normalizedPolicy,
  });

  if (viable.length === 0) {
    throw createRoutingError({
      code: 'model_not_found',
      message: 'No viable gateway route candidate matched the request',
      request_id: requestId,
      details: { rejected },
      cause: 'no_viable_candidate',
    });
  }

  const { ranked, warnings: scoringWarnings } = rankGatewayRouteCandidates({
    candidates: viable,
    request: normalizedRequest,
    policy: normalizedPolicy,
  });
  const selected = ranked[0];
  const fallbackChain = planGatewayFallbackChain({
    selectedCandidate: selected,
    viableCandidates: ranked,
    request: normalizedRequest,
    policy: normalizedPolicy,
  });
  const warnings = [...new Set([...(scoringWarnings || []), ...(selected.warnings || [])])].sort();
  const explanation = createRouteExplanation({
    strategy: normalizedPolicy.strategy,
    selected,
    request: normalizedRequest,
    policy: normalizedPolicy,
    rejected,
    fallbackChain,
    warnings,
    presetId,
  });
  const decision = {
    selected_provider: selected.provider_id,
    selected_model: selected.model_id,
    strategy: toDecisionStrategy(normalizedPolicy.strategy),
    score: selected.score,
    reasons: [
      `selected for planning with ${normalizedPolicy.strategy} strategy`,
      `recommended candidate ${selected.provider_id}/${selected.model_id}`,
    ],
    rejected_candidates: rejected,
    fallback_chain: fallbackChain,
    warnings,
    request_id: requestId,
    decision_timestamp: decisionTime,
    explanation,
  };
  rejectIfInvalid(validateRouteDecision(decision), requestId);
  return decision;
}

export function tryResolveGatewayRoute(options = {}) {
  try {
    return {
      success: true,
      value: resolveGatewayRoute(options),
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      value: null,
      error: toRoutingErrorPayload(error),
    };
  }
}

export function dryRunGatewayRoute(options = {}) {
  const result = tryResolveGatewayRoute(options);
  if (!result.success) {
    return {
      mode: 'dry-run',
      decision: null,
      explanation: null,
      error: result.error,
      executed: false,
    };
  }
  return {
    mode: 'dry-run',
    decision: result.value,
    explanation: result.value.explanation,
    error: null,
    executed: false,
  };
}

export function createNoViableRouteError(details, requestId = 'route-dry-run') {
  return createGatewayError({
    code: 'model_not_found',
    message: 'No viable gateway route candidate matched the request',
    request_id: requestId,
    details,
    cause: 'no_viable_candidate',
  });
}
