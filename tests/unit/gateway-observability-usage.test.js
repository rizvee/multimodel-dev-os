import { describe, expect, it } from 'vitest';
import { estimateGatewayTokens, normalizeGatewayUsageRecord } from '../../src/gateway/index.js';

describe('gateway observability usage', () => {
  it('keeps provider reported and estimated usage distinct', () => {
    const reported = normalizeGatewayUsageRecord({ usage: { input_tokens: 2, output_tokens: 2, total_tokens: 4, provider_reported: true, estimated: false } });
    const estimated = estimateGatewayTokens({ messages: [{ role: 'user', content: 'hello world' }], response: 'ok', strategy: 'whitespace-estimate' });
    const unavailable = estimateGatewayTokens({ strategy: 'unavailable' });
    expect(reported.provider_reported).toBe(true);
    expect(estimated.estimated).toBe(true);
    expect(unavailable.total_tokens).toBeNull();
  });
});
