import { redactSensitiveValue } from '../protocol/errors.js';

const EVENT_TYPES = Object.freeze([
  'attempt-planned',
  'attempt-failed',
  'retry-planned',
  'retry-rejected',
  'fallback-planned',
  'fallback-rejected',
  'circuit-opened',
  'circuit-half-open',
  'circuit-closed',
  'operation-aborted',
  'simulation-complete',
]);

export function createResilienceEvent({
  event_id = null,
  request_id = 'resilience-simulation',
  type,
  attempt = 1,
  provider_id = null,
  model_id = null,
  failure = null,
  retry_decision = null,
  fallback_transition = null,
  circuit_breaker = null,
  timestamp = 1,
  metadata = {},
} = {}) {
  const safeType = EVENT_TYPES.includes(type) ? type : 'simulation-complete';
  const safeAttempt = Number.isInteger(attempt) && attempt > 0 ? attempt : 1;
  return {
    event_id: event_id || `${request_id}-${safeType}-${safeAttempt}`,
    request_id,
    type: safeType,
    attempt: safeAttempt,
    provider_id,
    model_id,
    failure: failure ? redactSensitiveValue(failure) : null,
    retry_decision: retry_decision ? redactSensitiveValue(retry_decision) : null,
    fallback_transition: fallback_transition ? redactSensitiveValue(fallback_transition) : null,
    circuit_breaker: circuit_breaker ? redactSensitiveValue(circuit_breaker) : null,
    timestamp: Number.isFinite(timestamp) ? timestamp : 1,
    metadata: redactSensitiveValue(metadata || {}),
  };
}
