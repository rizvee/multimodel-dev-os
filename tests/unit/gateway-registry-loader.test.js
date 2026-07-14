import { describe, expect, it } from 'vitest';
import { join, resolve } from 'path';
import {
  buildGatewayRegistrySnapshot,
  loadGatewayRegistrySources,
  resolveGatewayRegistryFiles,
} from '../../src/gateway/index.js';

const fixtureRoot = join(process.cwd(), 'tests/fixtures/gateway-registry/valid');

describe('gateway registry loader', () => {
  it('loads bundled provider and model registries', () => {
    const result = buildGatewayRegistrySnapshot({ rootDir: process.cwd() });

    expect(result.success).toBe(true);
    expect(result.value.providers.length).toBeGreaterThan(0);
    expect(result.value.models.length).toBeGreaterThan(0);
    expect(result.value.local_models.length).toBeGreaterThan(0);
    expect(result.value.routing_presets.length).toBeGreaterThan(0);
  });

  it('loads explicit fixture roots without absolute paths in source_files', () => {
    const result = loadGatewayRegistrySources({ rootDir: fixtureRoot });

    expect(result.success).toBe(true);
    expect(result.value.sourceFiles.providers).toBe('.ai/models/providers.yaml');
    expect(result.value.sourceFiles.providers).not.toContain(resolve(fixtureRoot));
  });

  it('rejects path traversal source paths', () => {
    const result = resolveGatewayRegistryFiles({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/path-traversal'),
      files: {
        providers: '../outside.yaml',
      },
    });

    expect(result.success).toBe(false);
    expect(result.diagnostics.errors).toContainEqual(expect.objectContaining({
      code: 'path_traversal',
    }));
  });

  it('repeated loads produce equivalent deterministic snapshots', () => {
    const first = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });
    const second = buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(first.value).toEqual(second.value);
  });

  it('does not mutate parsed source objects', () => {
    const sourceResult = loadGatewayRegistrySources({ rootDir: fixtureRoot });
    const before = JSON.stringify(sourceResult.value.providersSource);

    buildGatewayRegistrySnapshot({ rootDir: fixtureRoot });

    expect(JSON.stringify(sourceResult.value.providersSource)).toBe(before);
  });
});
