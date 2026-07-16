function numberOrNull(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function estimateGatewayCost({
  usage,
  model = null,
  pricing = null,
  currency = null,
} = {}) {
  const warnings = [];
  const source = pricing || model || {};
  const inputRate = numberOrNull(source.input_cost);
  const outputRate = numberOrNull(source.output_cost);
  const usageInput = Number.isInteger(usage?.input_tokens) ? usage.input_tokens : null;
  const usageOutput = Number.isInteger(usage?.output_tokens) ? usage.output_tokens : null;
  const selectedCurrency = currency || source.currency || usage?.currency || null;

  if (!selectedCurrency) warnings.push('currency unavailable');
  if (inputRate === null || outputRate === null) warnings.push('pricing unavailable');
  if (usageInput === null || usageOutput === null) warnings.push('usage unavailable');
  if (currency && source.currency && currency !== source.currency) warnings.push('currency mismatch');

  const inputCost = inputRate !== null && usageInput !== null ? (usageInput / 1000000) * inputRate : null;
  const outputCost = outputRate !== null && usageOutput !== null ? (usageOutput / 1000000) * outputRate : null;
  return {
    input_cost: inputCost,
    output_cost: outputCost,
    total_cost: inputCost !== null && outputCost !== null ? inputCost + outputCost : null,
    currency: selectedCurrency,
    estimated: true,
    pricing_source: pricing ? 'supplied' : (model ? 'registry-static' : 'unavailable'),
    warnings,
  };
}
