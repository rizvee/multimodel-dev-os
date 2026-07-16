import { describe, expect, it } from 'vitest';
import { createGatewayEvent } from '../../src/gateway/index.js';

describe('gateway observability events', () => {
  it('creates redacted structured lifecycle events', () => {
    const event = createGatewayEvent({
      event_id: 'evt',
      type: 'mock-provider-completed',
      timestamp: 1,
      metadata: { route: '/v1/chat/completions', ignored: 'x' },
    });
    expect(event.type).toBe('mock-provider-completed');
    expect(event.metadata).toEqual({ route: '/v1/chat/completions' });
  });
});
