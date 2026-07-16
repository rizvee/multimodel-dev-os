import { describe, expect, it } from 'vitest';
import { createGatewayObservabilityCollector } from '../../src/gateway/index.js';

describe('gateway observability collector', () => {
  it('is bounded, deterministic, and not global', () => {
    let now = 10;
    const a = createGatewayObservabilityCollector({ config: { max_events: 2 }, timeFactory: () => now++ });
    const b = createGatewayObservabilityCollector({ config: { max_events: 2 }, timeFactory: () => now++ });
    a.recordEvent({ event_id: 'evt-1', type: 'request-received' });
    a.recordEvent({ event_id: 'evt-2', type: 'request-completed' });
    a.recordEvent({ event_id: 'evt-3', type: 'request-failed' });

    expect(a.getEvents().map((event) => event.event_id)).toEqual(['evt-2', 'evt-3']);
    expect(b.getEvents()).toEqual([]);
    expect(a.state().limits.max_events).toBe(2);
  });
});
