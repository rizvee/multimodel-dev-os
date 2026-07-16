import { safeMetadata, redactGatewayObservability } from './redaction.js';

export const GATEWAY_OBSERVABILITY_EVENT_TYPES = Object.freeze([
  'request-received',
  'request-validated',
  'route-planned',
  'mock-provider-started',
  'mock-provider-completed',
  'stream-started',
  'stream-chunk',
  'stream-completed',
  'request-completed',
  'request-failed',
  'request-aborted',
  'auth-failed',
  'rate-limited',
  'runtime-started',
  'runtime-stopped',
]);

function safeType(type) {
  return GATEWAY_OBSERVABILITY_EVENT_TYPES.includes(type) ? type : 'request-failed';
}

export function createGatewayEvent({
  event_id,
  trace_id = null,
  request_id = null,
  type,
  timestamp,
  duration_ms = null,
  provider_id = null,
  model_id = null,
  route_strategy = null,
  status = null,
  error_code = null,
  usage = null,
  cost_estimate = null,
  metadata = {},
} = {}) {
  return {
    event_id,
    trace_id,
    request_id,
    type: safeType(type),
    timestamp,
    duration_ms,
    provider_id,
    model_id,
    route_strategy,
    status,
    error_code,
    usage: usage ? redactGatewayObservability(usage) : null,
    cost_estimate: cost_estimate ? redactGatewayObservability(cost_estimate) : null,
    metadata: safeMetadata(metadata),
  };
}
