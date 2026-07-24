import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  EXECUTION_CONTRACT_VERSION,
  EXECUTION_ERROR_CATEGORIES,
  EXECUTION_REQUEST_REQUIRED_FIELDS,
  EXECUTION_RESULT_REQUIRED_FIELDS,
  EXECUTION_ERROR_REQUIRED_FIELDS,
} from '../../src/gateway/protocol/constants.js';
import {
  validateExecutionRequest,
  validateExecutionResult,
  validateExecutionError,
} from '../../src/gateway/protocol/validation.js';
import { createExecutionResult } from '../../src/gateway/contracts/execution-result.js';
import { createExecutionError } from '../../src/gateway/contracts/execution-error.js';
import {
  normalizeOpenAIExecutionRequest,
  normalizeOpenAIResponse,
  normalizeOpenAIError,
  createOpenAISSEParser,
} from '../../src/gateway/adapters/openai-compatible/index.js';

const projectRoot = process.cwd();

function pass(label) {
  console.log(`  [ok] ${label}`);
}

function fail(label) {
  console.error(`  [FAIL] ${label}`);
  process.exit(1);
}

function readJson(relPath) {
  const fullPath = join(projectRoot, relPath);
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

function checkFilesExist(files, label) {
  const missing = [];
  for (const relPath of files) {
    const fullPath = join(projectRoot, relPath);
    if (!existsSync(fullPath)) {
      missing.push(relPath);
    }
  }
  if (missing.length === 0) {
    pass(label);
  } else {
    fail(`${label}: missing ${missing.join(', ')}`);
  }
}

function checkJsonSchemasParse(schemaFiles, label) {
  try {
    for (const relPath of schemaFiles) {
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

function checkNoAmbientTimePrimitives(relDir, label) {
  const root = join(projectRoot, relDir);
  const matches = [];
  const blocked = /Date\.now|new\s+Date/;

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
    'src/gateway/contracts/credential-ref.js',
    'src/gateway/contracts/provider-endpoint.js',
    'src/gateway/contracts/execution-policy.js',
    'src/gateway/contracts/provider-execution-capability.js',
    'src/gateway/contracts/execution-request.js',
    'src/gateway/contracts/execution-result.js',
    'src/gateway/contracts/execution-error.js',
  ];

  const schemaFiles = [
    '.ai/schema/gateway-credential-reference.schema.json',
    '.ai/schema/gateway-provider-endpoint.schema.json',
    '.ai/schema/gateway-execution-policy.schema.json',
    '.ai/schema/gateway-provider-capability.schema.json',
    '.ai/schema/gateway-execution-request.schema.json',
    '.ai/schema/gateway-execution-result.schema.json',
    '.ai/schema/gateway-execution-error.schema.json',
  ];

  const fixtureFiles = [
    'tests/fixtures/gateway/valid-credential-ref.json',
    'tests/fixtures/gateway/valid-provider-endpoint.json',
    'tests/fixtures/gateway/valid-execution-policy.json',
    'tests/fixtures/gateway/valid-provider-capability.json',
    'tests/fixtures/gateway/valid-execution-request.json',
    'tests/fixtures/gateway/valid-execution-result.json',
    'tests/fixtures/gateway/valid-execution-error.json',
  ];

  checkFilesExist(sourceFiles, 'Gateway contract source modules exist');
  checkJsonSchemasParse(schemaFiles, 'Gateway formal JSON Schemas parse');
  checkFilesExist(fixtureFiles, 'Gateway contract JSON fixtures exist');
  checkNoNetworkPrimitives('src/gateway/contracts', 'No network primitives in gateway contract modules');

  // Verify contract version alignment
  if (EXECUTION_CONTRACT_VERSION === '2026-07-15.sprint-a') {
    pass('Execution contract version is set to 2026-07-15.sprint-a');
  } else {
    fail(`Execution contract version mismatch: ${EXECUTION_CONTRACT_VERSION}`);
  }

  // Verify category count
  if (EXECUTION_ERROR_CATEGORIES.length >= 20) {
    pass('Execution error taxonomy contains 20+ defined categories');
  } else {
    fail(`Execution error taxonomy underpopulated: ${EXECUTION_ERROR_CATEGORIES.length}`);
  }

  // Schema & contract validation checks
  const validRequest = readJson('tests/fixtures/gateway/valid-execution-request.json');
  const reqResult = validateExecutionRequest(validRequest);
  if (reqResult.success) {
    pass('Valid execution-request fixture validates');
  } else {
    fail(`Valid execution-request fixture failed validation: ${reqResult.errors.map((e) => e.message).join(', ')}`);
  }

  const validResult = readJson('tests/fixtures/gateway/valid-execution-result.json');
  const resResult = validateExecutionResult(validResult);
  if (resResult.success) {
    pass('Valid execution-result fixture validates');
  } else {
    fail(`Valid execution-result fixture failed validation: ${resResult.errors.map((e) => e.message).join(', ')}`);
  }

  const validError = readJson('tests/fixtures/gateway/valid-execution-error.json');
  const errResult = validateExecutionError(validError);
  if (errResult.success) {
    pass('Valid execution-error fixture validates');
  } else {
    fail(`Valid execution-error fixture failed validation: ${errResult.errors.map((e) => e.message).join(', ')}`);
  }

  // Reject additional properties assertion
  const requestWithExtra = { ...validRequest, forbidden_property: 'unauthorized' };
  const extraResult = validateExecutionRequest(requestWithExtra);
  if (!extraResult.success) {
    pass('Validator rejects additionalProperties on execution request');
  } else {
    fail('Validator allowed additionalProperties on execution request');
  }

  // Secure defaults assertion
  const constructedResult = createExecutionResult({
    request_id: 'req-1',
    provider_id: 'p-1',
    model_id: 'm-1',
    state: 'completed',
  });
  if (constructedResult.redacted === true) {
    pass('createExecutionResult enforces redacted: true default');
  } else {
    fail('createExecutionResult failed to enforce redacted: true default');
  }

  const constructedError = createExecutionError({
    code: 'internal_execution_error',
    category: 'internal_execution_error',
    message: 'Test error',
  });
  if (constructedError.redacted === true) {
    pass('createExecutionError enforces redacted: true default');
  } else {
    fail('createExecutionError failed to enforce redacted: true default');
  }

  // Verify mandatory schema fields match validator requirements
  const requestSchema = readJson('.ai/schema/gateway-execution-request.schema.json');
  const requestRequiredMatch = EXECUTION_REQUEST_REQUIRED_FIELDS.every((f) => requestSchema.required.includes(f));

  const resultSchema = readJson('.ai/schema/gateway-execution-result.schema.json');
  const resultRequiredMatch = EXECUTION_RESULT_REQUIRED_FIELDS.every((f) => resultSchema.required.includes(f));

  const errorSchema = readJson('.ai/schema/gateway-execution-error.schema.json');
  const errorRequiredMatch = EXECUTION_ERROR_REQUIRED_FIELDS.every((f) => errorSchema.required.includes(f));

  if (requestRequiredMatch && resultRequiredMatch && errorRequiredMatch) {
    pass('Schema required properties match validator contract constraints');
  } else {
    fail('Schema required properties do not match validator contract constraints');
  }

  // --- OpenAI Adapter Contract Checks ---
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
  checkFilesExist([
    'docs/openai-adapter-normalization.md',
    'tests/unit/adapters/openai-compatible/openai-request-normalization.test.js',
    'tests/unit/adapters/openai-compatible/openai-response-normalization.test.js',
    'tests/unit/adapters/openai-compatible/openai-error-normalization.test.js',
    'tests/unit/adapters/openai-compatible/openai-sse-parser.test.js',
  ], 'OpenAI adapter documentation and test suites exist');

  checkNoNetworkPrimitives('src/gateway/adapters/openai-compatible', 'No network primitives in OpenAI adapter modules');
  checkNoAmbientTimePrimitives('src/gateway/adapters/openai-compatible', 'No Date.now or new Date in OpenAI adapter source');

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

  const pDone = createOpenAISSEParser();
  pDone.feed('data: [DONE]\n\n');
  const errDone = pDone.feed('data: {"content":"extra"}\n\n');
  if (errDone.length === 1 && errDone[0].type === 'error') {
    pass('OpenAI SSE parser enforces terminal DONE state');
  } else {
    fail('OpenAI SSE parser must enforce terminal DONE state');
  }

  const pAccum = createOpenAISSEParser({ max_event_size: 50 });
  pAccum.feed('data: line1\n');
  pAccum.feed('data: line2\n');
  const errAccum = pAccum.feed('data: ' + 'x'.repeat(60) + '\n');
  if (errAccum.length === 1 && errAccum[0].type === 'error') {
    pass('OpenAI SSE parser bounds event line accumulation');
  } else {
    fail('OpenAI SSE parser must bound event line accumulation');
  }
}
