import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('Build Output Verification', () => {
  const buildPath = join(process.cwd(), 'bin', 'multimodel-dev-os.js');

  it('should compile the output file successfully', () => {
    expect(existsSync(buildPath)).toBe(true);
  });

  it('should contain exactly one shebang at the top', () => {
    const content = readFileSync(buildPath, 'utf8');
    const totalShebangs = (content.match(/#!/g) || []).length;
    
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    expect(totalShebangs).toBe(1);
  });

  it('should contain the generation warning header', () => {
    const content = readFileSync(buildPath, 'utf8');
    expect(content).toContain('// Generated from src/. Do not edit directly.');
  });

  it('should not contain dangerous registry URL interpolation', () => {
    const content = readFileSync(buildPath, 'utf8');
    
    const hasUnsafeSync = content.includes("mod.get('${targetUrl}'") || (content.includes('execSync(`node -e "') && content.includes('${targetUrl}'));
    expect(hasUnsafeSync).toBe(false);
    
    expect(content).toContain('execFileSync(process.execPath');
  });

  it('should be completely fresh and match the source modules', () => {
    expect(() => {
      execSync('node scripts/check-build-fresh.js', { stdio: 'ignore' });
    }).not.toThrow();
  });
});
