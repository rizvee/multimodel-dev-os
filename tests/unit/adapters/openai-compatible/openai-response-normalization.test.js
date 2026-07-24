import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeOpenAIResponse } from '../../../../src/gateway/adapters/openai-compatible/response.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/gateway/adapters/openai-compatible');

function readJsonFixture(name) {
  return JSON.parse(readFileSync(join(fixtureDir, name), 'utf8'));
}

describe('OpenAI-compatible Response Normalization', () => {
  it('normalizes a standard chat completion response into gateway response contract', () => {
    const upstream = readJsonFixture('normal-response.json');
    const result = normalizeOpenAIResponse(upstream, {
      request_id: 'req-test-123',
      provider_id: 'openai-provider',
      model_id: 'gpt-4o',
    });

    expect(result.success).toBe(true);
    const resp = result.gateway_response;
    expect(resp.object).toBe('chat.completion');
    expect(resp.id).toBe('chatcmpl-8vXYZ123');
    expect(resp.request_id).toBe('req-test-123');
    expect(resp.provider_id).toBe('openai-provider');
    expect(resp.model).toBe('gpt-4o');
    expect(resp.choices).toHaveLength(1);
    expect(resp.choices[0].message.role).toBe('assistant');
    expect(resp.choices[0].message.content).toBe('Hello! How can I assist you today?');
    expect(resp.choices[0].finish_reason).toBe('stop');
    expect(resp.usage.input_tokens).toBe(12);
    expect(resp.usage.output_tokens).toBe(9);
    expect(resp.usage.total_tokens).toBe(21);
    expect(resp.usage.provider_reported).toBe(true);

    // Strips raw provider-specific fields
    expect(resp.system_fingerprint).toBeUndefined();
    expect(resp.logprobs).toBeUndefined();
  });

  it('normalizes deterministic fallback timestamps without Date.now/new Date', () => {
    const upstream = readJsonFixture('normal-response.json');
    delete upstream.created;

    // Test with context.created
    const resWithContext = normalizeOpenAIResponse(upstream, { created: 1700000000 });
    expect(resWithContext.success).toBe(true);
    expect(resWithContext.gateway_response.created).toBe(1700000000);

    // Test without context.created (defaults to 0)
    const resWithoutContext = normalizeOpenAIResponse(upstream);
    expect(resWithoutContext.success).toBe(true);
    expect(resWithoutContext.gateway_response.created).toBe(0);
  });

  it('fails safely when secondary choice is malformed', () => {
    const upstream = readJsonFixture('normal-response.json');
    upstream.choices.push(null); // Invalid secondary choice

    const result = normalizeOpenAIResponse(upstream);
    expect(result.success).toBe(false);
    expect(result.errors[0].code).toBe('upstream_protocol_error');
    expect(result.errors[0].path).toBe('choices[1].message');
  });

  it('validates tool call capability context when response contains tool calls', () => {
    const upstream = readJsonFixture('tool-call-response.json');

    // Denied capability
    const resultDenied = normalizeOpenAIResponse(upstream, {
      capability: { tool_calls: false },
    });
    expect(resultDenied.success).toBe(false);
    expect(resultDenied.errors[0].code).toBe('unsupported_capability');

    // Allowed capability
    const resultAllowed = normalizeOpenAIResponse(upstream, {
      capability: { tool_calls: true },
    });
    expect(resultAllowed.success).toBe(true);
  });

  it('normalizes a tool-call chat completion response', () => {
    const upstream = readJsonFixture('tool-call-response.json');
    const result = normalizeOpenAIResponse(upstream, {
      request_id: 'req-tool-456',
      provider_id: 'openai-provider',
    });

    expect(result.success).toBe(true);
    const resp = result.gateway_response;
    expect(resp.choices[0].finish_reason).toBe('tool_calls');
    expect(resp.choices[0].message.tool_calls).toHaveLength(1);
    expect(resp.choices[0].message.tool_calls[0]).toEqual({
      id: 'call_abc123',
      type: 'function',
      function: {
        name: 'get_current_weather',
        arguments: '{"location":"San Francisco, CA"}',
      },
    });
  });

  it('handles provider-reported usage correctly', () => {
    const upstream = readJsonFixture('provider-reported-usage.json');
    const result = normalizeOpenAIResponse(upstream);

    expect(result.success).toBe(true);
    expect(result.gateway_response.usage.provider_reported).toBe(true);
    expect(result.gateway_response.usage.input_tokens).toBe(100);
    expect(result.gateway_response.usage.output_tokens).toBe(50);
    expect(result.gateway_response.usage.total_tokens).toBe(150);
  });

  it('returns protocol error for null/non-object upstream response', () => {
    const result = normalizeOpenAIResponse(null);
    expect(result.success).toBe(false);
    expect(result.errors[0].code).toBe('upstream_protocol_error');
  });

  it('returns protocol error for response missing choices array', () => {
    const result = normalizeOpenAIResponse({ id: 'chatcmpl-empty' });
    expect(result.success).toBe(false);
    expect(result.errors[0].code).toBe('upstream_protocol_error');
  });

  it('does not mutate input response object', () => {
    const upstream = readJsonFixture('normal-response.json');
    const originalJson = JSON.stringify(upstream);
    normalizeOpenAIResponse(upstream);
    expect(JSON.stringify(upstream)).toBe(originalJson);
  });
});
