import { describe, expect, it } from 'vitest';
import { createGatewayRouteCandidates, filterGatewayRouteCandidates, normalizeRoutingPolicy } from '../../src/gateway/index.js';
import { baseRoutingRequest, createRoutingSnapshot } from '../fixtures/gateway-routing/fixtures.js';

describe('gateway router filters', () => {
  it('rejects exclusions, disabled models, missing capabilities, and context gaps', () => {
    const candidates = createGatewayRouteCandidates(createRoutingSnapshot());
    const request = {
      ...baseRoutingRequest,
      required_capabilities: ['vision'],
      required_context_window: 70000,
      excluded_providers: ['alpha'],
    };
    const policy = normalizeRoutingPolicy({
      request,
    });
    const result = filterGatewayRouteCandidates({ candidates, request, policy });

    expect(result.rejected.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'provider_excluded',
      'model_disabled',
      'capability_missing',
      'context_window_insufficient',
    ]));
  });

  it('enforces local-only privacy requirements', () => {
    const candidates = createGatewayRouteCandidates(createRoutingSnapshot());
    const request = { ...baseRoutingRequest, privacy_policy: 'local-only' };
    const policy = normalizeRoutingPolicy({ request });
    const result = filterGatewayRouteCandidates({ candidates, request, policy });

    expect(result.viable.map((candidate) => candidate.model_id)).toEqual(['ollama:local-chat']);
    expect(result.rejected).toContainEqual(expect.objectContaining({ code: 'local_required' }));
  });
});
