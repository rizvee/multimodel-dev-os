import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-workflow-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-workflow-handler-test')
  };
});

import {
  handleWorkflowList,
  handleWorkflowShow,
  handleWorkflowPlan,
  handleWorkflowRun
} from '../../../src/cli/handlers/workflow.js';

describe('Workflow Handlers Suite', () => {
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

    mkdirSync(join(tempDir, '.ai', 'registries'), { recursive: true });

    // Write a mock workflows.yaml
    writeFileSync(join(tempDir, '.ai', 'registries', 'workflows.yaml'), `
workflows:
  test-workflow:
    name: "Test Workflow"
    description: "A workflow for testing"
    risk_level: "low"
    skill_os:
      skills:
        - release-governance
      prompts:
        - release-audit
      permissions:
        - filesystem-read
      guardrails:
        - block-destructive-git
      required_context:
        - "README.md"
    steps:
      - name: "Scan target"
        command: "scan"
      - name: "Run doctor"
        command: "doctor"
      - name: "Run manual command"
        command: "custom-cmd"
        expected_output: "something"
  legacy-workflow:
    name: "Legacy Workflow"
    description: "A workflow without Skill OS metadata"
    risk_level: "low"
    steps:
      - name: "Scan target"
        command: "scan"
`, 'utf8');
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

  it('handleWorkflowList should print registered workflows', () => {
    handleWorkflowList({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Registered Workflows');
    expect(out).toContain('Test Workflow');
    expect(out).toContain('Legacy Workflow');
  });

  it('handleWorkflowShow should display workflow details', () => {
    handleWorkflowShow('test-workflow', { target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Workflow Spec: Test Workflow');
    expect(out).toContain('Scan target');
  });

  it('handleWorkflowList should display compact Skill OS metadata counts', () => {
    handleWorkflowList({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Skill OS:');
    expect(out).toContain('1 skills, 1 prompts, 1 guardrails');
  });

  it('handleWorkflowShow should display Skill OS metadata when present', () => {
    handleWorkflowShow('test-workflow', { target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Skill OS Metadata');
    expect(out).toContain('Skills: release-governance');
    expect(out).toContain('Prompts: release-audit');
    expect(out).toContain('Permissions: filesystem-read');
    expect(out).toContain('Guardrails: block-destructive-git');
  });

  it('handleWorkflowShow should keep workflows without Skill OS metadata valid', () => {
    handleWorkflowShow('legacy-workflow', { target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Workflow Spec: Legacy Workflow');
    expect(out).not.toContain('Skill OS Metadata');
  });

  it('handleWorkflowShow should exit 1 if workflow not found', () => {
    try {
      handleWorkflowShow('unknown-workflow', { target: tempDir });
    } catch (e) {
      expect(e.message).toContain('process.exit: 1');
    }
    expect(exitCode).toBe(1);
  });

  it('handleWorkflowPlan should display execution plan dry-run', () => {
    handleWorkflowPlan('test-workflow', { target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Execution Plan for Workflow: Test Workflow');
    expect(out).toContain('DRY-RUN/PLAN ONLY');
  });

  it('handleWorkflowRun should execute workflow steps', () => {
    const mockScan = vi.fn();
    const mockDoctor = vi.fn();
    const mockVerify = vi.fn();

    // Mock internal sub-handlers by overriding in dependencies injection
    // Wait, let's pass mock functions in options or dependencies injection if supported by handleWorkflowRun
    // Let's check handleWorkflowRun signature:
    // handleWorkflowRun(wName, options, { scanTarget, detectFrameworkSignals, ... } = {})
    // Wait, the steps themselves invoke handleScan, handleDoctor, handleVerify.
    // Let's just run it, which runs the real ones on tempDir.
    handleWorkflowRun('test-workflow', { target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Running Workflow: Test Workflow');
    expect(out).toContain('[Step 1/3] Running: Scan target');
    expect(out).toContain('[Step 2/3] Running: Run doctor');
    expect(out).toContain('MANUAL ACTION NEEDED'); // for custom-cmd
  });
});
