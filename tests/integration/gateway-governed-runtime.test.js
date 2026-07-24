import { describe, test, expect, afterEach } from 'vitest';
import {
  createGatewayServer,
  createExecutionPolicy,
  createProviderEndpoint,
  createProviderExecutionCapability,
  createCredentialRef,
  createExecutionDispatcher,
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

  test('safe route decision output contains no executable or private fields', () => {
    const dispatcher = createExecutionDispatcher({
      enabled: true,
      transport: { execute: async () => ({}) },
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
    expect(route.environment).toBeUndefined();
    expect(route.provider_adapter).toBeUndefined();
    expect(route.endpoint).toBeUndefined();
    expect(route.policy).toBeUndefined();
    expect(route.credential_ref).toBeUndefined();
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

    expect(() => {
      createGatewayServer({
        governed_execution: {
          enabled: true,
          transport: { execute: async () => ({}) },
          providers: {
            openai: {
              provider_adapter: { ...validAdapter, id: 'different-id' },
              endpoint: validEndpoint,
              policy: validPolicy,
              capability: validCapability,
              credential_ref: validCredentialRef,
            },
          },
        },
      });
    }).toThrow();
  });

  test('model alias maps to trusted upstream model and replaces gateway request model', async () => {
    let capturedPayload = null;
    let capturedModelId = null;

    const fakeTransport = {
      execute: async ({ payload }) => {
        capturedPayload = payload;
        capturedModelId = payload.model;
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
    expect(capturedModelId).toBe('gpt-4o');
    expect(capturedPayload.model).toBe('gpt-4o');
    expect(json.model).toBe('gpt-4o');
  });

  test('malformed/oversized request ID is sanitized and replaced with generated UUID', async () => {
    serverInstance = createGatewayServer({ config: { port: 0 } });
    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    // Oversized & path-like ID
    const resBadId = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': '../evil/path/' + 'a'.repeat(200) },
      body: JSON.stringify({ model: 'mock-chat', messages: [{ role: 'user', content: 'Hi' }] }),
    });

    expect(resBadId.status).toBe(200);
    const returnedId = resBadId.headers.get('x-request-id');
    expect(returnedId).not.toBeNull();
    expect(returnedId).not.includes('evil');
    expect(returnedId.length).toBeLessThanOrEqual(128);
  });

  test('governed runtime timeout returns HTTP 504 timeout and destroys credential', async () => {
    let capturedCred = null;
    const slowTransport = {
      execute: async ({ credential, signal }) => {
        capturedCred = credential;
        return new Promise((resolve, reject) => {
          const t = setTimeout(() => resolve({}), 5000);
          signal?.addEventListener('abort', () => {
            clearTimeout(t);
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      },
    };

    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
        enabled: true,
        transport: slowTransport,
        environment: { OPENAI_API_KEY: 'sk-timeout-key' },
        providers: {
          openai: {
            provider_adapter: validAdapter,
            endpoint: validEndpoint,
            policy: createExecutionPolicy({ ...validPolicy, request_timeout_ms: 100 }),
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

    expect(res.status).toBe(504);
    const json = await res.json();
    expect(json.error.code).toBe('timeout');
    expect(capturedCred.destroyed).toBe(true);
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
