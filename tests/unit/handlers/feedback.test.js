import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-feedback-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-feedback-handler-test')
  };
});

import {
  handleFeedbackAdd,
  handleFeedbackList,
  handleFeedbackSummarize
} from '../../../src/cli/handlers/feedback.js';

describe('Feedback Handlers Suite', () => {
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalArgv = process.argv;

  let logOutput = [];
  let errorOutput = [];
  let warnOutput = [];
  let exitCode = null;

  beforeAll(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    mkdirSync(tempDir, { recursive: true });

    mkdirSync(join(tempDir, '.ai', 'intelligence'), { recursive: true });
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
    process.argv = originalArgv;
  });

  it('handleFeedbackAdd should fail when no text is provided', () => {
    process.argv = ['node', 'bin/multimodel-dev-os.js', 'feedback', 'add'];
    try {
      handleFeedbackAdd({ target: tempDir });
    } catch (e) {
      expect(e.message).toContain('process.exit: 1');
    }
    expect(exitCode).toBe(1);
    expect(errorOutput.join('\n')).toContain('Please provide feedback text');
  });

  it('handleFeedbackAdd should add feedback successfully', () => {
    process.argv = ['node', 'bin/multimodel-dev-os.js', 'feedback', 'add', 'Prefer CSS modules'];
    handleFeedbackAdd({ target: tempDir, type: 'style', tags: 'css,style', files: 'src/style.css' });
    expect(logOutput.join('\n')).toContain('Feedback successfully added');

    const logFile = join(tempDir, '.ai', 'intelligence', 'feedback-log.jsonl');
    expect(existsSync(logFile)).toBe(true);

    const logContent = readFileSync(logFile, 'utf8');
    expect(logContent).toContain('Prefer CSS modules');
  });

  it('handleFeedbackAdd should avoid duplicate feedback entries', () => {
    process.argv = ['node', 'bin/multimodel-dev-os.js', 'feedback', 'add', 'Prefer CSS modules'];
    logOutput = [];
    handleFeedbackAdd({ target: tempDir, type: 'style', tags: 'css,style', files: 'src/style.css' });
    expect(logOutput.join('\n')).toContain('Feedback already exists. Skipping duplicate entry.');
  });

  it('handleFeedbackList should print log entries', () => {
    handleFeedbackList({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Logged Feedback Entries');
    expect(out).toContain('Prefer CSS modules');
  });

  it('handleFeedbackSummarize should compile feedback entries to markdown', () => {
    handleFeedbackSummarize({ target: tempDir });
    expect(logOutput.join('\n')).toContain('Compiled 1 feedback items into learning rules');

    const learningRulesFile = join(tempDir, '.ai', 'intelligence', 'learning-rules.md');
    expect(existsSync(learningRulesFile)).toBe(true);

    const content = readFileSync(learningRulesFile, 'utf8');
    expect(content).toContain('Compiled Learning Rules');
    expect(content).toContain('Prefer CSS modules');
  });
});
