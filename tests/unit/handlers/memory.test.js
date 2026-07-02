import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-memory-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-memory-handler-test')
  };
});

import {
  buildMemoryIndex,
  writeMemoryFiles,
  diffMemory,
  handleMemoryBuild,
  handleMemoryRefresh,
  handleMemoryDiff
} from '../../../src/cli/handlers/memory.js';

describe('Memory Handlers Suite', () => {
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
    writeFileSync(join(tempDir, 'AGENTS.md'), '# Guideline', 'utf8');
    writeFileSync(join(tempDir, 'MEMORY.md'), 'project memory', 'utf8');
    writeFileSync(join(tempDir, 'index.js'), 'console.log("hello");', 'utf8');
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

  it('buildMemoryIndex should scan target and return index object', () => {
    const index = buildMemoryIndex(tempDir);
    expect(index.file_count).toBeGreaterThan(0);
    expect(index.file_fingerprints['index.js']).toBeDefined();
  });

  it('writeMemoryFiles should write hash.json and summary.md', () => {
    const index = buildMemoryIndex(tempDir);
    writeMemoryFiles(tempDir, index);

    expect(existsSync(join(tempDir, '.ai', 'intelligence', 'memory.hash.json'))).toBe(true);
    expect(existsSync(join(tempDir, '.ai', 'intelligence', 'memory.summary.md'))).toBe(true);
  });

  it('diffMemory should show diff when files are added or changed', () => {
    // Modify a file
    writeFileSync(join(tempDir, 'index.js'), 'console.log("hello modified");', 'utf8');
    // Add a file
    writeFileSync(join(tempDir, 'new-file.js'), 'console.log("new");', 'utf8');

    const diff = diffMemory(tempDir);
    expect(diff.changed).toContain('index.js');
    expect(diff.added).toContain('new-file.js');

    // Revert changes
    writeFileSync(join(tempDir, 'index.js'), 'console.log("hello");', 'utf8');
    rmSync(join(tempDir, 'new-file.js'), { force: true });
  });

  it('handleMemoryBuild should initialize and write memory files', () => {
    handleMemoryBuild({ target: tempDir });
    expect(logOutput.join('\n')).toContain('Memory index built successfully!');
  });

  it('handleMemoryRefresh should refresh memory files', () => {
    handleMemoryRefresh({ target: tempDir });
    expect(logOutput.join('\n')).toContain('Memory index refreshed successfully!');
  });

  it('handleMemoryDiff should print differences to console', () => {
    // Modify index.js again
    writeFileSync(join(tempDir, 'index.js'), 'console.log("diff");', 'utf8');

    try {
      handleMemoryDiff({ target: tempDir });
    } catch (e) {
      // should exit 0 or not exit
    }
    const out = logOutput.join('\n');
    expect(out).toContain('Memory Diff Summary:');
    expect(out).toContain('index.js');

    // Revert index.js
    writeFileSync(join(tempDir, 'index.js'), 'console.log("hello");', 'utf8');
  });
});
