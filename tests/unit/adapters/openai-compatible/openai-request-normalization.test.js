import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeOpenAIExecutionRequest } from '../../../../src/gateway/adapters/openai-compatible/request.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/gateway/adapters/openai-compatible');

function readJsonFixture(name) {
  return JSON.parse(readFileSync(join(fixtureDir, name), 'utf8'));
}

describe('OpenAI-compatible Request Normalization', () => {
  it('normalizes a valid non-stream execution request into OpenAI-compatible payload', () => {
    const req = readJsonFixture('valid-non-stream-request.json');
    const result = normalizeOpenAIExecutionRequest(req);

    expect(result.success).toBe(true);
    expect(result.payload).toBeDefined();
    expect(result.payload.model).toBe('gpt-4o');
    expect(result.payload.messages).toHaveLength(2);
    expect(result.payload.messages[0]).toEqual({
      role: 'system',
      content: 'You are a helpful coding assistant.',
    });
    expect(result.payload.messages[1]).toEqual({
      role: 'user',
      content: 'Write a hello world program in JavaScript.',
    });
    expect(result.payload.temperature).toBe(0.7);
    expect(result.payload.top_p).toBe(1.0);
    expect(result.payload.max_tokens).toBe(150);
    expect(result.payload.user).toBe('user-123');

    // Security & isolation assertions
    expect(result.payload.credential_ref).toBeUndefined();
    expect(result.payload.endpoint).toBeUndefined();
    expect(result.payload.policy).toBeUndefined();
    expect(result.payload.capability).toBeUndefined();
    expect(result.payload.headers).toBeUndefined();
    expect(result.payload.metadata).toBeUndefined();
    expect(result.payload.contract_version).toBeUndefined();
  });

  it('normalizes a valid stream execution request', () => {
    const req = readJsonFixture('valid-stream-request.json');
    const result = normalizeOpenAIExecutionRequest(req);

    expect(result.success).toBe(true);
    expect(result.payload.stream).toBe(true);
    expect(result.payload.model).toBe('gpt-4o');
    expect(result.payload.user).toBe('user-456');
  });

  it('rejects streaming when provider capability sse_streaming is false', () => {
    const req = readJsonFixture('unsupported-streaming-request.json');
    const result = normalizeOpenAIExecutionRequest(req);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].code).toBe('unsupported_capability');
    expect(result.errors[0].path).toBe('capability.sse_streaming');
  });

  it('rejects tool calls when provider capability tool_calls is false', () => {
    const req = readJsonFixture('unsupported-tool-calls-request.json');
    const result = normalizeOpenAIExecutionRequest(req);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].code).toBe('unsupported_capability');
    expect(result.errors[0].path).toBe('capability.tool_calls');
  });

  it('does not mutate input request object', () => {
    const req = readJsonFixture('valid-non-stream-request.json');
    const originalJson = JSON.stringify(req);
    normalizeOpenAIExecutionRequest(req);
    expect(JSON.stringify(req)).toBe(originalJson);
  });

  it('returns validation errors for invalid execution request', () => {
    const invalidReq = { contract_version: 'invalid' };
    const result = normalizeOpenAIExecutionRequest(invalidReq);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
