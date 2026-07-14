import { describe, expect, it } from 'vitest';
import { validateProviderAdapter } from '../../src/gateway/index.js';
import { mockProvider } from '../fixtures/gateway/mock-provider.js';

describe('provider adapter contract', () => {
  it('validates the deterministic mock provider adapter', () => {
    const result = validateProviderAdapter(mockProvider);

    expect(result.success).toBe(true);
    expect(mockProvider.listModels()).toEqual(mockProvider.listModels());
  });

  it('fails incomplete adapters', () => {
    const result = validateProviderAdapter({
      id: 'incomplete',
      name: 'Incomplete',
      type: 'mock',
    });

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'validateConfig' }),
      expect.objectContaining({ path: 'models' }),
    ]));
  });

  it('keeps mock invocation deterministic and local', () => {
    const request = {
      model: 'mock-chat',
      messages: [{ role: 'user', content: 'hello' }],
    };

    const first = mockProvider.invoke(request, { request_id: 'req-a' });
    const second = mockProvider.invoke(request, { request_id: 'req-a' });

    expect(first).toEqual(second);
    expect(first.provider_id).toBe('mock-provider');
    expect(first.choices[0].message.content).toBe('mock response');
  });

  it('returns predictable stream chunks without opening sockets', () => {
    const chunks = mockProvider.stream({
      model: 'mock-chat',
      messages: [{ role: 'user', content: 'hello' }],
    }, { request_id: 'req-stream' });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].object).toBe('chat.completion.chunk');
    expect(chunks[1].choices[0].finish_reason).toBe('stop');
  });
});
