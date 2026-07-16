import { describe, expect, it } from 'vitest';
import { buildProviderHealthSnapshot, metadataOnlyProviderHealth } from '../../src/gateway/index.js';

describe('gateway observability provider health', () => {
  it('separates executable mock health from metadata-only providers', () => {
    const mock = buildProviderHealthSnapshot({ provider_id: 'mock', status: 'healthy', executable: true, local: true, request_count: 1 });
    const external = metadataOnlyProviderHealth({ id: 'external', local: false });
    expect(mock.executable).toBe(true);
    expect(external.status).toBe('metadata-only');
    expect(external.executable).toBe(false);
  });
});
