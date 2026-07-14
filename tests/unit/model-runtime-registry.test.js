import { describe, expect, it } from 'vitest';
import { join } from 'path';
import {
  buildGatewayRegistrySnapshot,
  getModel,
  hasModel,
  listModels,
  listModelsByProvider,
} from '../../src/gateway/index.js';

const fixtureRoot = join(process.cwd(), 'tests/fixtures/gateway-registry/valid');

describe('runtime model registry', () => {
  it('normalizes models correctly', () => {
    const result = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });
    const model = getModel(result.value, 'fixture-chat');

    expect(result.success).toBe(true);
    expect(model).toMatchObject({
      id: 'fixture-chat',
      provider_id: 'fixture-openai',
      aliases: ['fixture-chat-latest'],
      context_window: 8192,
      input_cost: null,
      output_cost: null,
      local: false,
    });
    expect(model.capabilities).toEqual(['tools']);
  });

  it('supports model ID, alias, provider, and capability lookups', () => {
    const { value } = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });

    expect(hasModel(value, 'fixture-chat')).toBe(true);
    expect(hasModel(value, 'fixture-chat-latest')).toBe(true);
    expect(getModel(value, 'missing')).toBeNull();
    expect(getModel(value, 'fixture-chat-latest').id).toBe('fixture-chat');
    expect(listModelsByProvider(value, 'fixture-openai').map((model) => model.id)).toEqual(['fixture-chat', 'fixture-vision']);
    expect(listModels(value, { capability: 'vision' }).map((model) => model.id)).toEqual(['fixture-vision']);
  });

  it('fails duplicate models and unknown provider references', () => {
    const duplicate = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/duplicate-model'),
    });
    const unknownProvider = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/unknown-provider'),
    });

    expect(duplicate.success).toBe(false);
    expect(duplicate.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'duplicate_model',
    }));
    expect(unknownProvider.success).toBe(false);
    expect(unknownProvider.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'unknown_provider',
    }));
  });
});
