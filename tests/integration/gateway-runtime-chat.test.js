import { afterEach, describe, expect, it } from 'vitest';
import { requestJson, startTestGateway } from '../fixtures/gateway-runtime/client.js';
import { validateGatewayResponse } from '../../src/gateway/index.js';

let gateway;

afterEach(async () => {
  if (gateway) await gateway.stop();
  gateway = null;
});

describe('gateway runtime chat integration', () => {
  it('serves deterministic non-streaming mock chat', async () => {
    const started = await startTestGateway();
    gateway = started.gateway;
    const response = await requestJson({
      address: started.address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'mock-chat', messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.status).toBe(200);
    expect(response.json.provider_id).toBe('mock');
    expect(response.json.model).toBe('mock-chat');
    expect(response.json.choices[0].message.content).toBe('mock response');
    expect(response.json.routing.fallback_executed).toBe(false);
    expect(validateGatewayResponse(response.json).success).toBe(true);
  });

  it('supports deterministic mock tool calls', async () => {
    const started = await startTestGateway();
    gateway = started.gateway;
    const response = await requestJson({
      address: started.address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: {
        model: 'mock-tools',
        messages: [{ role: 'user', content: 'tool' }],
        tools: [{ type: 'function', function: { name: 'mock_tool', parameters: {} } }],
      },
    });

    expect(response.status).toBe(200);
    expect(response.json.choices[0].message.tool_calls[0].function.name).toBe('mock_tool');
  });
});
