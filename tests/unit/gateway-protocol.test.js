import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createRedactedRequestDiagnostic,
  normalizeGatewayRequest,
  validateGatewayRequest,
} from '../../src/gateway/index.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/gateway');

function readJson(fileName) {
  return JSON.parse(readFileSync(join(fixtureDir, fileName), 'utf8'));
}

describe('gateway protocol request contract', () => {
  it('passes valid OpenAI-compatible chat requests', () => {
    const request = readJson('valid-chat-request.json');
    const result = validateGatewayRequest(request);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails invalid roles, invalid stream values, and unsupported fields clearly', () => {
    const request = readJson('invalid-chat-request.json');
    const result = validateGatewayRequest(request);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'unsupported_field', path: 'unexpected' }),
      expect.objectContaining({ code: 'invalid_request', path: 'messages[0].role' }),
      expect.objectContaining({ code: 'invalid_request', path: 'stream' }),
    ]));
  });

  it('fails empty messages', () => {
    const result = validateGatewayRequest({
      model: 'mock-chat',
      messages: [],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      path: 'messages',
      message: 'messages must be a non-empty array',
    }));
  });

  it('normalizes request extensions without losing metadata boundaries', () => {
    const request = readJson('valid-chat-request.json');
    const normalized = normalizeGatewayRequest(request);

    expect(normalized.stream).toBe(false);
    expect(normalized.extensions.metadata.fixture).toBe(true);
    expect(normalized.metadata).toBeUndefined();
  });

  it('redacts diagnostics and does not include prompt bodies by default', () => {
    const request = readJson('valid-chat-request.json');
    const diagnostic = createRedactedRequestDiagnostic(request);

    expect(diagnostic.redacted).toBe(true);
    expect(diagnostic.message_count).toBe(2);
    expect(diagnostic.roles).toEqual(['system', 'user']);
    expect(JSON.stringify(diagnostic)).not.toContain('Return a short fixture response');
    expect(diagnostic.metadata.api_key).toBe('[REDACTED]');
  });
});
