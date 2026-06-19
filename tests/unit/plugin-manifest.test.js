import { describe, it, expect } from 'vitest';
import { validatePluginManifest } from '../../src/plugin/manifest.js';

describe('Plugin Manifest Validator', () => {
  it('should accept a completely valid plugin manifest', () => {
    const manifest = {
      name: 'My Test Plugin',
      slug: 'my-test-plugin',
      version: '1.0.0',
      description: 'A valid test plugin description',
      author: 'Tester',
      allowed_file_patterns: ['.ai/plugins/config.yaml', 'adapters/vscode/settings.json']
    };

    const result = validatePluginManifest(manifest);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing metadata keys', () => {
    const manifest = {
      name: 'My Test Plugin',
      version: '1.0.0',
      description: 'A description',
      author: 'Tester'
      // slug is missing
    };

    const result = validatePluginManifest(manifest);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Missing required key: slug');
  });

  it('should reject invalid slug formats', () => {
    const manifest = {
      name: 'My Test Plugin',
      slug: 'invalid slug here',
      version: '1.0.0',
      description: 'A description',
      author: 'Tester'
    };

    const result = validatePluginManifest(manifest);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Key 'slug' must be alphanumeric with dashes or underscores only");
  });

  it('should reject patterns writing outside allowed write roots', () => {
    const manifest = {
      name: 'My Test Plugin',
      slug: 'my-test-plugin',
      version: '1.0.0',
      description: 'A description',
      author: 'Tester',
      allowed_file_patterns: ['src/cli/main.js'] // not in .ai/ or adapters/
    };

    const result = validatePluginManifest(manifest);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('violates safety boundaries');
  });

  it('should reject patterns containing traversal or leading slash', () => {
    const manifest = {
      name: 'My Test Plugin',
      slug: 'my-test-plugin',
      version: '1.0.0',
      description: 'A description',
      author: 'Tester',
      allowed_file_patterns: ['.ai/plugins/../../index.js', '/.ai/plugins/test.yaml']
    };

    const result = validatePluginManifest(manifest);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain('violates safety boundaries');
    expect(result.errors[1]).toContain('violates safety boundaries');
  });

  it('should reject patterns containing blacklisted files', () => {
    const manifest = {
      name: 'My Test Plugin',
      slug: 'my-test-plugin',
      version: '1.0.0',
      description: 'A description',
      author: 'Tester',
      allowed_file_patterns: ['.ai/plugins/.env', 'adapters/package.json']
    };

    const result = validatePluginManifest(manifest);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
