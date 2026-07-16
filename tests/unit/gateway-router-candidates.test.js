import { describe, expect, it } from 'vitest';
import { createGatewayRouteCandidates } from '../../src/gateway/index.js';
import { createRoutingSnapshot } from '../fixtures/gateway-routing/fixtures.js';

describe('gateway router candidates', () => {
  it('creates deterministic registry-backed candidates', () => {
    const candidates = createGatewayRouteCandidates(createRoutingSnapshot());

    expect(candidates.map((candidate) => `${candidate.provider_id}/${candidate.model_id}`)).toEqual([
      'alpha/alpha-fast',
      'alpha/disabled-model',
      'beta/beta-cheap',
      'beta/beta-vision',
      'local/ollama:local-chat',
    ]);
    expect(candidates[0]).toMatchObject({
      provider_id: 'alpha',
      model_id: 'alpha-fast',
      aliases: ['fast'],
      capabilities: ['chat', 'tools'],
    });
  });
});
