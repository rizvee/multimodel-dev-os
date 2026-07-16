import { createGatewayEvent } from './events.js';
import { createGatewayTrace, completeGatewayTrace } from './traces.js';
import { normalizeGatewayUsageRecord } from './usage.js';
import { buildGatewayMetricsSnapshot } from './metrics.js';
import { buildProviderHealthSnapshot } from './health.js';
import { queryGatewayEvents, queryGatewayTraces, queryGatewayUsage } from './queries.js';
import { buildGatewayObservabilitySnapshot } from './snapshot.js';

export const DEFAULT_GATEWAY_OBSERVABILITY_CONFIG = Object.freeze({
  enabled: true,
  max_events: 500,
  max_traces: 200,
  max_usage_records: 200,
  retain_request_metadata: true,
  retain_route_summary: true,
  retain_error_summary: true,
  retain_prompt_content: false,
  retain_response_content: false,
  redact_headers: true,
  redact_query_values: true,
  collect_latency: true,
  collect_usage: true,
  collect_cost_estimates: true,
  collect_health: true,
  expose_http_endpoints: false,
  metadata: {},
});

function boundedInteger(value, fallback, { min = 0, max = 10000 } = {}) {
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pushBounded(target, value, max) {
  target.push(clone(value));
  while (target.length > max) target.shift();
}

export function normalizeGatewayObservabilityConfig(config = {}) {
  const source = { ...DEFAULT_GATEWAY_OBSERVABILITY_CONFIG, ...(config || {}) };
  return {
    ...DEFAULT_GATEWAY_OBSERVABILITY_CONFIG,
    ...source,
    enabled: source.enabled !== false,
    max_events: boundedInteger(source.max_events, DEFAULT_GATEWAY_OBSERVABILITY_CONFIG.max_events, { min: 1 }),
    max_traces: boundedInteger(source.max_traces, DEFAULT_GATEWAY_OBSERVABILITY_CONFIG.max_traces, { min: 1 }),
    max_usage_records: boundedInteger(source.max_usage_records, DEFAULT_GATEWAY_OBSERVABILITY_CONFIG.max_usage_records, { min: 1 }),
    retain_prompt_content: false,
    retain_response_content: false,
    redact_headers: true,
    redact_query_values: true,
    expose_http_endpoints: source.expose_http_endpoints === true,
    metadata: source.metadata && typeof source.metadata === 'object' ? { ...source.metadata } : {},
  };
}

export function validateGatewayObservabilityConfig(config = {}) {
  const value = normalizeGatewayObservabilityConfig(config);
  return { success: true, errors: [], warnings: [], value };
}

export function createGatewayObservabilityCollector({
  config = {},
  idFactory = null,
  timeFactory = null,
} = {}) {
  const normalized = normalizeGatewayObservabilityConfig(config);
  const events = [];
  const traces = [];
  const usage = [];
  const providerHealth = {};
  const startedAt = (timeFactory || (() => Date.now()))();
  let sequence = 0;

  const nextId = (prefix) => (idFactory ? idFactory(prefix) : `${prefix}-${String(++sequence).padStart(6, '0')}`);
  const now = () => (timeFactory || (() => Date.now()))();

  function recordEvent(event = {}) {
    if (!normalized.enabled) return null;
    const record = createGatewayEvent({
      event_id: event.event_id || nextId('evt'),
      timestamp: event.timestamp ?? now(),
      ...event,
    });
    pushBounded(events, record, normalized.max_events);
    return clone(record);
  }

  function recordTrace(trace = {}) {
    if (!normalized.enabled) return null;
    const record = createGatewayTrace({
      trace_id: trace.trace_id || nextId('trc'),
      started_at: trace.started_at ?? now(),
      ...trace,
    });
    const index = traces.findIndex((entry) => entry.trace_id === record.trace_id);
    if (index >= 0) traces[index] = clone(record);
    else pushBounded(traces, record, normalized.max_traces);
    return clone(record);
  }

  function finishTrace(traceId, updates = {}) {
    const trace = traces.find((entry) => entry.trace_id === traceId);
    if (!trace) return null;
    const completed = completeGatewayTrace(trace, updates);
    return recordTrace(completed);
  }

  function recordUsage(record = {}) {
    if (!normalized.enabled || !normalized.collect_usage) return null;
    const value = normalizeGatewayUsageRecord({
      ...record,
      usage: record.usage || record,
      timestamp: record.timestamp ?? now(),
    });
    pushBounded(usage, value, normalized.max_usage_records);
    return clone(value);
  }

  function updateHealth(snapshot = {}) {
    if (!normalized.enabled || !normalized.collect_health) return null;
    const providerId = snapshot.provider_id || 'unknown';
    providerHealth[providerId] = buildProviderHealthSnapshot(snapshot);
    return clone(providerHealth[providerId]);
  }

  function state() {
    return {
      enabled: normalized.enabled,
      counts: {
        events: events.length,
        traces: traces.length,
        usage: usage.length,
        providers: Object.keys(providerHealth).length,
      },
      limits: {
        max_events: normalized.max_events,
        max_traces: normalized.max_traces,
        max_usage_records: normalized.max_usage_records,
      },
    };
  }

  return {
    config: normalized,
    recordEvent,
    recordTrace,
    finishTrace,
    recordUsage,
    updateHealth,
    getEvents: (query = {}) => clone(queryGatewayEvents(events, query)),
    getTraces: (query = {}) => clone(queryGatewayTraces(traces, query)),
    getUsage: (query = {}) => clone(queryGatewayUsage(usage, query)),
    getMetrics: () => clone(buildGatewayMetricsSnapshot({ events, traces, usage, started_at: startedAt, now: now() })),
    getHealth: () => clone(providerHealth),
    snapshot: () => clone(buildGatewayObservabilitySnapshot({ events, traces, usage, health: providerHealth, started_at: startedAt, now: now() })),
    clear: () => {
      events.length = 0;
      traces.length = 0;
      usage.length = 0;
      for (const key of Object.keys(providerHealth)) delete providerHealth[key];
      return { cleared: true };
    },
    state,
  };
}
