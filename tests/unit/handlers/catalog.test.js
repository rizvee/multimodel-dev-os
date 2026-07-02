import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-catalog-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-catalog-handler-test')
  };
});

import {
  handleCatalogList,
  handleCatalogSearch,
  handleCatalogShow,
  handleCatalogCategories,
  handleCatalogInstall,
  handleCatalogStatus,
  handleCatalogRecommend
} from '../../../src/cli/handlers/catalog.js';

describe('Catalog Handlers Suite', () => {
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  let logOutput = [];
  let errorOutput = [];
  let warnOutput = [];
  let exitCode = null;

  beforeAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });

    mkdirSync(join(tempDir, '.ai', 'plugins', 'catalog'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'registries'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'policies'), { recursive: true });

    // Write a mock policy file
    writeFileSync(join(tempDir, '.ai', 'policies', 'registry-policy.yaml'), `
allow_remote_registries: true
max_plugin_files: 20
max_plugin_size_kb: 100
allowed_file_extensions: [".md", ".yaml", ".yml", ".json"]
allowed_write_roots: [".ai/", "adapters/"]
blocked_paths: [".env"]
`, 'utf8');

    // Write sources.yaml
    writeFileSync(join(tempDir, '.ai', 'registries', 'sources.yaml'), `
sources:
  - name: "bundled"
    type: "local"
    url: ".ai/plugins/catalog.yaml"
    enabled: true
    trust_level: "trusted"
    safety_policy: "sandboxed"
    signature_required: false
    checksum_required: false
`, 'utf8');

    // Write a mock catalog.yaml file with catalog root key
    writeFileSync(join(tempDir, '.ai', 'plugins', 'catalog.yaml'), `
catalog:
  catalog_version: "1"
  plugins:
    - name: "Git Workflows Plugin"
      slug: "git-workflows"
      version: "1.0.0"
      category: "testing"
      description: "A test plugin description"
      safety_level: "sandboxed"
      install_scope: "declarative"
      tags: ["mock", "test"]
      manifest:
        files:
          - path: ".ai/plugins/git-workflows.yaml"
            content: "test plugin content"
`, 'utf8');

    // Write packed plugin manifest
    writeFileSync(join(tempDir, '.ai', 'plugins', 'catalog', 'git-workflows.yaml'), `
name: "Git Workflows Plugin"
slug: "git-workflows"
version: "1.0.0"
description: "A test plugin description"
author: "Test Author"
manifest:
  files:
    - path: ".ai/plugins/git-workflows.yaml"
      content: "test plugin content"
`, 'utf8');
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    logOutput = [];
    errorOutput = [];
    warnOutput = [];
    exitCode = null;

    console.log = (...args) => { logOutput.push(args.join(' ')); };
    console.error = (...args) => { errorOutput.push(args.join(' ')); };
    console.warn = (...args) => { warnOutput.push(args.join(' ')); };
    process.exit = (code) => {
      exitCode = code;
      throw new Error(`process.exit: ${code}`);
    };
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    process.exit = originalExit;
  });

  it('handleCatalogList should display plugins from catalog', () => {
    handleCatalogList({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Workflow Marketplace & Plugin Catalog');
    expect(out).toContain('Git Workflows Plugin');
  });

  it('handleCatalogSearch should display matching plugins', () => {
    handleCatalogSearch('git', { target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Search Catalog Results for query: "git"');
    expect(out).toContain('Git Workflows Plugin');
  });

  it('handleCatalogShow should show details of catalog entry', () => {
    handleCatalogShow('git-workflows', { target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Catalog Plugin:');
    expect(out).toContain('git-workflows');
  });

  it('handleCatalogCategories should display unique categories', () => {
    handleCatalogCategories({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('testing');
  });

  it('handleCatalogInstall should install plugin from catalog', () => {
    handleCatalogInstall('git-workflows', { target: tempDir, approved: true });
    expect(logOutput.join('\n')).toContain('installed successfully!');
    expect(existsSync(join(tempDir, '.ai', 'plugins', 'git-workflows.yaml'))).toBe(true);
  });

  it('handleCatalogStatus should display catalog health', () => {
    handleCatalogStatus({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Auditing Catalog Plugins');
    expect(out).toContain('Git Workflows Plugin');
  });

  it('handleCatalogRecommend should display recommendations based on project signals', () => {
    const mockAnalysis = () => ({
      language: 'JS',
      frameworkSignals: ['React'],
      dependencySignals: ['npm'],
      githubWorkflows: ['build']
    });
    handleCatalogRecommend({ target: tempDir }, { getAnalysis: mockAnalysis });
    const out = logOutput.join('\n');
    expect(out).toContain('Marketplace Recommendations for');
    expect(out).toContain('Git Workflows Plugin');
  });
});
