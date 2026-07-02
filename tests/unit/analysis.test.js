import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import {
  scanTarget,
  detectFrameworkSignals,
  detectDependencySignals,
  detectAiDevOsSignals,
  detectRisks,
  getAnalysis
} from '../../src/core/analysis.js';

describe('Core Analysis Module', () => {
  const tempDir = join(process.cwd(), 'temp-analysis-test');

  beforeAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });

    // Mock project structure
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      dependencies: {
        react: '^18.2.0',
        vite: '^5.0.0'
      }
    }), 'utf8');

    writeFileSync(join(tempDir, 'package-lock.json'), '{}', 'utf8');
    writeFileSync(join(tempDir, 'AGENTS.md'), '# Agents configuration', 'utf8');
    writeFileSync(join(tempDir, 'MEMORY.md'), '# Project Memory\nnull\nnull\nnull\nnull', 'utf8');
    writeFileSync(join(tempDir, 'next.config.js'), '// Next config', 'utf8');
    writeFileSync(join(tempDir, 'tsconfig.json'), '{}', 'utf8');
    writeFileSync(join(tempDir, 'main.js'), 'console.log("main");', 'utf8'); // Extra JS file to make jsCount > mdCount

    // Create a subfolder to check scanTarget walking
    const srcDir = join(tempDir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'index.js'), 'console.log("hello");', 'utf8');

    // Create a dot-env file that should be ignored or risk-alerted
    writeFileSync(join(tempDir, '.env'), 'SECRET_KEY=123', 'utf8');

    // Create a large config file to trigger risk
    writeFileSync(join(tempDir, 'large-config.json'), 'a'.repeat(60000), 'utf8');
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should scan target workspace recursively, ignoring node_modules/git etc.', () => {
    const result = scanTarget(tempDir);
    expect(result.files).toBeDefined();
    expect(result.files.length).toBeGreaterThan(0);

    const indexFile = result.files.find(f => f.relPath === 'src/index.js');
    expect(indexFile).toBeDefined();
    expect(indexFile.size).toBe(21);
  });

  it('should detect framework signals', () => {
    const { files } = scanTarget(tempDir);
    const frameworks = detectFrameworkSignals(files, tempDir);
    expect(frameworks).toContain('Node.js');
    expect(frameworks).toContain('Next.js');
    expect(frameworks).toContain('React');
    expect(frameworks).toContain('TypeScript');
    expect(frameworks).toContain('Vite');
  });

  it('should detect dependency/package manager signals', () => {
    const { files } = scanTarget(tempDir);
    const deps = detectDependencySignals(files, tempDir);
    expect(deps).toContain('npm');
  });

  it('should detect AI Dev OS signals', () => {
    const { files } = scanTarget(tempDir);
    const signals = detectAiDevOsSignals(files);
    expect(signals).toContain('AGENTS.md');
    expect(signals).toContain('MEMORY.md');
  });

  it('should detect codebase risks (e.g. unignored node_modules, large config files)', () => {
    const { files } = scanTarget(tempDir);
    const risks = detectRisks(files, tempDir);
    
    const largeConfigRisk = risks.find(r => r.file_pattern === 'large-config.json');
    expect(largeConfigRisk).toBeDefined();
    expect(largeConfigRisk.severity).toBe('medium');
    expect(largeConfigRisk.risk_description).toContain('Large config file');
  });

  it('should return aggregate analysis object via getAnalysis', () => {
    const analysis = getAnalysis(tempDir);
    expect(analysis.language).toBe('JS');
    expect(analysis.repoType).toBe('app');
    expect(analysis.filesCount).toBeGreaterThan(0);
    expect(analysis.packageScripts).toBeDefined();
  });
});
