import { describe, expect, it } from 'vitest';
import { createResilienceEvent } from '../../src/gateway/index.js';

describe('gateway resilience event records', () => {
  it('creates deterministic planning event IDs and redacts metadata', () => {
    const event = createResilienceEvent({
      request_id: 'req',
      type: 'retry-planned',
      attempt: 2,
      provider_id: 'alpha',
      model_id: 'alpha-fast',
      timestamp: 100,
      metadata: { token: 'secret', safe: 'ok' },
    });

    expect(event.event_id).toBe('req-retry-planned-2');
    expect(event.metadata.token).toBe('[REDACTED]');
    expect(event.metadata.safe).toBe('ok');
  });
});
