import { describe, expect, it } from 'vitest';
import { buildGatewayMetricsSnapshot } from '../../src/gateway/index.js';

describe('gateway observability metrics', () => {
  it('handles empty and populated metric sets safely', () => {
    const empty = buildGatewayMetricsSnapshot();
    const populated = buildGatewayMetricsSnapshot({
      traces: [{ success: true, duration_ms: 10, completed_at: 2, model_id: 'mock-chat', provider_id: 'mock' }],
      usage: [{ input_tokens: 2, output_tokens: 2, total_tokens: 4 }],
    });
    expect(empty.requests_total).toBe(0);
    expect(populated.requests_success).toBe(1);
    expect(populated.total_tokens).toBe(4);
  });
});
