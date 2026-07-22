import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  createChatCompletionResponse,
  createCredentialRef,
  createExecutionRequest,
  createExecutionResult,
  createProviderEndpoint,
  DEFAULT_GATEWAY_CONFIG,
  EXECUTION_DEFAULTS,
  validateCredentialRef,
  validateExecutionRequest,
  validateExecutionResult,
  validateGatewayConfig,
  validateGatewayRequest,
  validateGatewayResponse,
  validateProviderAdapter,
  validateProviderEndpoint,
} from '../../src/gateway/index.js';
import { mockProvider } from '../../tests/fixtures/gateway/mock-provider.js';
import { stats, GREEN, RED, NC, projectRoot } from './utils.js';

function pass(message) {
  console.log(`  ${GREEN}[ok]${NC} ${message}`);
  stats.pass++;
}

function fail(message) {
  console.error(`  ${RED}[x]${NC} ${message}`);
  stats.fail++;
}

function readJson(relPath) {
  return JSON.parse(readFileSync(join(projectRoot, relPath), 'utf8'));
}

function checkFilesExist(paths, label) {
  const missing = paths.filter((relPath) => !existsSync(join(projectRoot, relPath)));
  if (missing.length === 0) {
    pass(label);
  } else {
    fail(`${label}: missing ${missing.join(', ')}`);
  }
}

function checkJsonFilesParse(paths, label) {
  try {
    for (const relPath of paths) {
      readJson(relPath);
    }
    pass(label);
  } catch (error) {
    fail(`${label}: ${error.message}`);
  }
}

function checkNoNetworkPrimitives(relDir, label) {
  const root = join(projectRoot, relDir);
  const matches = [];
  const blocked = /\bfetch\s*\(|https\.request|http\.request|createServer\s*\(|\.listen\s*\(/;

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const content = readFileSync(fullPath, 'utf8');
        if (blocked.test(content)) {
          matches.push(fullPath.replace(projectRoot, '').replace(/^[/\\]/, ''));
        }
      }
    }
  }

  walk(root);
  if (matches.length === 0) {
    pass(label);
  } else {
    fail(`${label}: ${matches.join(', ')}`);
  }
}

export function checkGatewayContracts() {
  console.log('\nGateway Protocol Contract Verification:');

  const sourceFiles = [
    'src/gateway/protocol/constants.js',
    'src/gateway/protocol/validation.js',
    'src/gateway/protocol/normalize.js',
    'src/gateway/protocol/errors.js',
    'src/gateway/contracts/gateway-request.js',
    'src/gateway/contracts/gateway-response.js',
    'src/gateway/contracts/provider-adapter.js',
    'src/gateway/contracts/routing-request.js',
    'src/gateway/contracts/route-decision.js',
    'src/gateway/contracts/usage.js',
    'src/gateway/contracts/execution-request.js',
    'src/gateway/contracts/execution-result.js',
    'src/gateway/contracts/credential-ref.js',
    'src/gateway/contracts/provider-endpoint.js',
    'src/gateway/contracts/config.js',
    'src/gateway/index.js',
  ];
  const schemaFiles = [
    '.ai/schema/gateway-request.schema.json',
    '.ai/schema/gateway-response.schema.json',
    '.ai/schema/provider-adapter.schema.json',
    '.ai/schema/routing-request.schema.json',
    '.ai/schema/route-decision.schema.json',
    '.ai/schema/gateway-error.schema.json',
    '.ai/schema/gateway-config.schema.json',
    '.ai/schema/gateway-usage.schema.json',
  ];
  const fixtureFiles = [
    'tests/fixtures/gateway/valid-chat-request.json',
    'tests/fixtures/gateway/invalid-chat-request.json',
    'tests/fixtures/gateway/valid-chat-response.json',
    'tests/fixtures/gateway/valid-routing-request.json',
    'tests/fixtures/gateway/valid-route-decision.json',
    'tests/fixtures/gateway/normalized-errors.json',
    'tests/fixtures/gateway/valid-execution-request.json',
    'tests/fixtures/gateway/valid-execution-result.json',
    'tests/fixtures/gateway/invalid-execution-request.json',
    'tests/fixtures/gateway/valid-credential-ref.json',
    'tests/fixtures/gateway/valid-provider-endpoint.json',
  ];

  checkFilesExist(sourceFiles, 'Gateway contract source files exist');
  checkJsonFilesParse(schemaFiles, 'Gateway schemas parse');
  checkJsonFilesParse(fixtureFiles, 'Gateway fixtures parse');

  const requestResult = validateGatewayRequest(readJson('tests/fixtures/gateway/valid-chat-request.json'));
  if (requestResult.success) {
    pass('Gateway request validator accepts valid fixture');
  } else {
    fail(`Gateway request validator accepts valid fixture: ${requestResult.errors.map((error) => error.message).join('; ')}`);
  }

  const response = createChatCompletionResponse({
    id: 'chatcmpl-verify',
    request_id: 'req-verify',
    provider_id: 'mock-provider',
    model_id: 'mock-chat',
    message: {
      role: 'assistant',
      content: 'ok',
    },
    created: 1800000000,
  });
  const responseResult = validateGatewayResponse(response);
  if (responseResult.success) {
    pass('Gateway response validator accepts normalized response');
  } else {
    fail(`Gateway response validator accepts normalized response: ${responseResult.errors.map((error) => error.message).join('; ')}`);
  }

  const adapterResult = validateProviderAdapter(mockProvider);
  if (adapterResult.success) {
    pass('Provider adapter interface validates');
  } else {
    fail(`Provider adapter interface validates: ${adapterResult.errors.map((error) => error.message).join('; ')}`);
  }

  const mockProviderSource = readFileSync(join(projectRoot, 'tests/fixtures/gateway/mock-provider.js'), 'utf8');
  if (!/\bfetch\s*\(|https\.request|http\.request|createServer\s*\(|\.listen\s*\(/.test(mockProviderSource)) {
    pass('Mock provider contains no network imports or calls');
  } else {
    fail('Mock provider contains network primitives');
  }

  const configResult = validateGatewayConfig(DEFAULT_GATEWAY_CONFIG);
  if (configResult.success && DEFAULT_GATEWAY_CONFIG.host === '127.0.0.1') {
    pass('Gateway defaults bind to localhost');
  } else {
    fail('Gateway defaults bind to localhost');
  }

  if (DEFAULT_GATEWAY_CONFIG.redact_prompts === true) {
    pass('Prompt redaction defaults to enabled');
  } else {
    fail('Prompt redaction defaults to enabled');
  }

  checkNoNetworkPrimitives('src/gateway/protocol', 'No provider API calls exist in gateway protocol modules');
  checkNoNetworkPrimitives('src/gateway/contracts', 'No provider API calls exist in gateway contract modules');

  const packageJson = readJson('package.json');
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
    pass('No runtime dependencies added for gateway contracts');
  } else {
    fail('Runtime dependencies were added');
  }

  // Sprint A: Execution contract validators
  const credRef = createCredentialRef({ env_var: 'OPENAI_API_KEY' });
  const credResult = validateCredentialRef(credRef);
  if (credResult.success) {
    pass('Credential reference validator accepts valid ref');
  } else {
    fail(`Credential reference validator: ${credResult.errors.map((e) => e.message).join('; ')}`);
  }

  const endpoint = createProviderEndpoint({ url: 'https://api.openai.com/v1/chat/completions' });
  const endpointResult = validateProviderEndpoint(endpoint);
  if (endpointResult.success) {
    pass('Provider endpoint validator accepts valid HTTPS endpoint');
  } else {
    fail(`Provider endpoint validator: ${endpointResult.errors.map((e) => e.message).join('; ')}`);
  }

  const httpEndpointResult = validateProviderEndpoint({ url: 'http://insecure.example.com', follow_redirects: false, ssrf_check_required: true });
  if (!httpEndpointResult.success) {
    pass('Provider endpoint validator rejects HTTP endpoints');
  } else {
    fail('Provider endpoint validator should reject HTTP endpoints');
  }

  const execReq = readJson('tests/fixtures/gateway/valid-execution-request.json');
  const execReqResult = validateExecutionRequest(execReq);
  if (execReqResult.success) {
    pass('Execution request validator accepts valid fixture');
  } else {
    fail(`Execution request validator: ${execReqResult.errors.map((e) => e.message).join('; ')}`);
  }

  const execRes = readJson('tests/fixtures/gateway/valid-execution-result.json');
  const execResResult = validateExecutionResult(execRes);
  if (execResResult.success) {
    pass('Execution result validator accepts valid fixture');
  } else {
    fail(`Execution result validator: ${execResResult.errors.map((e) => e.message).join('; ')}`);
  }

  const pendingResult = createExecutionResult({ request_id: 'r', provider_id: 'p', model_id: 'm' });
  if (pendingResult.redacted === true) {
    pass('Execution results are always marked redacted');
  } else {
    fail('Execution results must always be marked redacted');
  }

  if (EXECUTION_DEFAULTS.follow_redirects === false && EXECUTION_DEFAULTS.ssrf_check_required === true) {
    pass('Execution defaults enforce no-redirect and SSRF check');
  } else {
    fail('Execution defaults must enforce no-redirect and SSRF check');
  }

  const invalidExecReq = readJson('tests/fixtures/gateway/invalid-execution-request.json');
  const invalidExecReqResult = validateExecutionRequest(invalidExecReq);
  if (!invalidExecReqResult.success && invalidExecReqResult.errors.length >= 3) {
    pass('Execution request validator rejects invalid fixture with multiple errors');
  } else {
    fail('Execution request validator should reject invalid fixture');
  }
}
