import { describe, expect, it } from 'vitest';
import { join } from 'path';
import {
  buildGatewayRegistrySnapshot,
  getRoutingPreset,
  listRoutingPresets,
} from '../../src/gateway/index.js';

const fixtureRoot = join(process.cwd(), 'tests/fixtures/gateway-registry/valid');

describe('runtime routing preset registry', () => {
  it('normalizes routing presets without executing strategies', () => {
    const result = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });
    const preset = getRoutingPreset(result.value, 'fixture-coding');

    expect(result.success).toBe(true);
    expect(preset).toMatchObject({
      id: 'fixture-coding',
      strategy: 'fallback-chain',
      provider_ids: ['fixture-openai'],
      model_ids: ['fixture-chat', 'fixture-vision'],
      fallback_allowed: true,
      cost_preference: 'low',
    });
  });

  it('supports strategy lookup and unknown IDs', () => {
    const { value } = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });

    expect(listRoutingPresets(value, { strategy: 'fallback-chain' }).map((preset) => preset.id)).toEqual(['fixture-coding']);
    expect(getRoutingPreset(value, 'missing')).toBeNull();
  });

  it('fails broken preset model references', () => {
    const result = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/broken-preset-reference'),
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'unknown_model',
    }));
  });
});
