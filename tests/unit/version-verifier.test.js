import { describe, it, expect } from 'vitest';
import { EXPECTED_LANE_VERSION, validateLaneVersion } from '../../scripts/verify/utils.js';
import { execSync } from 'child_process';
import { join } from 'path';

describe('Version Verifier & Lane Governance Policy', () => {
  it('should pass current active development lane version 4.3.0-dev.0', () => {
    const result = validateLaneVersion('4.3.0-dev.0');
    expect(result.valid).toBe(true);
  });

  it('should fail stable version 4.3.0 against current development-lane validation', () => {
    const result = validateLaneVersion('4.3.0');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not match expected development lane');
  });

  it('should fail unpromoted dev version 4.3.0-dev.1 against current lane validation', () => {
    const result = validateLaneVersion('4.3.0-dev.1');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not match expected development lane');
  });

  it('should fail old release version 4.2.0 as current package version', () => {
    const result = validateLaneVersion('4.2.0');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not match expected development lane');
  });

  it('should fail malformed semver versions', () => {
    expect(validateLaneVersion('4.3').valid).toBe(false);
    expect(validateLaneVersion('invalid-semver').valid).toBe(false);
    expect(validateLaneVersion('').valid).toBe(false);
    expect(validateLaneVersion(null).valid).toBe(false);
  });

  it('should confirm EXPECTED_LANE_VERSION is set to 4.3.0-dev.0', () => {
    expect(EXPECTED_LANE_VERSION).toBe('4.3.0-dev.0');
  });

  it('should reject publishing 4.3.0-dev.0 via prepublish guard when only MMDO_ALLOW_PUBLISH=true is set', () => {
    const guardPath = join(process.cwd(), 'scripts', 'prepublish-guard.js');
    try {
      execSync(`node "${guardPath}"`, {
        stdio: 'pipe',
        env: {
          ...process.env,
          MMDO_ALLOW_PUBLISH: 'true',
          MMDO_ALLOW_PRERELEASE_PUBLISH: undefined, // intentionally missing
        },
      });
      throw new Error('Prepublish guard did not block prerelease version 4.3.0-dev.0');
    } catch (err) {
      expect(err.status).toBe(1);
      expect(err.stderr.toString()).toContain('Blocked publishing prerelease version "4.3.0-dev.0"');
    }
  });
});
