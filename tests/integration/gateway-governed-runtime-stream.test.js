import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createGatewayServer } from '../../src/gateway/runtime/server.js';
import { createProviderExecutionCapability } from '../../src/gateway/contracts/provider-execution-capability.js';
import { createProviderEndpoint } from '../../src/gateway/contracts/provider-endpoint.js';
import { createExecutionPolicy } from '../../src/gateway/contracts/execution-policy.js';
import { createCredentialRef } from '../../src/gateway/contracts/credential-ref.js';
import { createExecutionRequest } from '../../src/gateway/contracts/execution-request.js';
import { executeGovernedStream } from '../../src/gateway/execution/stream-executor.js';

describe('v4.3 Sprint E2 — Governed External Streaming Integration', () => {
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
    classifyError: () => ({ success: true }),
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
    expect(destroyed).toBe(true);
  });

  test('missing transport.stream returns 500 internal_execution_error when stream: true requested', async () => {
    let executeCalls = 0;
    const nonStreamOnlyTransport = {
      execute: async () => { executeCalls++; return { status: 200, body: '{}' }; },
    };

    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
        enabled: true,
        transport: nonStreamOnlyTransport,
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

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe('internal_error');
    expect(executeCalls).toBe(0);
  });

  test('mid-stream transport error emits safe error SSE event, [DONE], and closes response', async () => {
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
    expect(text).toContain('data: [DONE]\n\n');
    expect(destroyed).toBe(true);
  });

  test('unit executeGovernedStream handles premature EOF and destroys credentials', async () => {
    let destroyed = false;
    let returnCalled = false;

    async function* prematureGenerator() {
      try {
        yield 'data: {"id":"chatcmpl-stream-123","object":"chat.completion.chunk","created":1700000000,"model":"gpt-4o","choices":[{"index":0,"delta":{"content":"part 1"},"finish_reason":null}]}\n\n';
      } finally {
        returnCalled = true;
      }
    }

    const mockTransport = {
      execute: async () => ({ status: 200, body: '{}' }),
      stream: async (input) => {
        const origDestroy = input.credential.destroy.bind(input.credential);
        input.credential.destroy = () => {
          destroyed = true;
          origDestroy();
        };
        return {
          status: 200,
          body: prematureGenerator(),
        };
      },
    };

    const mockRequest = createExecutionRequest({
      request_id: 'test-req-eof',
      provider_id: 'openai',
      model_id: 'gpt-4o',
      gateway_request: { model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hi' }] },
      endpoint: validEndpoint,
      policy: validPolicy,
      capability: validCapability,
      credential_ref: validCredentialRef,
    });

    const streamResult = await executeGovernedStream({
      execution_request: mockRequest,
      provider_adapter: validAdapter,
      transport: mockTransport,
      environment: { OPENAI_API_KEY: 'sk-test' },
      clock: { now: () => Date.now() },
      requestId: 'test-req-eof',
    });

    expect(streamResult.success).toBe(true);
    const chunks = [];
    let thrownError = null;

    try {
      for await (const event of streamResult.session.event_stream) {
        chunks.push(event);
      }
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError.category || thrownError.code).toBe('stream_error');
    expect(chunks.length).toBe(1);
    expect(destroyed).toBe(true);
    expect(returnCalled).toBe(true);
  });
});
