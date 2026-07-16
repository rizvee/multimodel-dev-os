import { isLoopbackHost } from '../runtime/limits.js';

export const DEFAULT_GATEWAY_CLIENT_PORT = 8787;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanPath(pathname) {
  return pathname.replace(/\/+$/, '');
}

export function normalizeGatewayEndpointConfig(endpoint = {}) {
  const source = isObject(endpoint) ? endpoint : {};
  const host = String(source.host || '127.0.0.1');
  const port = Number.isInteger(source.port) ? source.port : DEFAULT_GATEWAY_CLIENT_PORT;
  const protocol = source.protocol === 'https:' ? 'https:' : 'http:';
  const baseUrl = source.base_url || `${protocol}//${host}:${port}/v1`;
  const parsed = new URL(baseUrl);
  const basePath = cleanPath(parsed.pathname || '/v1') || '/v1';
  const authMode = source.auth_mode === 'bearer-token' ? 'bearer-token' : 'none-localhost-only';
  const tokenEnv = typeof source.token_env === 'string' && source.token_env.trim()
    ? source.token_env.trim()
    : (authMode === 'bearer-token' ? 'MMDO_GATEWAY_TOKEN' : null);
  return {
    base_url: `${parsed.protocol}//${parsed.host}${basePath}`,
    chat_completions_url: `${parsed.protocol}//${parsed.host}${basePath}/chat/completions`,
    models_url: `${parsed.protocol}//${parsed.host}${basePath}/models`,
    health_url: `${parsed.protocol}//${parsed.host}/health`,
    host: parsed.hostname,
    port: Number(parsed.port || port),
    protocol: 'openai-compatible',
    auth_mode: authMode,
    token_env: tokenEnv,
    executable_models: Array.isArray(source.executable_models) && source.executable_models.length > 0
      ? [...source.executable_models]
      : ['mock-chat', 'mock-tools', 'mock-stream'],
    streaming: source.streaming !== false,
    metadata: isObject(source.metadata) ? { ...source.metadata } : {},
  };
}

export function validateGatewayEndpointConfig(endpoint = {}) {
  const errors = [];
  let value = null;
  try {
    if (endpoint?.base_url) {
      const raw = new URL(endpoint.base_url);
      if (raw.username || raw.password) {
        errors.push({ code: 'embedded_credentials', path: 'base_url', message: 'endpoint URL must not contain embedded credentials' });
      }
    }
    value = normalizeGatewayEndpointConfig(endpoint);
    const parsed = new URL(value.base_url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      errors.push({ code: 'unsupported_protocol', path: 'base_url', message: 'endpoint protocol must be http or https' });
    }
    if (parsed.hash) {
      errors.push({ code: 'invalid_endpoint', path: 'base_url', message: 'endpoint URL must not include fragments' });
    }
    if (!isLoopbackHost(parsed.hostname)) {
      errors.push({ code: 'remote_endpoint', path: 'base_url', message: 'gateway client endpoints must be loopback by default' });
    }
    if (!Number.isInteger(value.port) || value.port < 0 || value.port > 65535) {
      errors.push({ code: 'invalid_port', path: 'port', message: 'endpoint port must be between 0 and 65535' });
    }
    if (value.token_env !== null && !/^[A-Z][A-Z0-9_]*$/.test(value.token_env)) {
      errors.push({ code: 'invalid_token_env', path: 'token_env', message: 'token_env must be an environment variable name' });
    }
  } catch (error) {
    errors.push({ code: 'invalid_endpoint', path: 'base_url', message: error.message });
  }
  return {
    success: errors.length === 0,
    errors,
    warnings: [],
    value,
  };
}
