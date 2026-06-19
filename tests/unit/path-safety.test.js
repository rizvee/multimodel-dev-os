import { describe, it, expect } from 'vitest';
import { isSafePath, shouldIgnorePath } from '../../src/core/security.js';

describe('Path Safety and Ignore Engine', () => {
  describe('isSafePath', () => {
    const policy = {
      allowed_write_roots: ['.ai/', 'adapters/'],
      blocked_paths: ['.env', '.npmrc', '.git/', 'node_modules/', 'package.json', 'package-lock.json']
    };

    it('should allow paths under allowed write roots', () => {
      expect(isSafePath('.ai/plugins/my-plugin.yaml', policy)).toBe(true);
      expect(isSafePath('adapters/vscode/settings.json', policy)).toBe(true);
    });

    it('should reject paths outside allowed write roots', () => {
      expect(isSafePath('src/cli/main.js', policy)).toBe(false);
      expect(isSafePath('index.js', policy)).toBe(false);
    });

    it('should reject paths with directory traversal', () => {
      expect(isSafePath('.ai/plugins/../../index.js', policy)).toBe(false);
      expect(isSafePath('adapters/../package.json', policy)).toBe(false);
    });

    it('should reject absolute paths', () => {
      expect(isSafePath('/etc/passwd', policy)).toBe(false);
      expect(isSafePath('C:/Windows/System32', policy)).toBe(false);
    });

    it('should reject blacklisted paths', () => {
      expect(isSafePath('.ai/plugins/.env', policy)).toBe(false);
      expect(isSafePath('adapters/.npmrc', policy)).toBe(false);
      expect(isSafePath('adapters/node_modules/foo', policy)).toBe(false);
    });
  });

  describe('shouldIgnorePath', () => {
    it('should ignore dependency and git folders', () => {
      expect(shouldIgnorePath('node_modules/lodash/index.js')).toBe(true);
      expect(shouldIgnorePath('.git/config')).toBe(true);
      expect(shouldIgnorePath('dist/bundle.js')).toBe(true);
    });

    it('should ignore generated runtime memory files', () => {
      expect(shouldIgnorePath('.ai/intelligence/memory.hash.json')).toBe(true);
      expect(shouldIgnorePath('.ai/intelligence/feedback-log.jsonl')).toBe(true);
    });

    it('should ignore credential and secret files', () => {
      expect(shouldIgnorePath('.env')).toBe(true);
      expect(shouldIgnorePath('src/.env.production')).toBe(true);
      expect(shouldIgnorePath('key.pem')).toBe(true);
      expect(shouldIgnorePath('id_rsa')).toBe(true);
    });

    it('should not ignore standard application source files', () => {
      expect(shouldIgnorePath('src/core/yaml.js')).toBe(false);
      expect(shouldIgnorePath('README.md')).toBe(false);
    });
  });
});
