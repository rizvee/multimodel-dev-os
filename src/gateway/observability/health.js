function latencySummary(values = []) {
  const clean = values.filter((value) => Number.isFinite(value) && value >= 0);
  return {
    count: clean.length,
    average_ms: clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null,
    minimum_ms: clean.length ? Math.min(...clean) : null,
    maximum_ms: clean.length ? Math.max(...clean) : null,
  };
}

export function buildProviderHealthSnapshot({
  provider_id,
  status = 'unknown',
  executable = false,
  local = false,
  last_success_at = null,
  last_failure_at = null,
  consecutive_successes = 0,
  consecutive_failures = 0,
  request_count = 0,
  error_count = 0,
  latencies = [],
  metadata = {},
} = {}) {
  return {
    provider_id,
    status,
    executable: Boolean(executable),
    local: Boolean(local),
    last_success_at,
    last_failure_at,
    consecutive_successes,
    consecutive_failures,
    request_count,
    error_count,
    latency_summary: latencySummary(latencies),
    metadata: { ...metadata },
  };
}

export function metadataOnlyProviderHealth(provider) {
  return buildProviderHealthSnapshot({
    provider_id: provider?.id || null,
    status: 'metadata-only',
    executable: false,
    local: provider?.local === true,
    metadata: { source: 'registry' },
  });
}
