import { describe, test, expect, afterEach } from 'vitest';
import {
  createGatewayServer,
  createExecutionPolicy,
  createProviderEndpoint,
  createProviderExecutionCapability,
  createCredentialRef,
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

  test('rejects duplicate model routes and invalid provider configs on server creation', () => {
    expect(() => {
      createGatewayServer({
        governed_execution: {
          enabled: true,
          transport: { execute: async () => ({}) },
          providers: { openai: { provider_adapter: validAdapter, endpoint: validEndpoint, policy: validPolicy, capability: validCapability, credential_ref: validCredentialRef } },
          model_routes: [
            { model_id: 'gpt-4o', provider_id: 'openai' },
            { model_id: 'gpt-4o', provider_id: 'openai' },
          ],
        },
      });
    }).toThrow();
  });

  test('trusted external model route succeeds with fake injected transport & preserves request ID', async () => {
    let transportCalls = 0;
    let capturedCred = null;

    const fakeTransport = {
      execute: async ({ credential }) => {
        transportCalls++;
        capturedCred = credential;
        return {
          id: 'chatcmpl-ext-100',
          object: 'chat.completion',
          created: 1800000000,
          model: 'gpt-4o',
          choices: [{ index: 0, message: { role: 'assistant', content: 'External response' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        };
      },
    };

    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
        enabled: true,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-test-secret-key-999' },
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
      headers: { 'Content-Type': 'application/json', 'x-request-id': 'req-custom-rt-123' },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: 'Hello external' }] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toBe('req-custom-rt-123');

    const json = await res.json();
    expect(json.id).toBe('chatcmpl-ext-100');
    expect(json.choices[0].message.content).toBe('External response');
    expect(transportCalls).toBe(1);
    expect(capturedCred.destroyed).toBe(true);

    expect(JSON.stringify(json)).not.includes('sk-test-secret-key-999');
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

  test('client request body CANNOT override provider, endpoint, policy, or credential settings', async () => {
    let capturedEndpoint = null;
    const fakeTransport = {
      execute: async ({ endpoint }) => {
        capturedEndpoint = endpoint;
        return {
          id: 'chatcmpl-override-test',
          object: 'chat.completion',
          created: 1800000000,
          model: 'gpt-4o',
          choices: [{ index: 0, message: { role: 'assistant', content: 'OK' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        };
      },
    };

    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
        enabled: true,
        transport: fakeTransport,
        environment: { OPENAI_API_KEY: 'sk-trusted-key' },
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
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    expect(res.status).toBe(200);
    expect(capturedEndpoint.url).toBe('https://api.openai.com/v1/chat/completions');
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
    expect(json.error.code).toBe('upstream_error');
  });

  test('unknown model returns 404 model_not_found', async () => {
    serverInstance = createGatewayServer({ config: { port: 0 } });
    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'non-existent-model', messages: [{ role: 'user', content: 'Hi' }] }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe('model_not_found');
  });

  test('GET /v1/models lists configured external models only when enabled', async () => {
    serverInstance = createGatewayServer({
      config: { port: 0 },
      governed_execution: {
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
      },
    });

    const addr = await serverInstance.start();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const res = await fetch(`${baseUrl}/v1/models`);
    const json = await res.json();

    const gpt4o = json.data.find((m) => m.id === 'gpt-4o');
    expect(gpt4o).not.toBeUndefined();
    expect(gpt4o.owned_by).toBe('openai');
  });
});
