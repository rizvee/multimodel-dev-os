import { describe, it, expect } from 'vitest';
import { evaluateDestinationUrl } from '../../src/gateway/transport/destination-policy.js';

describe('Destination Transport Policy', () => {
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

  it('rejects HTTP scheme, userinfo, query, fragment, and alternate ports', () => {
    expect(evaluateDestinationUrl('http://api.openai.com/v1').reason).toBe('scheme_must_be_exact_https');
    expect(evaluateDestinationUrl('https://user:pass@api.openai.com/v1').reason).toBe('userinfo_not_permitted');
    expect(evaluateDestinationUrl('https://api.openai.com/v1?foo=bar').reason).toBe('query_string_not_permitted');
    expect(evaluateDestinationUrl('https://api.openai.com/v1#section').reason).toBe('fragment_not_permitted');
    expect(evaluateDestinationUrl('https://api.openai.com:8443/v1').reason).toBe('alternate_ports_not_permitted');
  });

  it('rejects path traversal, backslashes, whitespace, and encoded separators', () => {
    expect(evaluateDestinationUrl('https://api.openai.com/v1/../v2').reason).toBe('encoded_separator_or_path_traversal_rejected');
    expect(evaluateDestinationUrl('https://api.openai.com/v1%2f..%2fv2').reason).toBe('encoded_separator_or_path_traversal_rejected');
    expect(evaluateDestinationUrl('https://api.openai.com\\v1').reason).toBe('backslash_rejected');
    expect(evaluateDestinationUrl('https://api.openai.com /v1').reason).toBe('whitespace_or_control_characters_rejected');
  });

  it('rejects private and non-global IP literal hostnames immediately', () => {
    expect(evaluateDestinationUrl('https://127.0.0.1/v1').reason).toContain('non_global_ipv4_literal');
    expect(evaluateDestinationUrl('https://10.0.0.1/v1').reason).toContain('non_global_ipv4_literal');
    expect(evaluateDestinationUrl('https://[::1]/v1').reason).toContain('non_global_ipv6_literal');
    expect(evaluateDestinationUrl('https://[fe80::1]/v1').reason).toContain('non_global_ipv6_literal');
  });

  it('rejects WHATWG alternate numeric IPv4 normalization attacks', () => {
    // 0177.0.0.1 normalizes to 127.0.0.1 in WHATWG URL, but raw parser rejects it as non-canonical
    const res = evaluateDestinationUrl('https://0177.0.0.1/v1');
    expect(res.success).toBe(false);
    expect(res.reason).toContain('non_canonical_ipv4_literal');
  });
});
