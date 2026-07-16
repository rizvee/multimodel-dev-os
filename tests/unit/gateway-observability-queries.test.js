import { describe, expect, it } from 'vitest';
import { queryGatewayEvents, queryGatewayTraces, queryGatewayUsage } from '../../src/gateway/index.js';

describe('gateway observability queries', () => {
  it('returns bounded filtered records', () => {
    expect(queryGatewayEvents([{ request_id: 'a' }, { request_id: 'b' }], { request_id: 'b' })).toHaveLength(1);
    expect(queryGatewayTraces([{ trace_id: 'a' }, { trace_id: 'b' }], { limit: 1 })).toHaveLength(1);
    expect(queryGatewayUsage([{ model_id: 'x' }, { model_id: 'y' }], { model_id: 'x' })).toHaveLength(1);
  });
});
