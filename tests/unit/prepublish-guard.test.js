import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import { readFileSync } from 'fs';

describe('Prepublish Guard', () => {
  const guardPath = join(process.cwd(), 'scripts', 'prepublish-guard.js');

  it('should block publish when MMDO_ALLOW_PUBLISH is not set', () => {
    try {
      execSync(`node "${guardPath}"`, {
        stdio: 'pipe',
        env: {
          ...process.env,
          MMDO_ALLOW_PUBLISH: 'false' // explicitly set to false to override any ambient env
        }
      });
      throw new Error('Prepublish guard did not block the publish.');
    } catch (err) {
      expect(err.status).toBe(1);
      expect(err.stderr.toString()).toContain('Publishing requires explicit release approval');
    }
  });

  it('should allow publish when MMDO_ALLOW_PUBLISH=true for stable version >= 2 (or prerelease if dev version)', () => {
    const pkgData = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    const isPrerelease = pkgData.version.includes('-');
    const output = execSync(`node "${guardPath}"`, {
      env: {
        ...process.env,
        MMDO_ALLOW_PUBLISH: 'true',
        MMDO_ALLOW_PRERELEASE_PUBLISH: isPrerelease ? 'true' : undefined
      },
      encoding: 'utf8'
    });
    expect(output).toContain('Prepublish guard passed');
  });
});
