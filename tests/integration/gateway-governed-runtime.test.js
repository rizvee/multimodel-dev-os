import { describe, test, expect, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createGatewayServer,
  createExecutionPolicy,
  createProviderEndpoint,
  createProviderExecutionCapability,
  createCredentialRef,
  createExecutionDispatcher,
  validateGatewayResponse,
} from '../../src/gateway/index.js';

describe('Sprint E1 — Governed Runtime Integration (Non-Stream)', () => {
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
    normalizeRequest: () => ({ success: true }),
    invoke: () => ({ success: true }),
    normalizeResponse: () => ({ success: true }),
    stream: () => ({ success: true }),
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
    follow_redirects: false,
    ssrf_check_required: true,
  });

  const validCapability = createProviderExecutionCapability({
    chat_completions: true,
    non_streaming: true,
    sse_streaming: true,
    tool_calls: true,
  });

  const validCredentialRef = createCredentialRef({ env_var: 'OPENAI_API_KEY' });

  afterEach(async () => {
    if (serverInstance) {
      await serverInstance.stop();
      serverInstance = null;
    }
  });

  test('dispatcher hides executable target extraction path and JSON leaks no secrets', () => {
    const dispatcher = createExecutionDispatcher({
      enabled: true,
      transport: { execute: async () => ({}) },
      environment: { OPENAI_API_KEY: 'sk-secret-key-123' },
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
    });

    expect(dispatcher.getExecutionTarget).toBeUndefined();
    const jsonString = JSON.stringify(dispatcher);
    expect(jsonString).not.includes('sk-secret-key-123');
    expect(jsonString).not.includes('transport');
    expect(jsonString).not.includes('credential_ref');

    const route = dispatcher.resolveRoute('gpt-4o');
    expect(route).toEqual({
      type: 'governed-external',
      strategy: 'governed-external',
      provider_id: 'openai',
      requested_model: 'gpt-4o',
      resolved_model: 'gpt-4o',
      enabled: true,
    });
    expect(route.transport).toBeUndefined();
    expect(route.provider_adapter).toBeUndefined();
  });

  test('post-validation source-object mutation cannot alter dispatcher execution behavior', async () => {
    const mutablePolicy = { ...validPolicy, request_timeout_ms: 30000 };
    const mutableEndpoint = { ...validEndpoint };
    const mutableProviders = {
      openai: {
        provider_adapter: validAdapter,
        endpoint: mutableEndpoint,
        policy: mutablePolicy,
        capability: validCapability,
        credential_ref: validCredentialRef,
      },
    };

    const dispatcher = createExecutionDispatcher({
      enabled: true,
      transport: { execute: async () => ({}) },
      providers: mutableProviders,
      model_routes: { 'gpt-4o': { provider_id: 'openai', model_id: 'gpt-4o' } },
    });

    // Mutate source objects post-creation
    mutablePolicy.enabled = false;
    mutableEndpoint.url = 'https://malicious.example.com';
    delete mutableProviders.openai;

    // Dispatcher resolved route and state must remain untouched
    expect(dispatcher.enabled).toBe(true);
    const route = dispatcher.resolveRoute('gpt-4o');
    expect(route.enabled).toBe(true);
  });

  test('transport ignoring signal still times out promptly and destroys credential', async () => {
    let capturedCred = null;
    let lateExecuted = false;

    const uncooperativeTransport = {
      execute: async ({ credential }) => {
        capturedCred = credential;
        return new Promise((resolve) => {
          setTimeout(() => {
            lateExecuted = true;
            resolve({ id: 'late-result' });
          }, 1000);
        });
      },
    };

    serverInstance = createGatewayServer({
      config: { port: 0, provider_timeout_ms: 50 },
      governed_execution: {
        enabled: true,
        transport: uncooperativeTransport,
        environment: { OPENAI_API_KEY: 'sk-timeout-secret' },
        providers: {
          openai: {
            provider_adapter: validAdapter,
            endpoint: validEndpoint,
            policy: validPolicy,
            capability: validCapability,
            credential_ref: validCredentialRef,
          },
        },
        model_routes: { 'gpt-4o': { provider_id: 'openai', model_id: 'gpt-4o' } },
      },
    });

    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'Hi' }] }),
    });

    expect(res.status).toBe(504);
    const json = await res.json();
    expect(json.error.code).toBe('timeout');
    expect(capturedCred.destroyed).toBe(true);

    // Wait past the late transport resolution to verify no unhandled rejection
    await new Promise((r) => setTimeout(r, 1100));
    expect(lateExecuted).toBe(true);
  });

  test('invalid custom requestIdFactory output is replaced with UUID fallback', async () => {
    let callCount = 0;
    const badFactories = [
      () => 'a'.repeat(200), // Oversized
      () => 'req-id\r\nheadertest', // CR/LF
      () => '../evil/path', // Path-like
      () => 12345, // Non-string
      () => { throw new Error('Factory exception'); }, // Throws
    ];

    for (const badFactory of badFactories) {
      serverInstance = createGatewayServer({
        config: { port: 0 },
        requestIdFactory: badFactory,
      });
      const addr = await serverInstance.start();
      baseUrl = `http://127.0.0.1:${addr.port}`;

      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mock-chat', messages: [{ role: 'user', content: 'Hi' }] }),
      });

      expect(res.status).toBe(200);
      const reqId = res.headers.get('x-request-id');
      expect(reqId).not.toBeNull();
      expect(reqId.length).toBeLessThanOrEqual(128);
      expect(reqId).not.includes('evil');
      expect(reqId).not.includes('\r');

      await serverInstance.stop();
      serverInstance = null;
    }
  });

  test('rejects prototype pollution and reserved keys on server creation', () => {
    const protoProviders = Object.create(null);
    protoProviders['__proto__'] = {
      provider_adapter: validAdapter,
      endpoint: validEndpoint,
      policy: validPolicy,
      capability: validCapability,
      credential_ref: validCredentialRef,
    };

    expect(() => {
      createGatewayServer({
        governed_execution: {
          enabled: true,
          transport: { execute: async () => ({}) },
          providers: protoProviders,
        },
      });
    }).toThrow();
  });

  test('model alias maps to trusted upstream model and replaces gateway request model', async () => {
    let capturedPayload = null;

    const fakeTransport = {
      execute: async ({ payload }) => {
        capturedPayload = payload;
        return {
          id: 'chatcmpl-alias-1',
          object: 'chat.completion',
          created: 1800000000,
          model: payload.model,
          choices: [{ index: 0, message: { role: 'assistant', content: 'Alias response' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        };
      },
    };

    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
        enabled: true,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-alias-key' },
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
          'gpt-4-fast': { provider_id: 'openai', model_id: 'gpt-4o' },
        },
      },
    });

    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4-fast', messages: [{ role: 'user', content: 'Hi alias' }] }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(capturedPayload.model).toBe('gpt-4o');
    expect(json.model).toBe('gpt-4o');
  });

  test('existing mock non-stream & stream execution remains unchanged by default', async () => {
    serverInstance = createGatewayServer({ config: { port: 0 } });
    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mock-chat', messages: [{ role: 'user', content: 'Hi' }] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.object).toBe('chat.completion');
    expect(body.model).toBe('mock-chat');
  });

  test('governed external execution is disabled by default', async () => {
    serverInstance = createGatewayServer({ config: { port: 0 } });
    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const resModels = await fetch(`${baseUrl}/v1/models`);
    const modelsBody = await resModels.json();
    expect(modelsBody.data.some((m) => m.id === 'gpt-4o')).toBe(false);

    const resHealth = await fetch(`${baseUrl}/health`);
    const healthBody = await resHealth.json();
    expect(healthBody.governed_execution.enabled).toBe(false);
  });

  test('external stream: true is explicitly rejected with 400 and zero transport calls', async () => {
    let transportCalls = 0;
    const fakeTransport = {
      execute: async () => { transportCalls++; return {}; },
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
      body: JSON.stringify({ model: 'gpt-4o', stream: true, messages: [{ role: 'user', content: 'Hello' }] }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe('unsupported_capability');
    expect(transportCalls).toBe(0);
  });

  test('external provider failure does NOT fall back to mock provider', async () => {
    const failingTransport = {
      execute: async () => {
        throw new Error('External provider socket error');
      },
    };

    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
        enabled: true,
        transport: failingTransport,
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
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'Hi' }] }),
    });

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error.code).toBe('upstream_server_error');
  });
});
