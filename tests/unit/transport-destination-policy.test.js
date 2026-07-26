import { describe, it, expect } from 'vitest';
import { evaluateDestinationUrl, evaluatePathSafety } from '../../src/gateway/transport/destination-policy.js';

describe('Destination Transport Policy & Path Safety', () => {
  it('accepts valid HTTPS provider destination URLs', () => {
    const validUrls = [
      'https://api.openai.com/v1/chat/completions',
      'https://api.anthropic.com/v1/messages',
      'https://generativelanguage.googleapis.com/v1beta/models',
      'https://[2607:f8b0:4005:805::200e]/v1/chat',
      'https://8.8.8.8/v1/chat',
    ];
    for (const url of validUrls) {
      const res = evaluateDestinationUrl(url);
      expect(res.success).toBe(true);
      expect(res.scheme).toBe('https');
      expect(res.port).toBe(443);
    }
  });

  it('rejects uppercase hostnames and punycode xn-- hostnames in v4.3', () => {
    expect(evaluateDestinationUrl('https://API.OPENAI.COM/v1').reason).toBe('uppercase_hostname_rejected');
    expect(evaluateDestinationUrl('https://xn--e1afmkfd.xn--p1ai/v1').reason).toBe('punycode_hostname_unsupported');
  });

  it('evaluates recursive percent-encoded path safety (max 3 passes)', () => {
    expect(evaluatePathSafety('/v1/chat').success).toBe(true);
    expect(evaluatePathSafety('/v1/%2f/chat').reason).toBe('encoded_separator_rejected');
    expect(evaluatePathSafety('/v1/%5c/chat').reason).toBe('encoded_separator_rejected');
    expect(evaluatePathSafety('/v1/%2e%2e/chat').reason).toBe('encoded_traversal_or_nul_rejected');
    expect(evaluatePathSafety('/v1/%252f/chat').reason).toBe('encoded_separator_rejected');
    expect(evaluatePathSafety('/v1/%255c/chat').reason).toBe('encoded_separator_rejected');
    expect(evaluatePathSafety('/v1/%252e%252e/chat').reason).toBe('encoded_traversal_or_nul_rejected');
    expect(evaluatePathSafety('/v1/%25252f/chat').reason).toBe('encoded_separator_rejected');
    expect(evaluatePathSafety('/v1/%20/chat').success).toBe(true); // Safe space encoding
    expect(evaluatePathSafety('/v1/%zz/chat').reason).toBe('malformed_percent_encoding');
  });
});
