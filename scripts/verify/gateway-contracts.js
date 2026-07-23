import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  createChatCompletionResponse,
  createCredentialRef,
  createExecutionError,
  createExecutionPolicy,
  createExecutionRequest,
  createExecutionResult,
  createProviderEndpoint,
  createProviderExecutionCapability,
  DEFAULT_GATEWAY_CONFIG,
  EXECUTION_CONTRACT_VERSION,
  EXECUTION_DEFAULTS,
  validateCredentialRef,
  validateExecutionError,
  validateExecutionPolicy,
  validateExecutionRequest,
  validateExecutionResult,
  validateGatewayConfig,
  validateGatewayRequest,
  validateGatewayResponse,
  validateProviderAdapter,
  validateProviderEndpoint,
  validateProviderExecutionCapability,
  normalizeOpenAIExecutionRequest,
  normalizeOpenAIResponse,
  normalizeOpenAIError,
  createOpenAISSEParser,
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
    'src/gateway/contracts/execution-policy.js',
    'src/gateway/contracts/provider-execution-capability.js',
    'src/gateway/contracts/execution-error.js',
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
    '.ai/schema/gateway-execution-request.schema.json',
    '.ai/schema/gateway-execution-result.schema.json',
    '.ai/schema/gateway-credential-reference.schema.json',
    '.ai/schema/gateway-provider-endpoint.schema.json',
    '.ai/schema/gateway-execution-policy.schema.json',
    '.ai/schema/gateway-provider-capability.schema.json',
    '.ai/schema/gateway-execution-error.schema.json',
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
    'tests/fixtures/gateway/valid-execution-policy.json',
    'tests/fixtures/gateway/invalid-execution-policy.json',
    'tests/fixtures/gateway/valid-provider-capability.json',
    'tests/fixtures/gateway/invalid-provider-capability.json',
    'tests/fixtures/gateway/valid-execution-error.json',
    'tests/fixtures/gateway/invalid-execution-error.json',
  ];

  const criticalTestSuites = [
    'tests/unit/execution-contracts.test.js',
    'tests/unit/execution-security.test.js',
    'tests/unit/version-verifier.test.js',
    'tests/unit/gateway-contracts.test.js',
    'tests/unit/prepublish-guard.test.js',
  ];

  checkFilesExist(sourceFiles, 'Gateway contract source files exist');
  checkJsonFilesParse(schemaFiles, 'Gateway schemas parse');
  checkJsonFilesParse(fixtureFiles, 'Gateway fixtures parse');
  checkFilesExist(criticalTestSuites, 'Critical test suite baseline files exist');

  // Verify Sprint A test group names
  const execContractTestContent = readFileSync(join(projectRoot, 'tests/unit/execution-contracts.test.js'), 'utf8');
  const requiredExecContractGroups = [
    'execution contracts',
    'credential reference',
    'provider endpoint',
    'execution policy',
    'provider execution capability',
    'normalized execution error',
    'execution request',
    'execution result',
  ];
  let execGroupsPresent = true;
  for (const group of requiredExecContractGroups) {
    if (!execContractTestContent.includes(group)) {
      execGroupsPresent = false;
      fail(`execution-contracts.test.js missing required test group: ${group}`);
    }
  }
  if (execGroupsPresent) {
    pass('execution-contracts.test.js contains all required Sprint A test groups');
  }

  const execSecTestContent = readFileSync(join(projectRoot, 'tests/unit/execution-security.test.js'), 'utf8');
  const requiredSecGroups = [
    'execution security contracts',
    'credential reference security',
    'provider endpoint security',
    'execution result security',
    'recursive sensitive-field and metadata security',
    'execution defaults security',
  ];
  let secGroupsPresent = true;
  for (const group of requiredSecGroups) {
    if (!execSecTestContent.includes(group)) {
      secGroupsPresent = false;
      fail(`execution-security.test.js missing required test group: ${group}`);
    }
  }
  if (secGroupsPresent) {
    pass('execution-security.test.js contains all required security test groups');
  }

  // Verify JSON Schema unique IDs
  const schemaIds = new Set();
  let schemaIdsValid = true;
  for (const schemaPath of schemaFiles) {
    const json = readJson(schemaPath);
    if (!json.$id || typeof json.$id !== 'string' || !json.$id.startsWith('mmdo.')) {
      schemaIdsValid = false;
      fail(`Schema ${schemaPath} lacks valid mmdo. $id`);
    } else {
      if (schemaIds.has(json.$id)) {
        schemaIdsValid = false;
        fail(`Duplicate schema $id: ${json.$id}`);
      }
      schemaIds.add(json.$id);
    }
  }
  if (schemaIdsValid) {
    pass('Gateway JSON Schemas have unique mmdo. $id identifiers');
  }

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

  const httpEndpointResult = validateProviderEndpoint({
    contract_version: EXECUTION_CONTRACT_VERSION,
    url: 'http://insecure.example.com',
    protocol: 'https',
    follow_redirects: false,
    ssrf_check_required: true,
  });
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

  const policyReq = readJson('tests/fixtures/gateway/valid-execution-policy.json');
  const policyResult = validateExecutionPolicy(policyReq);
  if (policyResult.success) {
    pass('Execution policy validator accepts valid fixture');
  } else {
    fail(`Execution policy validator: ${policyResult.errors.map((e) => e.message).join('; ')}`);
  }

  const invalidPolicyReq = readJson('tests/fixtures/gateway/invalid-execution-policy.json');
  const invalidPolicyResult = validateExecutionPolicy(invalidPolicyReq);
  if (!invalidPolicyResult.success) {
    pass('Execution policy validator rejects invalid fixture');
  } else {
    fail('Execution policy validator should reject invalid fixture');
  }

  const capReq = readJson('tests/fixtures/gateway/valid-provider-capability.json');
  const capResult = validateProviderExecutionCapability(capReq);
  if (capResult.success) {
    pass('Provider execution capability validator accepts valid fixture');
  } else {
    fail(`Provider execution capability validator: ${capResult.errors.map((e) => e.message).join('; ')}`);
  }

  const errReq = readJson('tests/fixtures/gateway/valid-execution-error.json');
  const errResult = validateExecutionError(errReq);
  if (errResult.success) {
    pass('Execution error validator accepts valid fixture');
  } else {
    fail(`Execution error validator: ${errResult.errors.map((e) => e.message).join('; ')}`);
  }

  const forcedRedactedResult = createExecutionResult({ redacted: false });
  if (forcedRedactedResult.redacted === true) {
    pass('Execution results factory forces redacted: true invariant');
  } else {
    fail('Execution results factory must force redacted: true invariant');
  }

  if (EXECUTION_DEFAULTS.follow_redirects === false && EXECUTION_DEFAULTS.ssrf_check_required === true) {
    pass('Execution defaults enforce no-redirect and SSRF check');
  } else {
    fail('Execution defaults must enforce no-redirect and SSRF check');
  }

  const invalidExecReq = readJson('tests/fixtures/gateway/invalid-execution-request.json');
  const invalidExecReqResult = validateExecutionRequest(invalidExecReq);
  if (!invalidExecReqResult.success) {
    pass('Execution request validator rejects invalid fixture');
  } else {
    fail('Execution request validator should reject invalid fixture');
  }

  // Sprint B: Generic OpenAI-compatible Adapter Normalization Core
  console.log('\nOpenAI-Compatible Adapter Normalization Verification:');

  const adapterSourceFiles = [
    'src/gateway/adapters/openai-compatible/request.js',
    'src/gateway/adapters/openai-compatible/response.js',
    'src/gateway/adapters/openai-compatible/error.js',
    'src/gateway/adapters/openai-compatible/sse.js',
    'src/gateway/adapters/openai-compatible/index.js',
  ];
  const adapterFixtureFiles = [
    'tests/fixtures/gateway/adapters/openai-compatible/valid-non-stream-request.json',
    'tests/fixtures/gateway/adapters/openai-compatible/valid-stream-request.json',
    'tests/fixtures/gateway/adapters/openai-compatible/normal-response.json',
    'tests/fixtures/gateway/adapters/openai-compatible/tool-call-response.json',
    'tests/fixtures/gateway/adapters/openai-compatible/provider-reported-usage.json',
    'tests/fixtures/gateway/adapters/openai-compatible/error-400-invalid.json',
    'tests/fixtures/gateway/adapters/openai-compatible/error-401-auth.json',
    'tests/fixtures/gateway/adapters/openai-compatible/error-429-rate-limit.json',
    'tests/fixtures/gateway/adapters/openai-compatible/error-429-quota.json',
    'tests/fixtures/gateway/adapters/openai-compatible/error-500-server.json',
    'tests/fixtures/gateway/adapters/openai-compatible/error-secret-bearing.json',
    'tests/fixtures/gateway/adapters/openai-compatible/sse-normal-sequence.txt',
    'tests/fixtures/gateway/adapters/openai-compatible/sse-fragmented-sequence.txt',
    'tests/fixtures/gateway/adapters/openai-compatible/sse-multiple-events.txt',
    'tests/fixtures/gateway/adapters/openai-compatible/sse-done.txt',
    'tests/fixtures/gateway/adapters/openai-compatible/sse-malformed-json.txt',
    'tests/fixtures/gateway/adapters/openai-compatible/sse-oversized-event.txt',
    'tests/fixtures/gateway/adapters/openai-compatible/unsupported-streaming-request.json',
    'tests/fixtures/gateway/adapters/openai-compatible/unsupported-tool-calls-request.json',
  ];

  checkFilesExist(adapterSourceFiles, 'OpenAI adapter source files exist');
  checkFilesExist(adapterFixtureFiles, 'OpenAI adapter fixture files exist');
  checkNoNetworkPrimitives('src/gateway/adapters/openai-compatible', 'No network primitives in OpenAI adapter modules');

  const openAIReqFixture = readJson('tests/fixtures/gateway/adapters/openai-compatible/valid-non-stream-request.json');
  const openAIReqResult = normalizeOpenAIExecutionRequest(openAIReqFixture);
  if (openAIReqResult.success && openAIReqResult.payload && openAIReqResult.payload.model === 'gpt-4o') {
    pass('OpenAI request normalizer converts execution request into valid payload');
  } else {
    fail('OpenAI request normalizer failed on valid fixture');
  }

  const openAIRespFixture = readJson('tests/fixtures/gateway/adapters/openai-compatible/normal-response.json');
  const openAIRespResult = normalizeOpenAIResponse(openAIRespFixture, { request_id: 'verify-1' });
  if (openAIRespResult.success && openAIRespResult.gateway_response && openAIRespResult.gateway_response.usage.provider_reported === true) {
    pass('OpenAI response normalizer converts completion response with reported usage');
  } else {
    fail('OpenAI response normalizer failed on valid fixture');
  }

  const openAIErrFixture = readJson('tests/fixtures/gateway/adapters/openai-compatible/error-secret-bearing.json');
  const openAIErrResult = normalizeOpenAIError(openAIErrFixture);
  if (openAIErrResult.redacted === true && !openAIErrResult.message.includes('sk-proj')) {
    pass('OpenAI error normalizer redacts sensitive tokens and local paths');
  } else {
    fail('OpenAI error normalizer must redact sensitive values');
  }

  const sseParser = createOpenAISSEParser({ max_buffer_size: 100 });
  const sseEvents = sseParser.feed('data: ' + 'x'.repeat(150));
  if (sseEvents.length === 1 && sseEvents[0].type === 'error' && sseEvents[0].error.code === 'stream_error') {
    pass('OpenAI SSE parser enforces buffer bounds');
  } else {
    fail('OpenAI SSE parser must enforce buffer bounds');
  }
}
}
