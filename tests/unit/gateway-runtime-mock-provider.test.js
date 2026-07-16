import { describe, expect, it } from 'vitest';
import { createMockGatewayProvider } from '../../src/gateway/index.js';

describe('gateway runtime mock provider', () => {
  it('lists deterministic mock models and returns valid mock response', () => {
    const provider = createMockGatewayProvider();
    const models = provider.listModels();
    const response = provider.invoke({ model: 'mock-chat', messages: [{ role: 'user', content: 'hello' }] }, { request_id: 'req' });

    expect(models.map((model) => model.id)).toEqual(['mock-chat', 'mock-tools', 'mock-stream']);
    expect(response.provider_id).toBe('mock');
    expect(response.choices[0].message.content).toBe('mock response');
  });

  it('supports deterministic stream chunks and error mode', () => {
    const provider = createMockGatewayProvider();
    const chunks = provider.stream({ model: 'mock-stream' }, { request_id: 'req' });
    const error = provider.invoke({ model: 'mock-chat', metadata: { mode: 'error' } }, { request_id: 'req' });

    expect(chunks).toHaveLength(2);
    expect(error.error.code).toBe('upstream_error');
  });
});
