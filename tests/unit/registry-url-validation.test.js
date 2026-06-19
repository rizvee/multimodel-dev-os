import { describe, it, expect } from 'vitest';
import { validateRegistryUrl } from '../../src/registry/validation.js';

describe('Registry URL Validation', () => {
  it('should accept valid HTTPS URLs', () => {
    expect(() => validateRegistryUrl('https://example.com/catalog.yaml')).not.toThrow();
    expect(() => validateRegistryUrl('https://raw.githubusercontent.com/user/repo/main/catalog.yaml')).not.toThrow();
  });

  it('should reject empty or non-string URLs', () => {
    expect(() => validateRegistryUrl(null)).toThrow('Registry URL must be a non-empty string.');
    expect(() => validateRegistryUrl('')).toThrow('Registry URL must be a non-empty string.');
    expect(() => validateRegistryUrl(123)).toThrow('Registry URL must be a non-empty string.');
  });

  it('should reject URLs with whitespace or control characters', () => {
    expect(() => validateRegistryUrl('https://example.com/cat alog.yaml')).toThrow('whitespace or control characters');
    expect(() => validateRegistryUrl('https://example.com/catalog.yaml\n')).toThrow('whitespace or control characters');
  });

  it('should reject URLs containing quotes or backticks', () => {
    expect(() => validateRegistryUrl("https://example.com/catalog.yaml'")).toThrow('quotes or backticks');
    expect(() => validateRegistryUrl('https://example.com/catalog.yaml"')).toThrow('quotes or backticks');
    expect(() => validateRegistryUrl('https://example.com/catalog.yaml`')).toThrow('quotes or backticks');
  });

  it('should reject URLs containing shell metacharacters', () => {
    expect(() => validateRegistryUrl('https://example.com/catalog.yaml;echo')).toThrow('shell metacharacters');
    expect(() => validateRegistryUrl('https://example.com/catalog.yaml&foo')).toThrow('shell metacharacters');
    expect(() => validateRegistryUrl('https://example.com/catalog.yaml$foo')).toThrow('shell metacharacters');
  });

  it('should reject malformed URLs', () => {
    expect(() => validateRegistryUrl('not-a-url')).toThrow('malformed or invalid');
  });

  it('should reject URLs containing credentials', () => {
    expect(() => validateRegistryUrl('https://user:password@example.com/catalog.yaml')).toThrow('credentials');
    expect(() => validateRegistryUrl('https://user@example.com/catalog.yaml')).toThrow('credentials');
  });

  it('should reject non-HTTPS remote URLs by default', () => {
    expect(() => validateRegistryUrl('http://example.com/catalog.yaml')).toThrow('Only HTTPS is permitted');
    expect(() => validateRegistryUrl('ftp://example.com/catalog.yaml')).toThrow('Only HTTPS is permitted');
  });

  describe('Localhost HTTP Allowance', () => {
    it('should reject HTTP localhost by default', () => {
      expect(() => validateRegistryUrl('http://localhost/catalog.yaml')).toThrow('Only HTTPS is permitted');
      expect(() => validateRegistryUrl('http://127.0.0.1/catalog.yaml')).toThrow('Only HTTPS is permitted');
    });

    it('should allow HTTP localhost if policy explicitly allows it', () => {
      const policy = { allow_http_localhost: true };
      expect(() => validateRegistryUrl('http://localhost/catalog.yaml', policy)).not.toThrow();
      expect(() => validateRegistryUrl('http://127.0.0.1/catalog.yaml', policy)).not.toThrow();
    });

    it('should still reject HTTP non-localhost even if policy allows HTTP localhost', () => {
      const policy = { allow_http_localhost: true };
      expect(() => validateRegistryUrl('http://example.com/catalog.yaml', policy)).toThrow('Only HTTPS is permitted');
    });
  });
});
