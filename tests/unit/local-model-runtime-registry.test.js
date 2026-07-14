import { describe, expect, it } from 'vitest';
import { join } from 'path';
import {
  buildGatewayRegistrySnapshot,
  getLocalModel,
  listLocalModels,
} from '../../src/gateway/index.js';

const fixtureRoot = join(process.cwd(), 'tests/fixtures/gateway-registry/valid');

describe('runtime local model registry', () => {
  it('normalizes local models as metadata-only records', () => {
    const result = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });
    const localModel = getLocalModel(result.value, 'ollama:fixture-local-coder');

    expect(result.success).toBe(true);
    expect(localModel).toMatchObject({
      id: 'ollama:fixture-local-coder',
      engine: 'ollama',
      endpoint: 'http://localhost:11434',
      model: 'qwen2.5-coder:7b',
      status: 'metadata-only',
    });
    expect(localModel.capabilities).toEqual(['local']);
  });

  it('supports local filters and unknown IDs', () => {
    const { value } = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });

    expect(listLocalModels(value, { engine: 'ollama' })).toHaveLength(1);
    expect(listLocalModels(value, { capability: 'local' })).toHaveLength(1);
    expect(getLocalModel(value, 'missing')).toBeNull();
  });

  it('fails local models with unsafe remote endpoints', () => {
    const result = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/invalid-local-endpoint'),
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'unsafe_url',
    }));
  });
});
