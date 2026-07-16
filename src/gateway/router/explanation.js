export function createRouteExplanation({
  strategy,
  selected,
  request,
  policy,
  rejected,
  fallbackChain,
  warnings,
  presetId,
}) {
  return {
    summary: `Dry-run route selected ${selected.provider_id}/${selected.model_id} for planning only.`,
    strategy,
    selected: {
      provider_id: selected.provider_id,
      model_id: selected.model_id,
      local: selected.local,
      score: selected.score,
    },
    hard_requirements: {
      required_capabilities: policy.required_capabilities,
      required_context_window: request.required_context_window ?? null,
      estimated_input_tokens: request.estimated_input_tokens ?? null,
      local_required: policy.local_required,
      excluded_providers: policy.excluded_providers || [],
      excluded_models: policy.excluded_models || [],
    },
    score_breakdown: selected.score_components || [],
    rejected: rejected.map((entry) => ({
      provider_id: entry.provider_id,
      model_id: entry.model_id,
      code: entry.code,
      message: entry.message,
    })),
    fallbacks: fallbackChain,
    warnings,
    policy_source: policy.metadata?.policy_source || 'defaults',
    preset_id: presetId || null,
    deterministic_tie_break: policy.tie_breakers,
  };
}
