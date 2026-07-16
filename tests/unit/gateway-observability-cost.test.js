import { describe, expect, it } from 'vitest';
import { estimateGatewayCost } from '../../src/gateway/index.js';

describe('gateway observability cost', () => {
  it('uses static pricing and keeps unknown pricing null', () => {
    const known = estimateGatewayCost({ usage: { input_tokens: 1000, output_tokens: 1000 }, pricing: { input_cost: 1, output_cost: 2, currency: 'USD' } });
    const unknown = estimateGatewayCost({ usage: { input_tokens: 1000, output_tokens: 1000 }, pricing: {} });
    const mismatch = estimateGatewayCost({ usage: { input_tokens: 1, output_tokens: 1 }, pricing: { input_cost: 1, output_cost: 1, currency: 'USD' }, currency: 'EUR' });
    expect(known.total_cost).toBe(0.003);
    expect(unknown.total_cost).toBeNull();
    expect(mismatch.warnings).toContain('currency mismatch');
  });
});
