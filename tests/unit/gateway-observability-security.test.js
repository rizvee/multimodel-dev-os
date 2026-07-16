import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walk(root) {
  const out = [];
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    if (stat.isFile() && full.endsWith('.js')) out.push(full);
  }
  return out;
}

describe('gateway observability security', () => {
  it('does not contain telemetry, persistence, external network, credential, or raw content retention primitives', () => {
    const source = walk(join(process.cwd(), 'src/gateway/observability')).map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(source).not.toMatch(/sentry|datadog|newrelic|segment|posthog|mixpanel/i);
    expect(source).not.toMatch(/writeFile|appendFile|mkdir|unlink|rmSync/);
    expect(source).not.toMatch(/fetch\(|https\.request|dns\.lookup|dns\.resolve/);
    expect(source).not.toMatch(/OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|process\.env\[/);
  });
});
