import { safeMetadata, redactGatewayObservability } from './redaction.js';

export function createGatewayTrace({
  trace_id,
  request_id,
  started_at,
  completed_at = null,
  duration_ms = null,
  method = null,
  pathname = null,
  status_code = null,
  provider_id = null,
  model_id = null,
  route_strategy = null,
  streamed = false,
  success = null,
  usage = null,
  cost_estimate = null,
  error = null,
  event_ids = [],
  metadata = {},
} = {}) {
  return {
    trace_id,
    request_id,
    started_at,
    completed_at,
    duration_ms,
    method,
    pathname,
    status_code,
    provider_id,
    model_id,
    route_strategy,
    streamed: Boolean(streamed),
    success,
    usage: usage ? redactGatewayObservability(usage) : null,
    cost_estimate: cost_estimate ? redactGatewayObservability(cost_estimate) : null,
    error: error ? redactGatewayObservability(error) : null,
    event_ids: [...event_ids],
    metadata: safeMetadata(metadata),
  };
}

export function completeGatewayTrace(trace, updates = {}) {
  return createGatewayTrace({
    ...(trace || {}),
    ...updates,
    event_ids: updates.event_ids || trace?.event_ids || [],
  });
}
