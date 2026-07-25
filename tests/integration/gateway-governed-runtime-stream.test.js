import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createGatewayServer } from '../../src/gateway/runtime/server.js';
import { createProviderExecutionCapability } from '../../src/gateway/contracts/provider-execution-capability.js';
import { createProviderEndpoint } from '../../src/gateway/contracts/provider-endpoint.js';
import { createExecutionPolicy } from '../../src/gateway/contracts/execution-policy.js';
import { createCredentialRef } from '../../src/gateway/contracts/credential-ref.js';
import { createExecutionRequest } from '../../src/gateway/contracts/execution-request.js';
import { validateExecutionError } from '../../src/gateway/contracts/execution-error.js';
import { validateGovernedRuntimeConfig } from '../../src/gateway/runtime/execution-dispatcher.js';
import { executeGovernedStream } from '../../src/gateway/execution/stream-executor.js';

describe('v4.3 Sprint E2 — Governed External Streaming Integration & Hardening', () => {
  let serverInstance = null;
  let baseUrl = '';

  const validAdapter = {
    id: 'openai',
    name: 'OpenAI Provider',
    type: 'openai-compatible',
    version: '1.0.0',
    capabilities: ['chat', 'streaming', 'tools'],
    credential_env: 'OPENAI_API_KEY',
    base_url: 'https://api.openai.com/v1',
    models: ['gpt-4o'],
    validateConfig: () => ({ success: true }),
    listModels: () => [],
    normalizeRequest: (req) => ({
      success: true,
      provider_request: {
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: req.gateway_request?.model, stream: true }),
      },
    }),
    invoke: () => ({ success: true }),
    normalizeResponse: () => ({ success: true }),
    stream: (chunk) => ({
      type: 'chunk',
      gateway_response: chunk,
    }),
    classifyError: (err) => ({ code: 'upstream_server_error', message: err?.message || 'Upstream error' }),
    health: () => ({ success: true }),
    redact: (v) => v,
  };

  const validPolicy = createExecutionPolicy({
    enabled: true,
    allowed_provider_ids: ['openai'],
    require_https: true,
    allow_private_networks: false,
    follow_redirects: false,
    max_attempts: 1,
    request_timeout_ms: 30000,
    response_timeout_ms: 30000,
    max_request_bytes: 1048576,
    max_response_bytes: 5242880,
    retry_enabled: false,
    fallback_enabled: false,
  });

  const validEndpoint = createProviderEndpoint({
    url: 'https://api.openai.com/v1/chat/completions',
    protocol: 'https',
    headers_allowlist: ['content-type', 'authorization'],
    follow_redirects: false,
    ssrf_check_required: true,
  });

  const validCapability = createProviderExecutionCapability({
    chat_completions: true,
    non_streaming: true,
    sse_streaming: true,
    usage_reporting: true,
    tool_calls: true,
  });

  const validCredentialRef = createCredentialRef({
    source: 'environment',
    env_var: 'OPENAI_API_KEY',
    required: true,
  });

  afterEach(async () => {
    if (serverInstance) {
      await serverInstance.stop();
      serverInstance = null;
    }
  });

  test('stream method required during configuration when sse_streaming is true', () => {
    const configWithoutStream = {
      enabled: true,
      transport: { execute: async () => ({ status: 200, body: '{}' }) },
      environment: { OPENAI_API_KEY: 'sk-test' },
      providers: {
        openai: {
          provider_adapter: validAdapter,
          endpoint: validEndpoint,
          policy: validPolicy,
          capability: validCapability,
          credential_ref: validCredentialRef,
        },
      },
      model_routes: {
        'gpt-4o': { provider_id: 'openai', model_id: 'gpt-4o' },
      },
    };

    const val = validateGovernedRuntimeConfig(configWithoutStream);
    expect(val.success).toBe(false);
    expect(val.errors.some(e => e.code === 'invalid_transport')).toBe(true);
  });

  test('successful governed external streaming returns text/event-stream, chunks, terminal [DONE], and destroys credentials', async () => {
    let streamCalls = 0;
    let destroyed = false;

    async function* generateSSE() {
      yield 'data: {"id":"chatcmpl-stream-123","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"Hello "},"finish_reason":null}]}\n\n';
      yield 'data: {"id":"chatcmpl-stream-123","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"world!"},"finish_reason":"stop"}]}\n\n';
      yield 'data: [DONE]\n\n';
    }

    const fakeTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async (input) => {
        streamCalls++;
        const origDestroy = input.credential.destroy.bind(input.credential);
        input.credential.destroy = () => {
          destroyed = true;
          origDestroy();
        };
        return {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
          body: generateSSE(),
        };
      },
    };

    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
        enabled: true,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-test-key-stream' },
        providers: {
          openai: {
            provider_adapter: validAdapter,
            endpoint: validEndpoint,
            policy: validPolicy,
            capability: validCapability,
            credential_ref: validCredentialRef,
          },
        },
        model_routes: {
          'gpt-4o': { provider_id: 'openai', model_id: 'gpt-4o' },
        },
      },
    });

    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const text = await res.text();
    expect(streamCalls).toBe(1);
    expect(text).toContain('data: {"id":"chatcmpl-stream-123"');
    expect(text).toContain('data: [DONE]\n\n');
    expect(text.match(/data: \[DONE\]/g).length).toBe(1);
    expect(destroyed).toBe(true);
  });

  test('mid-stream transport error emits safe error SSE event, NO [DONE], and closes response', async () => {
    let destroyed = false;

    async function* generateFaultySSE() {
      yield 'data: {"id":"chatcmpl-stream-123","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"Chunk 1"},"finish_reason":null}]}\n\n';
      yield 'data: {invalid-json-payload}\n\n';
    }

    const fakeTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async (input) => {
        const origDestroy = input.credential.destroy.bind(input.credential);
        input.credential.destroy = () => {
          destroyed = true;
          origDestroy();
        };
        return {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
          body: generateFaultySSE(),
        };
      },
    };

    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
        enabled: true,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-test-key' },
        providers: {
          openai: {
            provider_adapter: validAdapter,
            endpoint: validEndpoint,
            policy: validPolicy,
            capability: validCapability,
            credential_ref: validCredentialRef,
          },
        },
        model_routes: {
          'gpt-4o': { provider_id: 'openai', model_id: 'gpt-4o' },
        },
      },
    });

    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] }),
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('data: {"id":"chatcmpl-stream-123"');
    expect(text).toContain('data: {"error":');
    expect(text).not.toContain('data: [DONE]\n\n');
    expect(destroyed).toBe(true);
  });

  test('unit executeGovernedStream handles acquisition timeout and destroys credentials', async () => {
    let destroyed = false;
    const slowTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async (input) => {
        const origDestroy = input.credential.destroy.bind(input.credential);
        input.credential.destroy = () => {
          destroyed = true;
          origDestroy();
        };
        await new Promise((r) => setTimeout(r, 100));
        return { status: 200, body: (async function* () { yield 'data: [DONE]\n\n'; })() };
      },
    };

    const mockRequest = createExecutionRequest({
      request_id: 'test-acq-timeout',
      provider_id: 'openai',
      model_id: 'gpt-4o',
      gateway_request: { model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] },
      endpoint: validEndpoint,
      policy: createExecutionPolicy({ ...validPolicy, request_timeout_ms: 20 }),
      capability: validCapability,
      credential_ref: validCredentialRef,
    });

    const result = await executeGovernedStream({
      execution_request: mockRequest,
      provider_adapter: validAdapter,
      transport: slowTransport,
      environment: { OPENAI_API_KEY: 'sk-secret-key-123' },
      clock: () => Date.now(),
      requestId: 'test-acq-timeout',
      runtime_timeout_ms: 20,
    });

    expect(result.success).toBe(false);
    expect(result.error.category).toBe('timeout');
    expect(result.error.message).not.toContain('OPENAI_API_KEY');
    expect(result.error.message).not.toContain('sk-secret-key-123');
    expect(validateExecutionError(result.error).success).toBe(true);
    expect(destroyed).toBe(true);
  });

  test('unit executeGovernedStream handles tool_calls capability denial', async () => {
    const noToolsCapability = createProviderExecutionCapability({
      ...validCapability,
      tool_calls: false,
    });

    async function* toolCallsGenerator() {
      yield 'data: {"id":"chatcmpl-stream-tc","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4o","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"get_weather","arguments":"{}"}}]},"finish_reason":null}]}\n\n';
      yield 'data: [DONE]\n\n';
    }

    const mockTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async () => ({ status: 200, body: toolCallsGenerator() }),
    };

    const mockRequest = createExecutionRequest({
      request_id: 'test-tc-denial',
      provider_id: 'openai',
      model_id: 'gpt-4o',
      gateway_request: { model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] },
      endpoint: validEndpoint,
      policy: validPolicy,
      capability: noToolsCapability,
      credential_ref: validCredentialRef,
    });

    const result = await executeGovernedStream({
      execution_request: mockRequest,
      provider_adapter: validAdapter,
      transport: mockTransport,
      environment: { OPENAI_API_KEY: 'sk-test' },
      clock: () => Date.now(),
      requestId: 'test-tc-denial',
    });

    expect(result.success).toBe(true);

    let thrownError = null;
    try {
      for await (const chunk of result.session.event_stream) {
        // should fail on iteration
      }
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError.code).toBe('unsupported_capability');
    expect(validateExecutionError(thrownError).success).toBe(true);
  });

  test('idempotent cancel on safe stream session', async () => {
    let returnCalled = 0;
    async function* infiniteGen() {
      try {
        while (true) {
          yield 'data: {"id":"1","object":"chat.completion.chunk","created":1,"model":"m","choices":[{"index":0,"delta":{"content":"a"},"finish_reason":null}]}\n\n';
          await new Promise((r) => setTimeout(r, 10));
        }
      } finally {
        returnCalled++;
      }
    }

    const mockTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async () => ({ status: 200, body: infiniteGen() }),
    };

    const mockRequest = createExecutionRequest({
      request_id: 'test-cancel',
      provider_id: 'openai',
      model_id: 'gpt-4o',
      gateway_request: { model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] },
      endpoint: validEndpoint,
      policy: validPolicy,
      capability: validCapability,
      credential_ref: validCredentialRef,
    });

    const result = await executeGovernedStream({
      execution_request: mockRequest,
      provider_adapter: validAdapter,
      transport: mockTransport,
      environment: { OPENAI_API_KEY: 'sk-test' },
      clock: () => Date.now(),
      requestId: 'test-cancel',
    });

    expect(result.success).toBe(true);
    expect(typeof result.session.cancel).toBe('function');
    expect(typeof result.session.getSummary).toBe('function');

    result.session.cancel();
    result.session.cancel(); // idempotent call
    expect(result.session.getSummary().state).toBe('cancelled');
  });

  test('mock provider streaming remains fully compatible and unchanged', async () => {
    serverInstance = createGatewayServer({
      config: { port: 0 },
    });

    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mock-stream', stream: true, messages: [{ role: 'user', content: 'Hi' }] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const text = await res.text();
    expect(text).toContain('data: [DONE]\n\n');
  });

  test('opaque-container secret redaction & upstream error with non-pattern dummy secret sanitized before destroy', async () => {
    let destroyed = false;
    const dummySecret = 'super-custom-secret-xyz-789';

    const secretTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async (input) => {
        const origDestroy = input.credential.destroy.bind(input.credential);
        input.credential.destroy = () => {
          destroyed = true;
          origDestroy();
        };
        return {
          status: 500,
          error: { message: `Upstream error with secret token ${dummySecret}` },
        };
      },
    };

    const mockRequest = createExecutionRequest({
      request_id: 'test-secret-redaction',
      provider_id: 'openai',
      model_id: 'gpt-4o',
      gateway_request: { model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] },
      endpoint: validEndpoint,
      policy: validPolicy,
      capability: validCapability,
      credential_ref: validCredentialRef,
    });

    const result = await executeGovernedStream({
      execution_request: mockRequest,
      provider_adapter: validAdapter,
      transport: secretTransport,
      environment: { OPENAI_API_KEY: dummySecret },
      clock: () => Date.now(),
      requestId: 'test-secret-redaction',
    });

    expect(result.success).toBe(false);
    expect(result.error.message).not.toContain(dummySecret);
    expect(result.error.message).toContain('[REDACTED]');
    expect(destroyed).toBe(true);
  });

  test('unused session expires, destroys credential, and sets completion promise state to timed_out', async () => {
    let destroyed = false;
    async function* slowStream() {
      yield 'data: {"id":"1","object":"chat.completion.chunk","created":1,"model":"m","choices":[{"index":0,"delta":{"content":"a"},"finish_reason":null}]}\n\n';
      await new Promise((r) => setTimeout(r, 2000));
    }

    const mockTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async (input) => {
        const origDestroy = input.credential.destroy.bind(input.credential);
        input.credential.destroy = () => {
          destroyed = true;
          origDestroy();
        };
        return { status: 200, body: slowStream() };
      },
    };

    const mockRequest = createExecutionRequest({
      request_id: 'test-unused-session',
      provider_id: 'openai',
      model_id: 'gpt-4o',
      gateway_request: { model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] },
      endpoint: validEndpoint,
      policy: createExecutionPolicy({ ...validPolicy, request_timeout_ms: 30 }),
      capability: validCapability,
      credential_ref: validCredentialRef,
    });

    const result = await executeGovernedStream({
      execution_request: mockRequest,
      provider_adapter: validAdapter,
      transport: mockTransport,
      environment: { OPENAI_API_KEY: 'sk-test' },
      clock: () => Date.now(),
      requestId: 'test-unused-session',
      runtime_timeout_ms: 30,
    });

    expect(result.success).toBe(true);
    expect(typeof result.session.completion.then).toBe('function');

    const summary = await result.session.completion;
    expect(summary.state).toBe('timed_out');
    expect(destroyed).toBe(true);
  });

  test('cancel after completion is a no-op and does not retroactively alter state', async () => {
    async function* doneStream() {
      yield 'data: {"id":"1","object":"chat.completion.chunk","created":1,"model":"m","choices":[{"index":0,"delta":{"content":"a"},"finish_reason":"stop"}]}\n\n';
      yield 'data: [DONE]\n\n';
    }

    const mockTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async () => ({ status: 200, body: doneStream() }),
    };

    const mockRequest = createExecutionRequest({
      request_id: 'test-cancel-noop',
      provider_id: 'openai',
      model_id: 'gpt-4o',
      gateway_request: { model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] },
      endpoint: validEndpoint,
      policy: validPolicy,
      capability: validCapability,
      credential_ref: validCredentialRef,
    });

    const result = await executeGovernedStream({
      execution_request: mockRequest,
      provider_adapter: validAdapter,
      transport: mockTransport,
      environment: { OPENAI_API_KEY: 'sk-test' },
      clock: () => Date.now(),
      requestId: 'test-cancel-noop',
    });

    expect(result.success).toBe(true);
    for await (const chunk of result.session.event_stream) {
      // consume to end
    }

    const summaryBefore = result.session.getSummary();
    expect(summaryBefore.state).toBe('completed');

    result.session.cancel(); // should be no-op
    const summaryAfter = result.session.getSummary();
    expect(summaryAfter.state).toBe('completed');
  });

  test('SSE parser rejects DONE plus trailing event in the same fragment', async () => {
    async function* trailingDataStream() {
      yield 'data: [DONE]\n\ndata: {"extra":"data"}\n\n';
    }

    const mockTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async () => ({ status: 200, body: trailingDataStream() }),
    };

    const mockRequest = createExecutionRequest({
      request_id: 'test-done-trailing',
      provider_id: 'openai',
      model_id: 'gpt-4o',
      gateway_request: { model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] },
      endpoint: validEndpoint,
      policy: validPolicy,
      capability: validCapability,
      credential_ref: validCredentialRef,
    });

    const result = await executeGovernedStream({
      execution_request: mockRequest,
      provider_adapter: validAdapter,
      transport: mockTransport,
      environment: { OPENAI_API_KEY: 'sk-test' },
      clock: () => Date.now(),
      requestId: 'test-done-trailing',
    });

    expect(result.success).toBe(true);
    let errorThrown = null;
    try {
      for await (const chunk of result.session.event_stream) {
        // consume
      }
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown.code).toBe('stream_error');
  });
});
