function boundedLimit(limit, fallback = 50, max = 500) {
  return Number.isInteger(limit) && limit >= 0 && limit <= max ? limit : fallback;
}

function matches(record, query = {}) {
  if (query.request_id && record.request_id !== query.request_id) return false;
  if (query.trace_id && record.trace_id !== query.trace_id) return false;
  if (query.type && record.type !== query.type) return false;
  if (query.provider_id && record.provider_id !== query.provider_id) return false;
  if (query.model_id && record.model_id !== query.model_id) return false;
  return true;
}

export function queryGatewayEvents(events = [], query = {}) {
  return events.filter((event) => matches(event, query)).slice(-boundedLimit(query.limit));
}

export function queryGatewayTraces(traces = [], query = {}) {
  return traces.filter((trace) => matches(trace, query)).slice(-boundedLimit(query.limit));
}

export function queryGatewayUsage(usage = [], query = {}) {
  return usage.filter((record) => matches(record, query)).slice(-boundedLimit(query.limit));
}
