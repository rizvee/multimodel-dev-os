import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-inspection-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-inspection-handler-test')
  };
});

import {
  handleVerify,
  handleDoctor,
  handleValidate,
  handleValidateTemplate,
  handleValidateAdapter,
  handleValidateSkill,
  handleScan,
  handleStatus
} from '../../../src/cli/handlers/inspection.js';

describe('Inspection Handlers Suite', () => {
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  let logOutput = [];
  let errorOutput = [];
  let warnOutput = [];
  let exitCode = null;

  beforeAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });

    // Create a mock codebase structure in tempDir
    writeFileSync(join(tempDir, 'AGENTS.md'), 'build: npm run build\ntest: npm test\nlint: npm run lint', 'utf8');
    writeFileSync(join(tempDir, 'MEMORY.md'), 'project memory', 'utf8');
    writeFileSync(join(tempDir, 'TASKS.md'), '- [ ] active task', 'utf8');
    writeFileSync(join(tempDir, 'RUNBOOK.md'), 'runbook info', 'utf8');

    mkdirSync(join(tempDir, '.ai', 'policies'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'context'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'agents'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'skills'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'session-logs'), { recursive: true });

    writeFileSync(join(tempDir, '.ai', 'config.yaml'), 'gemini: true\ncursor: false', 'utf8');
    writeFileSync(join(tempDir, 'GEMINI.md'), '# Gemini Rules', 'utf8');

    // Onboarding plan/report
    writeFileSync(join(tempDir, 'onboarding.plan.json'), '{}', 'utf8');
    writeFileSync(join(tempDir, 'onboarding.report.md'), '# Onboarding Report', 'utf8');

    // Write a .gitignore
    writeFileSync(join(tempDir, '.gitignore'), 'node_modules\n.env\nonboarding.plan.json\nonboarding.report.md', 'utf8');

    // Context files
    const contextFiles = [
      'project-brief.md',
      'architecture.md',
      'business-rules.md',
      'seo-rules.md',
      'deployment-rules.md',
      'model-map.md',
      'context-budget.md'
    ];
    contextFiles.forEach(f => {
      writeFileSync(join(tempDir, '.ai', 'context', f), '# ' + f, 'utf8');
    });

    // Agent files
    const agentFiles = [
      'multimodel-orchestrator.md',
      'planner.md',
      'coder.md',
      'reviewer.md',
      'qa-tester.md',
      'security-auditor.md',
      'seo-auditor.md',
      'devops.md'
    ];
    agentFiles.forEach(f => {
      writeFileSync(join(tempDir, '.ai', 'agents', f), '# ' + f, 'utf8');
    });
  });

  afterAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    logOutput = [];
    errorOutput = [];
    warnOutput = [];
    exitCode = null;

    console.log = (...args) => { logOutput.push(args.join(' ')); };
    console.error = (...args) => { errorOutput.push(args.join(' ')); };
    console.warn = (...args) => { warnOutput.push(args.join(' ')); };
    process.exit = (code) => {
      exitCode = code;
      throw new Error(`process.exit: ${code}`);
    };
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    process.exit = originalExit;
  });

  it('handleVerify should pass on complete workspace', () => {
    try {
      handleVerify({ target: tempDir });
    } catch (e) {
      // should exit 0
    }
    expect(exitCode).toBe(0);
    expect(logOutput.join('\n')).toContain('Verification PASSED');
  });

  it('handleVerify should fail on incomplete workspace', () => {
    // Delete a crucial file
    rmSync(join(tempDir, 'AGENTS.md'), { force: true });
    try {
      handleVerify({ target: tempDir });
    } catch (e) {
      expect(e.message).toContain('process.exit: 1');
    }
    expect(exitCode).toBe(1);
    expect(errorOutput.join('\n')).toContain('AGENTS.md (missing)');

    // Restore it
    writeFileSync(join(tempDir, 'AGENTS.md'), 'build: npm run build\ntest: npm test\nlint: npm run lint', 'utf8');
  });

  it('handleDoctor should diagnostics and pass warning-free if layout is clean', () => {
    handleDoctor({ target: tempDir });
    expect(logOutput.join('\n')).toContain('layout is pristine');
  });

  it('handleDoctor should warnings on missing gitignore items', () => {
    writeFileSync(join(tempDir, '.gitignore'), '', 'utf8'); // empty gitignore
    handleDoctor({ target: tempDir });
    const warnings = warnOutput.join('\n');
    expect(warnings).toContain('.gitignore is missing node_modules');
    expect(warnings).toContain('.gitignore is missing .env');

    // Restore gitignore
    writeFileSync(join(tempDir, '.gitignore'), 'node_modules\n.env\nonboarding.plan.json\nonboarding.report.md', 'utf8');
  });

  it('handleValidate should pass on clean structure', () => {
    try {
      handleValidate({ target: tempDir });
    } catch (e) {
      // should exit 0
    }
    expect(exitCode).toBe(0);
    expect(logOutput.join('\n')).toContain('structure is strictly compliant');
  });

  it('handleValidateSkill should validate valid skill headers', () => {
    const skillFile = join(tempDir, '.ai', 'skills', 'test-skill.md');
    writeFileSync(skillFile, `
# Purpose
Purpose section...
# Activation Trigger
Trigger section...
# Input Context
Context...
# Output Contract
Contract...
# Token Budget
Budget...
`, 'utf8');

    try {
      handleValidateSkill('test-skill', { target: tempDir });
    } catch (e) {
      // should exit 0
    }
    expect(exitCode).toBe(0);
    expect(logOutput.join('\n')).toContain('fully valid and compliant');
  });

  it('handleScan should output codebase stats and signals', () => {
    handleScan({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Codebase Scan target');
    expect(out).toContain('File Count:');
  });

  it('handleStatus should display repo intelligence status', () => {
    const mockDiffMemory = () => ({
      added: [],
      removed: [],
      changed: []
    });
    handleStatus({ target: tempDir }, { diffMemory: mockDiffMemory });
    const out = logOutput.join('\n');
    expect(out).toContain('Repository Intelligence Status');
  });
});
