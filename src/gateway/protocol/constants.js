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

export const EXECUTION_STATES = [
  'pending',
  'executing',
  'completed',
  'failed',
  'cancelled',
  'timed_out',
];

export const CREDENTIAL_SOURCES = [
  'environment',
];

export const ALLOWED_TRANSPORT_HEADERS = [
  'authorization',
  'content-type',
  'user-agent',
  'accept',
];

export const EXECUTION_PROTOCOLS = [
  'https',
];

export const EXECUTION_DEFAULTS = Object.freeze({
  timeout_ms: 60000,
  max_response_bytes: 10485760,
  stream: false,
  follow_redirects: false,
  ssrf_check_required: true,
});

export const EXECUTION_CONTRACT_VERSION = '2026-07-15.sprint-a';

export const STRICT_ENV_VAR_REGEX = /^[A-Z_][A-Z0-9_]{0,127}$/;

export const PROTOTYPE_NAMES_PATTERN = /^(?:__proto__|prototype|constructor)$/i;

export const EXECUTION_ERROR_CATEGORIES = [
  'execution_disabled',
  'provider_not_enabled',
  'unsupported_capability',
  'credential_reference_invalid',
  'credential_unavailable',
  'endpoint_invalid',
  'endpoint_forbidden',
  'request_invalid',
  'request_too_large',
  'timeout',
  'upstream_authentication',
  'upstream_rate_limit',
  'upstream_quota',
  'upstream_client_error',
  'upstream_server_error',
  'upstream_protocol_error',
  'stream_error',
  'response_too_large',
  'cancelled',
  'internal_execution_error',
];

export const CREDENTIAL_REF_KEYS = [
  'contract_version',
  'source',
  'env_var',
  'required',
];

export const PROVIDER_ENDPOINT_KEYS = [
  'contract_version',
  'url',
  'protocol',
  'headers_allowlist',
  'follow_redirects',
  'ssrf_check_required',
];

export const EXECUTION_POLICY_KEYS = [
  'contract_version',
  'enabled',
  'allowed_provider_ids',
  'require_https',
  'allow_private_networks',
  'follow_redirects',
  'max_attempts',
  'request_timeout_ms',
  'response_timeout_ms',
  'max_request_bytes',
  'max_response_bytes',
  'fallback_enabled',
  'retry_enabled',
  'observability_policy_id',
  'metadata',
];

export const PROVIDER_CAPABILITY_KEYS = [
  'contract_version',
  'chat_completions',
  'non_streaming',
  'sse_streaming',
  'usage_reporting',
  'tool_calls',
  'structured_output',
  'system_messages',
  'custom_endpoint_support',
  'supported_auth_schemes',
  'metadata',
];

export const EXECUTION_REQUEST_KEYS = [
  'contract_version',
  'request_id',
  'provider_id',
  'model_id',
  'gateway_request',
  'credential_ref',
  'endpoint',
  'options',
  'policy',
  'capability',
  'metadata',
];

export const EXECUTION_RESULT_KEYS = [
  'contract_version',
  'execution_id',
  'request_id',
  'provider_id',
  'model_id',
  'state',
  'attempt_count',
  'gateway_response',
  'error',
  'timing',
  'usage',
  'metadata',
  'redacted',
];

export const EXECUTION_ERROR_KEYS = [
  'contract_version',
  'code',
  'category',
  'message',
  'retryable',
  'request_id',
  'provider_id',
  'status',
  'details',
  'redacted',
];
