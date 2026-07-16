import { describe, expect, it } from 'vitest';
import { createGatewayTrace, completeGatewayTrace } from '../../src/gateway/index.js';

describe('gateway observability traces', () => {
  it('correlates request and event ids without content', () => {
    const trace = createGatewayTrace({ trace_id: 'trc', request_id: 'req', started_at: 1, method: 'POST', pathname: '/v1/chat/completions' });
    const completed = completeGatewayTrace(trace, { completed_at: 5, duration_ms: 4, status_code: 200, success: true, event_ids: ['evt'] });
    expect(completed.event_ids).toEqual(['evt']);
    expect(JSON.stringify(completed)).not.toContain('prompt');
  });
});
