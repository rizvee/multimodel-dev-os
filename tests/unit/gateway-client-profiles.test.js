import { describe, expect, it } from 'vitest';
import {
  CLIENT_STATUSES,
  loadGatewayClientProfiles,
  validateGatewayClientProfile,
} from '../../src/gateway/index.js';

describe('gateway client profiles', () => {
  it('loads bundled profiles with unique IDs and controlled statuses', () => {
    const registry = loadGatewayClientProfiles();
    const ids = registry.profiles.map((profile) => profile.id);

    expect(registry.diagnostics).toEqual([]);
    expect(ids).toContain('generic-openai');
    expect(new Set(ids).size).toBe(ids.length);
    for (const profile of registry.profiles) {
      expect(CLIENT_STATUSES).toContain(profile.status);
      expect(validateGatewayClientProfile(profile).success).toBe(true);
    }
  });

  it('does not present example-only clients as validated', () => {
    const registry = loadGatewayClientProfiles();
    const cursor = registry.profilesById.cursor;
    const codex = registry.profilesById.codex;

    expect(cursor.status).toBe('example-only');
    expect(cursor.metadata.validated_local).toBe(false);
    expect(codex.status).toBe('needs-manual-review');
  });
});
