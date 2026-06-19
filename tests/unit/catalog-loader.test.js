import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadCatalogFromSource, loadCatalog } from '../../src/catalog/loader.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Catalog Loader', () => {
  const tempDir = join(process.cwd(), 'temp-catalog-test');
  const localCatalogDir = join(tempDir, '.ai', 'plugins');
  const localCatalogFile = join(localCatalogDir, 'catalog.yaml');

  beforeAll(() => {
    mkdirSync(localCatalogDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should load bundled catalog from fallback or global if no target is specified', () => {
    const catalog = loadCatalog();
    expect(catalog).toBeDefined();
    expect(Array.isArray(catalog.plugins)).toBe(true);
  });

  it('should load local catalog when source is "local"', () => {
    const localYaml = `
catalog:
  plugins:
    - name: local-plugin
      slug: local-slug
      version: 1.0.0
      description: local test
      author: test
    `;
    writeFileSync(localCatalogFile, localYaml, 'utf8');

    const result = loadCatalogFromSource('local', { target: tempDir });
    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0].name).toBe('local-plugin');
    expect(result.plugins[0]._source).toBe('local');
  });
});
