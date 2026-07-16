import { describe, expect, it } from 'vitest';
import { getGatewayClientProfile, listGatewayClientProfiles } from '../../src/gateway/index.js';

describe('gateway client registry', () => {
  it('provides lookup and list APIs', () => {
    expect(listGatewayClientProfiles().length).toBeGreaterThanOrEqual(12);
    expect(getGatewayClientProfile('node-client').name).toBe('Custom Node.js Client');
    expect(getGatewayClientProfile('missing-client')).toBeNull();
  });
});
