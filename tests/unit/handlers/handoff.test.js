import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-handoff-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-handoff-handler-test')
  };
});

import {
  handleHandoffBuild,
  handleHandoffShow
} from '../../../src/cli/handlers/handoff.js';

describe('Handoff Handlers Suite', () => {
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

    // Mock project structure
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'mock-project',
      version: '1.2.3'
    }), 'utf8');

    mkdirSync(join(tempDir, '.ai', 'intelligence'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'proposals'), { recursive: true });

    // Write a mock config.yaml so next steps will be memory-based rather than bootstrap-based
    writeFileSync(join(tempDir, '.ai', 'config.yaml'), 'gemini: true', 'utf8');
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

  it('handleHandoffBuild should build handoff file', () => {
    const mockDiffMemory = () => ({ added: [], removed: [], changed: [] });

    handleHandoffBuild({ target: tempDir }, { diffMemory: mockDiffMemory });
    expect(logOutput.join('\n')).toContain('Handoff context built successfully');

    const handoffFile = join(tempDir, '.ai', 'intelligence', 'handoff.md');
    expect(existsSync(handoffFile)).toBe(true);

    const content = readFileSync(handoffFile, 'utf8');
    expect(content).toContain('Name**: mock-project');
    expect(content).toContain('Version**: 1.2.3');
  });

  it('handleHandoffShow should show handoff output', () => {
    const mockDiffMemory = () => ({ added: [], removed: [], changed: [] });

    logOutput = [];
    handleHandoffShow({ target: tempDir }, { diffMemory: mockDiffMemory });
    const out = logOutput.join('\n');
    expect(out).toContain('Agent Handoff Spec');
    expect(out).toContain('mock-project');
  });
});
