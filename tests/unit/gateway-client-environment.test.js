import { describe, expect, it } from 'vitest';
import { createGatewayClientEnvironment } from '../../src/gateway/index.js';

describe('gateway client environment helpers', () => {
  it('returns placeholders instead of secret values', () => {
    const env = createGatewayClientEnvironment({ auth: { token_env: 'MMDO_GATEWAY_TOKEN' } });

    expect(env.variables.MMDO_GATEWAY_TOKEN).toBe('${MMDO_GATEWAY_TOKEN}');
    expect(env.contains_secrets).toBe(false);
  });
});
