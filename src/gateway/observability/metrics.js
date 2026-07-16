function average(values) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function increment(bucket, key) {
  if (!key) return;
  bucket[key] = (bucket[key] || 0) + 1;
}

export function buildGatewayMetricsSnapshot({
  traces = [],
  usage = [],
  events = [],
  started_at = null,
  now = null,
} = {}) {
  const completed = traces.filter((trace) => trace.completed_at !== null);
  const latencies = completed.map((trace) => trace.duration_ms).filter((value) => Number.isFinite(value));
  const models = {};
  const providers = {};
  const errors = {};
  for (const trace of traces) {
    increment(models, trace.model_id);
    increment(providers, trace.provider_id);
    if (trace.error?.code) increment(errors, trace.error.code);
  }
  const costValues = usage.map((record) => record.cost_estimate?.total_cost).filter((value) => Number.isFinite(value));
  const currencies = new Set(usage.map((record) => record.cost_estimate?.currency).filter(Boolean));
  return {
    started_at,
    uptime_ms: started_at !== null && now !== null ? Math.max(0, now - started_at) : null,
    requests_total: traces.length,
    requests_success: traces.filter((trace) => trace.success === true).length,
    requests_failed: traces.filter((trace) => trace.success === false).length,
    requests_streamed: traces.filter((trace) => trace.streamed === true).length,
    active_requests: traces.filter((trace) => trace.completed_at === null).length,
    auth_failures: events.filter((event) => event.type === 'auth-failed').length,
    total_input_tokens: usage.reduce((sum, record) => sum + (record.input_tokens || 0), 0),
    total_output_tokens: usage.reduce((sum, record) => sum + (record.output_tokens || 0), 0),
    total_tokens: usage.reduce((sum, record) => sum + (record.total_tokens || 0), 0),
    estimated_cost_total: currencies.size <= 1 && costValues.length > 0 ? costValues.reduce((sum, value) => sum + value, 0) : null,
    currency: currencies.size === 1 ? [...currencies][0] : null,
    average_latency_ms: average(latencies),
    minimum_latency_ms: latencies.length ? Math.min(...latencies) : null,
    maximum_latency_ms: latencies.length ? Math.max(...latencies) : null,
    models,
    providers,
    errors,
    metadata: {},
  };
}
