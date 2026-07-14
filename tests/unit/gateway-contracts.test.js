import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createChatCompletionResponse,
  createUsage,
  validateGatewayResponse,
  validateRouteDecision,
  validateRoutingRequest,
  validateUsage,
} from '../../src/gateway/index.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/gateway');

function readJson(fileName) {
  return JSON.parse(readFileSync(join(fixtureDir, fileName), 'utf8'));
}

describe('gateway response and routing contracts', () => {
  it('validates bundled chat response fixtures', () => {
    const response = readJson('valid-chat-response.json');
    const result = validateGatewayResponse(response);

    expect(result.success).toBe(true);
  });

  it('validates normalized chat responses created by helpers', () => {
    const response = createChatCompletionResponse({
      id: 'chatcmpl-test',
      request_id: 'req-test',
      provider_id: 'mock-provider',
      model_id: 'mock-chat',
      message: {
        role: 'assistant',
        content: 'ok',
      },
      usage: createUsage({
        input_tokens: 1,
        output_tokens: 1,
        total_tokens: 2,
      }),
      created: 1800000000,
    });

    expect(validateGatewayResponse(response).success).toBe(true);
  });

  it('validates usage metadata with nullable unavailable values', () => {
    const usage = createUsage();
    const result = validateUsage(usage);

    expect(result.success).toBe(true);
    expect(usage.cost).toBeNull();
    expect(usage.estimated).toBe(true);
  });

  it('validates routing requests', () => {
    const request = readJson('valid-routing-request.json');
    const result = validateRoutingRequest(request);

    expect(result.success).toBe(true);
  });

  it('validates route decisions and explanations', () => {
    const decision = readJson('valid-route-decision.json');
    const result = validateRouteDecision(decision);

    expect(result.success).toBe(true);
    expect(decision.reasons).toContain('explicit provider and model selected');
  });

  it('fails unsupported routing capabilities', () => {
    const result = validateRoutingRequest({
      required_capabilities: ['telepathy'],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'unsupported_capability',
    }));
  });
});
