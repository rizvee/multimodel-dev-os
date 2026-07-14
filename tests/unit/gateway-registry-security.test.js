import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  buildGatewayRegistrySnapshot,
  isGatewayRegistrySnapshot,
} from '../../src/gateway/index.js';

function readRegistrySources() {
  const root = join(process.cwd(), 'src/gateway/registry');
  return readdirSync(root)
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(join(root, file), 'utf8'))
    .join('\n');
}

describe('gateway registry safety', () => {
  it('does not use network, process execution, env credential reads, or filesystem writes', () => {
    const source = readRegistrySources();

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/http\.request|https\.request|createConnection|createServer|\.listen\s*\(/);
    expect(source).not.toMatch(/child_process/);
    expect(source).not.toMatch(/process\.env\[/);
    expect(source).not.toMatch(/writeFile|writeFileSync|appendFile|appendFileSync|mkdir|mkdirSync|rmSync|unlinkSync/);
  });

  it('does not read environment credentials while building snapshots', () => {
    const before = process.env.FIXTURE_API_KEY;
    process.env.FIXTURE_API_KEY = 'sk-should-not-be-read';
    const result = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/valid'),
    });
    if (before === undefined) {
      delete process.env.FIXTURE_API_KEY;
    } else {
      process.env.FIXTURE_API_KEY = before;
    }

    expect(result.success).toBe(true);
    expect(JSON.stringify(result.value)).not.toContain('sk-should-not-be-read');
  });

  it('produces a valid immutable snapshot shape', () => {
    const result = buildGatewayRegistrySnapshot({
      rootDir: join(process.cwd(), 'tests/fixtures/gateway-registry/valid'),
    });

    expect(result.success).toBe(true);
    expect(isGatewayRegistrySnapshot(result.value)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(result.value.schema_version).toBe('gateway-registry.v1');
  });
});
