import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { simulateGatewayResilience } from '../../src/gateway/index.js';

const fixtureRoot = join(process.cwd(), 'tests/fixtures/gateway-resilience');

function fixture(name) {
  return JSON.parse(readFileSync(join(fixtureRoot, name, 'scenario.json'), 'utf8'));
}

describe('gateway resilience simulation', () => {
  it('reaches planned success after retry and remains deterministic', () => {
    const scenario = fixture('retryable-timeout');
    const first = simulateGatewayResilience({ ...scenario, requestId: 'res-timeout', startTime: 1000 });
    const second = simulateGatewayResilience({ ...scenario, requestId: 'res-timeout', startTime: 1000 });

    expect(first).toEqual(second);
    expect(first.final_status).toBe('planned-success');
    expect(first.executed).toBe(false);
    expect(first.timeline.map((event) => event.type)).toEqual(scenario.expected.events);
  });

  it('reaches planned success after fallback', () => {
    const scenario = fixture('fallback-success');
    const result = simulateGatewayResilience({ ...scenario, requestId: 'res-fallback-success', startTime: 1000 });

    expect(result.final_status).toBe('planned-success');
    expect(result.fallback_transitions[0].transition_allowed).toBe(true);
    expect(result.final_route.provider_id).toBe('beta');
  });

  it('reaches exhausted and denied terminal states', () => {
    const exhausted = fixture('fallback-exhausted');
    const denied = fixture('policy-denied');

    expect(simulateGatewayResilience({ ...exhausted, requestId: 'res-fallback-exhausted', startTime: 1000 }).final_status).toBe('exhausted');
    expect(simulateGatewayResilience({ ...denied, requestId: 'res-policy', startTime: 1000 }).final_status).toBe('denied');
  });

  it('does not mutate caller inputs and always terminates', () => {
    const scenario = fixture('rate-limit-fallback');
    const before = JSON.stringify(scenario);
    const result = simulateGatewayResilience({ ...scenario, requestId: 'res-rate-fallback', startTime: 1000 });

    expect(JSON.stringify(scenario)).toBe(before);
    expect(result.timeline.at(-1).type).toBe('simulation-complete');
  });
});
