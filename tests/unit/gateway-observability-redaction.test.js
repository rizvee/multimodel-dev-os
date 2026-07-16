import { describe, expect, it } from 'vitest';
import { redactGatewayObservability } from '../../src/gateway/index.js';

describe('gateway observability redaction', () => {
  it('removes auth, content, tokens, and local paths', () => {
    const redacted = redactGatewayObservability({
      authorization: 'Bearer test-token',
      prompt: 'secret prompt',
      completion: 'secret response',
      path: 'C:\\Users\\ADMIN\\secret.txt',
    });
    const text = JSON.stringify(redacted);
    expect(text).not.toContain('test-token');
    expect(text).not.toContain('secret prompt');
    expect(text).not.toContain('ADMIN');
  });
});
