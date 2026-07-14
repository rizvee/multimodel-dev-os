import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createGatewayError,
  normalizeGatewayError,
  validateGatewayErrorShape,
} from '../../src/gateway/index.js';

const fixtureDir = join(process.cwd(), 'tests/fixtures/gateway');

describe('gateway error taxonomy', () => {
  it('maps stable retryable flags and statuses', () => {
    const fixture = JSON.parse(readFileSync(join(fixtureDir, 'normalized-errors.json'), 'utf8'));

    for (const expected of fixture.errors) {
      const response = createGatewayError({
        code: expected.code,
        message: 'fixture error',
      });
      expect(response.error.retryable).toBe(expected.retryable);
      expect(response.error.status).toBe(expected.status);
      expect(validateGatewayErrorShape(response).success).toBe(true);
    }
  });

  it('redacts secrets from error details', () => {
    const response = createGatewayError({
      code: 'authentication_failed',
      message: 'bad credentials',
      details: {
        authorization: 'Bearer secret-token',
        nested: {
          api_key: 'secret-value',
        },
      },
    });
    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('secret-value');
    expect(response.error.details.authorization).toBe('[REDACTED]');
  });

  it('normalizes unknown exceptions as internal errors', () => {
    const response = normalizeGatewayError(new Error('boom'), {
      request_id: 'req-error',
    });

    expect(response.error.code).toBe('internal_error');
    expect(response.error.request_id).toBe('req-error');
    expect(validateGatewayErrorShape(response).success).toBe(true);
  });
});
