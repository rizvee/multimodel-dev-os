import { relative, resolve, sep } from 'path';
import { normalizeGatewayEndpointConfig, validateGatewayEndpointConfig } from './endpoint.js';
import { createGatewayClientEnvironment, tokenPlaceholder } from './environment.js';
import { createGatewayClientDiagnostics } from './diagnostics.js';
import { getGatewayClientProfile } from './registry.js';
import { validateGatewayClientCompatibility } from './validation.js';
import { createClientError } from './errors.js';

function safeRelativePath(path) {
  const normalized = String(path || '').replace(/\\/g, '/');
  return normalized && !normalized.startsWith('/') && !/^[A-Za-z]:/.test(normalized) && !normalized.split('/').includes('..');
}

function assertInsideWorkspace(root, relPath) {
  const workspace = resolve(root || process.cwd());
  const target = resolve(workspace, relPath);
  const rel = relative(workspace, target);
  return rel && !rel.startsWith('..') && !rel.split(sep).includes('..') && !/^[A-Za-z]:/.test(rel);
}

function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function snippetFor(client, endpoint, model, auth) {
  const token = auth?.token_env || endpoint.token_env || 'MMDO_GATEWAY_TOKEN';
  const header = endpoint.auth_mode === 'bearer-token'
    ? { Authorization: `Bearer ${tokenPlaceholder(token)}` }
    : {};
  const base = {
    base_url: endpoint.base_url,
    model,
    stream_model: 'mock-stream',
    executable_models: endpoint.executable_models,
    headers: header,
    notes: [
      'Preview-only configuration for the local mock gateway.',
      'Only mock models are executable in v4.2 Sprint F.',
      'No third-party client was installed or executed by this generator.',
    ],
  };
  if (client.id === 'node-client') {
    return `// Preview-only local mock gateway client.\nconst http = require('node:http');\nconst baseUrl = '${endpoint.base_url}';\nconst model = '${model}';\n// Send requests to localhost only. Do not place raw tokens in this file.\n`;
  }
  if (client.id === 'mcp') {
    return formatJson({ mcp_gateway_resource_example: base, implemented_mcp_server: false });
  }
  return formatJson({ [client.id]: base });
}

function fileFor(client) {
  if (Array.isArray(client.configuration_locations) && client.configuration_locations[0]) {
    return client.configuration_locations[0];
  }
  const extension = client.configuration_formats?.includes('json') ? 'json' : 'md';
  return `.ai/gateway-clients/${client.id}.${extension}`;
}

export function generateGatewayClientConfig({
  clientId,
  endpoint = {},
  model = 'mock-chat',
  auth = {},
  outputFormat = 'json',
  workspaceRoot = process.cwd(),
  options = {},
} = {}) {
  const client = getGatewayClientProfile(clientId);
  if (!client) throw createClientError('unknown_client', `Unknown gateway client: ${clientId}`);
  const endpointInput = {
    ...endpoint,
    auth_mode: auth.mode || endpoint.auth_mode,
    token_env: auth.token_env || endpoint.token_env,
  };
  const endpointResult = validateGatewayEndpointConfig(endpointInput);
  if (!endpointResult.success) {
    return {
      client,
      mode: 'preview',
      files: [],
      environment: {},
      instructions: [],
      warnings: endpointResult.errors.map((error) => error.message),
      compatible: false,
      validation: { endpoint: endpointResult },
      writes_performed: false,
    };
  }
  const normalizedEndpoint = normalizeGatewayEndpointConfig(endpointInput);
  const compatibility = validateGatewayClientCompatibility({
    client,
    endpoint: normalizedEndpoint,
    requestedFeatures: options.requested_features || {},
    model,
  });
  const relPath = fileFor(client);
  const pathSafe = safeRelativePath(relPath) && assertInsideWorkspace(workspaceRoot, relPath);
  const files = pathSafe ? [{
    relative_path: relPath,
    format: outputFormat === 'markdown' ? 'markdown' : (relPath.endsWith('.md') ? 'markdown' : 'json'),
    content: relPath.endsWith('.md')
      ? `# ${client.name} Gateway Preview\n\nEndpoint: \`${normalizedEndpoint.base_url}\`\n\nModel: \`${model}\`\n\nThis is a preview-only local mock gateway configuration. No files were written.\n`
      : snippetFor(client, normalizedEndpoint, model, auth),
    overwrite_risk: 'unknown',
    contains_secrets: false,
    action: 'preview',
  }] : [];
  const environment = createGatewayClientEnvironment({ endpoint: normalizedEndpoint, auth });
  const plan = {
    client,
    mode: 'preview',
    endpoint: normalizedEndpoint,
    model,
    files,
    environment,
    instructions: [
      'Start the Sprint E gateway locally before using this configuration.',
      'Use mock models only: mock-chat, mock-tools, or mock-stream.',
      'Review client-specific documentation before applying any configuration manually.',
    ],
    warnings: [
      ...compatibility.warnings,
      ...(client.status !== 'validated' ? ['This client profile is not marked as locally validated.'] : []),
    ],
    compatible: compatibility.compatible,
    validation: { endpoint: endpointResult, compatibility },
    diagnostics: null,
    writes_performed: false,
  };
  plan.diagnostics = createGatewayClientDiagnostics({
    client,
    endpoint: normalizedEndpoint,
    model,
    compatibility,
    files,
  });
  return plan;
}
