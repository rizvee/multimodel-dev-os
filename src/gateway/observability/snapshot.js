import { buildGatewayMetricsSnapshot } from './metrics.js';

export function buildGatewayObservabilitySnapshot({
  events = [],
  traces = [],
  usage = [],
  health = {},
  started_at = null,
  now = null,
} = {}) {
  return {
    object: 'gateway.observability.snapshot',
    events: [...events],
    traces: [...traces],
    usage: [...usage],
    health: { ...health },
    metrics: buildGatewayMetricsSnapshot({ events, traces, usage, started_at, now }),
  };
}
