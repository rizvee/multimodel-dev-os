export const CLIENT_CATEGORIES = Object.freeze([
  'coding-agent',
  'editor-extension',
  'cli',
  'mcp-client',
  'generic-sdk',
  'custom-client',
]);

export const CLIENT_PROTOCOLS = Object.freeze([
  'openai-chat-completions',
  'openai-compatible',
  'mcp',
  'custom-http',
]);

export const CLIENT_STATUSES = Object.freeze([
  'validated',
  'example-only',
  'adapter-ready',
  'unsupported',
  'needs-manual-review',
]);

export const COMPATIBILITY_LEVELS = Object.freeze([
  'validated-local',
  'protocol-compatible',
  'configuration-example',
  'manual-review',
  'unsupported',
]);

export const EXECUTABLE_MOCK_MODELS = Object.freeze(['mock-chat', 'mock-tools', 'mock-stream']);

export const CLIENT_PROFILE_IDS = Object.freeze([
  'codex',
  'claude-code',
  'cursor',
  'cline',
  'continue',
  'roo-code',
  'aider',
  'antigravity',
  'gemini-cli',
  'mcp',
  'generic-openai',
  'node-client',
]);

export function defaultProfileFor(id) {
  return {
    id,
    name: id,
    category: 'custom-client',
    status: 'needs-manual-review',
    protocol: 'openai-compatible',
    endpoint_style: 'base-url',
    supports_base_url: false,
    supports_model_override: false,
    supports_streaming: false,
    supports_tools: false,
    supports_custom_headers: false,
    supports_bearer_token: false,
    configuration_formats: [],
    configuration_locations: [],
    executable_mock_models: [],
    limitations: ['Compatibility has not been validated by this project.'],
    metadata: {},
  };
}
