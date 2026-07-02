import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-improve-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-improve-handler-test')
  };
});

import {
  handleImprovePropose,
  handleImproveReview,
  handleImproveStatus,
  handleImproveValidate,
  handleImproveDiff,
  handleImproveApply,
  handleImproveLog
} from '../../../src/cli/handlers/improve.js';

describe('Improve Handlers Suite', () => {
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

    mkdirSync(join(tempDir, '.ai', 'proposals'), { recursive: true });
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

  it('handleImprovePropose should create a proposal file', () => {
    handleImprovePropose({ target: tempDir });
    expect(logOutput.join('\n')).toContain('Created codebase improvement proposal');

    const files = readdirSync(join(tempDir, '.ai', 'proposals')).filter(f => f.startsWith('proposal-'));
    expect(files.length).toBeGreaterThan(0);
  });

  it('handleImproveReview should list proposals', () => {
    handleImproveReview({ target: tempDir });
    expect(logOutput.join('\n')).toContain('Improvement Proposals');
  });

  it('handleImproveStatus should show stats', () => {
    handleImproveStatus({ target: tempDir });
    expect(logOutput.join('\n')).toContain('Improvement Proposals Engine Status');
  });

  it('handleImproveValidate should validate a valid approved proposal with JSON operations block', () => {
    const proposalFile = join(tempDir, '.ai', 'proposals', 'proposal-valid.md');
    writeFileSync(proposalFile, `---
id: proposal-valid
title: Test Valid Proposal
approval_status: approved
---

# Title

\`\`\`json
{
  "operations": [
    {
      "type": "create_file",
      "path": "test-new-file.txt",
      "content": "Hello world",
      "overwrite": true
    }
  ]
}
\`\`\`
`, 'utf8');

    try {
      handleImproveValidate(proposalFile, { target: tempDir });
    } catch (e) {
      // should exit 0
    }
    expect(logOutput.join('\n')).toContain('is VALID');
  });

  it('handleImproveDiff should show diff for a valid proposal', () => {
    const proposalFile = join(tempDir, '.ai', 'proposals', 'proposal-valid.md');
    handleImproveDiff(proposalFile, { target: tempDir });
    expect(logOutput.join('\n')).toContain('Summary of Planned Changes');
  });

  it('handleImproveApply should apply the proposal and write to logs', () => {
    const proposalFile = join(tempDir, '.ai', 'proposals', 'proposal-valid.md');
    try {
      handleImproveApply(proposalFile, { target: tempDir, approved: true });
    } catch (e) {
      // should exit 0
    }
    expect(logOutput.join('\n')).toContain('applied successfully');
    expect(existsSync(join(tempDir, 'test-new-file.txt'))).toBe(true);
  });

  it('handleImproveLog should show audit log after application', () => {
    handleImproveLog({ target: tempDir });
    expect(logOutput.join('\n')).toContain('Applied Proposals Audit Log');
  });
});
