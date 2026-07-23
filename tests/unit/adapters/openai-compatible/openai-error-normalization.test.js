import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { normalizeOpenAIError } from '../../../../src/gateway/adapters/openai-compatible/error.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/gateway/adapters/openai-compatible');

function readJsonFixture(name) {
  return JSON.parse(readFileSync(join(fixtureDir, name), 'utf8'));
}

describe('OpenAI-compatible Error Normalization', () => {
  it('maps 400 invalid request error into request_invalid execution error', () => {
    const errObj = readJsonFixture('error-400-invalid.json');
    const result = normalizeOpenAIError(errObj, {
      request_id: 'req-err-400',
      provider_id: 'openai-provider',
    });

    expect(result.contract_version).toBe('2026-07-15.sprint-a');
    expect(result.code).toBe('request_invalid');
    expect(result.category).toBe('request_invalid');
    expect(result.status).toBe(400);
    expect(result.retryable).toBe(false);
    expect(result.redacted).toBe(true);
    expect(result.message).toContain('temperature');
  });

  it('maps 401 unauthorized error into upstream_authentication execution error', () => {
    const errObj = readJsonFixture('error-401-auth.json');
    const result = normalizeOpenAIError(errObj);

    expect(result.code).toBe('upstream_authentication');
    expect(result.category).toBe('upstream_authentication');
    expect(result.status).toBe(401);
    expect(result.retryable).toBe(false);
    expect(result.redacted).toBe(true);
  });

  it('maps 429 rate limit error into upstream_rate_limit execution error', () => {
    const errObj = readJsonFixture('error-429-rate-limit.json');
    const result = normalizeOpenAIError(errObj);

    expect(result.code).toBe('upstream_rate_limit');
    expect(result.category).toBe('upstream_rate_limit');
    expect(result.status).toBe(429);
    expect(result.retryable).toBe(true);
    expect(result.redacted).toBe(true);
  });

  it('maps 429 quota error into upstream_quota execution error', () => {
    const errObj = readJsonFixture('error-429-quota.json');
    const result = normalizeOpenAIError(errObj);

    expect(result.code).toBe('upstream_quota');
    expect(result.category).toBe('upstream_quota');
    expect(result.status).toBe(429);
    expect(result.retryable).toBe(false);
    expect(result.redacted).toBe(true);
  });

  it('maps 500 server error into upstream_server_error execution error', () => {
    const errObj = readJsonFixture('error-500-server.json');
    const result = normalizeOpenAIError(errObj);

    expect(result.code).toBe('upstream_server_error');
    expect(result.category).toBe('upstream_server_error');
    expect(result.status).toBe(500);
    expect(result.retryable).toBe(true);
    expect(result.redacted).toBe(true);
  });

  it('redacts secret-bearing error bodies and local filesystem paths', () => {
    const errObj = readJsonFixture('error-secret-bearing.json');
    const result = normalizeOpenAIError(errObj);

    expect(result.redacted).toBe(true);
    expect(result.message).not.toContain('sk-proj-1234567890abcdef');
    expect(result.message).not.toContain('/Users/admin/projects/app/server.js');
    expect(result.details?.api_key).toBeUndefined();
    expect(result.details?.secret_token).toBeUndefined();
    expect(result.details?.stack).toBeUndefined();
  });

  it('maps 408/504 status to timeout execution error', () => {
    const result = normalizeOpenAIError({ status: 504, message: 'Gateway Timeout' });
    expect(result.code).toBe('timeout');
    expect(result.category).toBe('timeout');
    expect(result.retryable).toBe(true);
  });

  it('maps 413 status to request_too_large execution error', () => {
    const result = normalizeOpenAIError({ status: 413, message: 'Payload Too Large' });
    expect(result.code).toBe('request_too_large');
    expect(result.category).toBe('request_too_large');
    expect(result.retryable).toBe(false);
  });

  it('never throws even when passed null, circular, or garbage input', () => {
    expect(() => normalizeOpenAIError(null)).not.toThrow();
    expect(() => normalizeOpenAIError(undefined)).not.toThrow();
    expect(() => normalizeOpenAIError('random string error')).not.toThrow();
    expect(() => normalizeOpenAIError(12345)).not.toThrow();

    const circularObj = {};
    circularObj.self = circularObj;
    expect(() => normalizeOpenAIError(circularObj)).not.toThrow();

    const res = normalizeOpenAIError(circularObj);
    expect(res.code).toBe('internal_execution_error');
    expect(res.redacted).toBe(true);
  });
});
