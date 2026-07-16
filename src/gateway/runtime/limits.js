import { normalizeGatewayObservabilityConfig } from '../observability/collector.js';

export const DEFAULT_GATEWAY_RUNTIME_CONFIG = Object.freeze({
  host: '127.0.0.1',
  port: 0,
  auth_mode: 'none-localhost-only',
  auth_token: null,
  request_size_limit_bytes: 1048576,
  request_timeout_ms: 30000,
  stream_idle_timeout_ms: 15000,
  stream_total_timeout_ms: 60000,
  provider_timeout_ms: 30000,
  shutdown_timeout_ms: 1000,
  log_level: 'error',
  redact_prompts: true,
  allow_remote_binding: false,
  fallback_enabled: false,
  observability: Object.freeze({
    enabled: true,
    expose_http_endpoints: false,
  }),
});

const WILDCARD_IPV4 = ['0', '0', '0', '0'].join('.');

export function isLoopbackHost(host) {
  return ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(String(host || '').toLowerCase());
}

export function normalizeRemoteAddress(address) {
  const value = String(address || '').toLowerCase();
  if (value === '::1' || value === '::ffff:127.0.0.1') return '127.0.0.1';
  return value;
}

export function isLoopbackAddress(address) {
  const normalized = normalizeRemoteAddress(address);
  return normalized === '127.0.0.1' || normalized === 'localhost' || normalized === '::1' || normalized.startsWith('127.');
}

function boundedInteger(value, fallback, { min = 0, max = 3600000 } = {}) {
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

export function normalizeGatewayRuntimeConfig(config = {}) {
  const source = { ...DEFAULT_GATEWAY_RUNTIME_CONFIG, ...(config || {}) };
  const authToken = typeof source.auth_token === 'string' ? source.auth_token.trim() : '';
  return {
    host: String(source.host || DEFAULT_GATEWAY_RUNTIME_CONFIG.host),
    port: boundedInteger(source.port, DEFAULT_GATEWAY_RUNTIME_CONFIG.port, { min: 0, max: 65535 }),
    auth_mode: ['none-localhost-only', 'bearer-token'].includes(source.auth_mode) ? source.auth_mode : DEFAULT_GATEWAY_RUNTIME_CONFIG.auth_mode,
    auth_token: authToken.length > 0 && authToken.length <= 4096 ? authToken : null,
    request_size_limit_bytes: boundedInteger(source.request_size_limit_bytes, DEFAULT_GATEWAY_RUNTIME_CONFIG.request_size_limit_bytes, { min: 1 }),
    request_timeout_ms: boundedInteger(source.request_timeout_ms, DEFAULT_GATEWAY_RUNTIME_CONFIG.request_timeout_ms, { min: 1 }),
    stream_idle_timeout_ms: boundedInteger(source.stream_idle_timeout_ms, DEFAULT_GATEWAY_RUNTIME_CONFIG.stream_idle_timeout_ms, { min: 1 }),
    stream_total_timeout_ms: boundedInteger(source.stream_total_timeout_ms, DEFAULT_GATEWAY_RUNTIME_CONFIG.stream_total_timeout_ms, { min: 1 }),
    provider_timeout_ms: boundedInteger(source.provider_timeout_ms, DEFAULT_GATEWAY_RUNTIME_CONFIG.provider_timeout_ms, { min: 1 }),
    shutdown_timeout_ms: boundedInteger(source.shutdown_timeout_ms, DEFAULT_GATEWAY_RUNTIME_CONFIG.shutdown_timeout_ms, { min: 1 }),
    log_level: ['debug', 'info', 'warn', 'error'].includes(source.log_level) ? source.log_level : DEFAULT_GATEWAY_RUNTIME_CONFIG.log_level,
    redact_prompts: source.redact_prompts !== false,
    allow_remote_binding: Boolean(source.allow_remote_binding),
    fallback_enabled: source.fallback_enabled === true,
    request_id_factory: typeof source.request_id_factory === 'function' ? source.request_id_factory : null,
    mock_delay_ms: boundedInteger(source.mock_delay_ms, 0, { min: 0, max: 1000 }),
    observability: normalizeGatewayObservabilityConfig(source.observability || DEFAULT_GATEWAY_RUNTIME_CONFIG.observability),
  };
}

export function validateGatewayRuntimeConfig(config = {}) {
  const normalized = normalizeGatewayRuntimeConfig(config);
  const errors = [];
  if (!isLoopbackHost(normalized.host) && !normalized.allow_remote_binding) {
    errors.push({ code: 'policy_denied', path: 'host', message: 'remote binding requires explicit remote binding approval' });
  }
  if ([WILDCARD_IPV4, '::'].includes(normalized.host) && !normalized.allow_remote_binding) {
    errors.push({ code: 'policy_denied', path: 'host', message: 'wildcard binding is disabled by default' });
  }
  if (!isLoopbackHost(normalized.host) && normalized.auth_mode !== 'bearer-token') {
    errors.push({ code: 'authentication_required', path: 'auth_mode', message: 'non-local binding requires bearer-token authentication' });
  }
  if (normalized.auth_mode === 'bearer-token' && !normalized.auth_token) {
    errors.push({ code: 'authentication_required', path: 'auth_token', message: 'bearer-token mode requires explicit auth_token' });
  }
  return {
    success: errors.length === 0,
    errors,
    warnings: normalized.fallback_enabled ? ['runtime fallback execution is disabled in Sprint E'] : [],
    value: normalized,
  };
}
