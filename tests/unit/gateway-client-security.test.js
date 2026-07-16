import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('gateway client security posture', () => {
  it('contains no child process or provider credential reads', () => {
    const root = join(process.cwd(), 'src', 'gateway', 'clients');
    const files = [
      'profiles.js',
      'registry.js',
      'validation.js',
      'config-generator.js',
      'endpoint.js',
      'environment.js',
      'diagnostics.js',
      'local-harness.js',
    ];
    const source = files.map((file) => readFileSync(join(root, file), 'utf8')).join('\n');

    const executablePattern = new RegExp(`${['child', 'process'].join('_')}|exec\\(|spawn\\(|execFile\\(`);
    expect(source).not.toMatch(executablePattern);
    expect(source).not.toMatch(/OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|process\.env\[/);
  });
});
