export const GATEWAY_PROTOCOL_VERSION = '2026-07-15.sprint-a';
export const GATEWAY_OBJECT_PREFIX = 'mmdo.gateway';

export const CHAT_MESSAGE_ROLES = [
  'system',
  'developer',
  'user',
  'assistant',
  'tool',
];

export const CHAT_REQUEST_FIELDS = [
  'model',
  'messages',
  'stream',
  'temperature',
  'top_p',
  'max_tokens',
  'stop',
  'tools',
  'tool_choice',
  'user',
  'metadata',
];

export const PROVIDER_CAPABILITIES = [
  'chat',
  'streaming',
  'tools',
  'vision',
  'audio',
  'reasoning',
  'embeddings',
  'local',
  'structured-output',
];

export const PROVIDER_TYPES = [
  'openai-compatible',
  'native',
  'local',
  'mock',
];

export const ROUTING_STRATEGIES = [
  'explicit',
  'capability-based',
  'cost-first',
  'latency-first',
  'context-window-aware',
  'privacy-local-first',
  'fallback-chain',
  'balanced',
  'user-policy',
];

export const PRIVACY_POLICIES = [
  'standard',
  'local-first',
  'local-only',
  'no-retention-preferred',
];

export const COST_PREFERENCES = [
  'none',
  'low',
  'balanced',
  'performance',
];

export const LATENCY_PREFERENCES = [
  'none',
  'low',
  'balanced',
  'quality',
];

export const ERROR_CODES = [
  'invalid_request',
  'unsupported_field',
  'unsupported_capability',
  'model_not_found',
  'provider_not_found',
  'provider_unavailable',
  'authentication_required',
  'authentication_failed',
  'rate_limited',
  'quota_exceeded',
  'context_length_exceeded',
  'request_too_large',
  'timeout',
  'upstream_timeout',
  'upstream_error',
  'stream_error',
  'policy_denied',
  'configuration_error',
  'internal_error',
];

export const DEFAULT_GATEWAY_CONFIG = Object.freeze({
  host: '127.0.0.1',
  port: 4141,
  auth: {
    mode: 'local-only',
    required_for_remote: true,
  },
  request_size_limit: 1048576,
  request_timeout_ms: 60000,
  stream_idle_timeout_ms: 30000,
  provider_timeout_ms: 60000,
  retry_limit: 0,
  log_level: 'info',
  redact_prompts: true,
  allow_remote_binding: false,
  allowed_provider_hosts: [],
  allow_private_provider_networks: false,
  default_routing_strategy: 'balanced',
  fallback_enabled: false,
});

export const SENSITIVE_KEY_PATTERN = /(api[_-]?key|authorization|token|secret|credential|password|cookie)/i;
