function rejection(candidate, code, message) {
  return {
    provider_id: candidate.provider_id,
    model_id: candidate.model_id,
    code,
    message,
  };
}

export function requiredContextWindow(request = {}) {
  const explicit = request.required_context_window;
  const input = request.estimated_input_tokens;
  const output = request.requested_output_tokens ?? request.max_output_tokens ?? request.metadata?.requested_output_tokens ?? request.metadata?.max_output_tokens;
  const fromEstimate = Number.isInteger(input) && Number.isInteger(output) ? input + output : null;
  if (Number.isInteger(explicit)) return Math.max(explicit, fromEstimate || 0);
  return fromEstimate;
}

export function requestedOutputTokens(request = {}) {
  const value = request.requested_output_tokens ?? request.max_tokens ?? request.max_output_tokens ?? request.metadata?.requested_output_tokens ?? request.metadata?.max_output_tokens;
  return Number.isInteger(value) && value > 0 ? value : null;
}

function modelMatches(candidate, requestedModel) {
  if (!requestedModel) return true;
  return candidate.model_id === requestedModel || candidate.aliases.includes(requestedModel);
}

export function filterGatewayRouteCandidates({ candidates, request = {}, policy }) {
  const rejected = [];
  const viable = [];
  const requiredContext = requiredContextWindow(request);
  const outputTokens = requestedOutputTokens(request);
  const requiredCapabilities = policy.required_capabilities || [];
  const excludedModels = new Set(policy.excluded_models || []);
  const excludedProviders = new Set(policy.excluded_providers || []);
  const presetModels = new Set(policy.model_ids || []);
  const presetProviders = new Set(policy.provider_ids || []);

  for (const candidate of candidates) {
    const reasons = [];
    if (!policy.allow_disabled && candidate.provider_enabled !== true) reasons.push(rejection(candidate, 'provider_disabled', 'Provider is disabled'));
    if (!policy.allow_disabled && candidate.enabled !== true) reasons.push(rejection(candidate, 'model_disabled', 'Model is disabled'));
    if (excludedProviders.has(candidate.provider_id)) reasons.push(rejection(candidate, 'provider_excluded', 'Provider is excluded by request or policy'));
    if (excludedModels.has(candidate.model_id) || candidate.aliases.some((alias) => excludedModels.has(alias))) reasons.push(rejection(candidate, 'model_excluded', 'Model is excluded by request or policy'));
    if (request.requested_provider && candidate.provider_id !== request.requested_provider) reasons.push(rejection(candidate, 'provider_mismatch', 'Candidate provider does not match explicit provider'));
    if (request.requested_model && !modelMatches(candidate, request.requested_model)) reasons.push(rejection(candidate, 'model_mismatch', 'Candidate model does not match explicit model or alias'));
    if (presetProviders.size > 0 && !presetProviders.has(candidate.provider_id)) reasons.push(rejection(candidate, 'provider_mismatch', 'Candidate provider is outside the routing preset'));
    if (presetModels.size > 0 && !presetModels.has(candidate.model_id) && !candidate.aliases.some((alias) => presetModels.has(alias))) reasons.push(rejection(candidate, 'model_mismatch', 'Candidate model is outside the routing preset'));
    for (const capability of requiredCapabilities) {
      if (!candidate.capabilities.includes(capability)) reasons.push(rejection(candidate, 'capability_missing', `Missing required capability: ${capability}`));
    }
    if (requiredContext !== null && (candidate.context_window === null || candidate.context_window < requiredContext)) {
      reasons.push(rejection(candidate, 'context_window_insufficient', 'Candidate context window is insufficient'));
    }
    if (outputTokens !== null && candidate.max_output_tokens !== null && candidate.max_output_tokens < outputTokens) {
      reasons.push(rejection(candidate, 'output_limit_insufficient', 'Candidate output-token limit is insufficient'));
    }
    if (policy.local_required && candidate.local !== true) reasons.push(rejection(candidate, 'local_required', 'Local-only policy requires a local candidate'));
    if (request.privacy_policy === 'local-only' && candidate.local !== true) reasons.push(rejection(candidate, 'privacy_policy_mismatch', 'Request privacy policy requires local-only routing'));
    if (!policy.allowed_statuses.includes(candidate.status) || !policy.allowed_statuses.includes(candidate.provider_status)) {
      reasons.push(rejection(candidate, 'unsupported_status', 'Candidate status is not allowed by policy'));
    }
    if (!candidate.provider_id || !candidate.model_id) reasons.push(rejection(candidate, 'invalid_registry_record', 'Candidate is missing provider or model id'));

    if (reasons.length > 0) {
      rejected.push(...reasons);
    } else {
      viable.push(candidate);
    }
  }

  return { viable, rejected };
}
