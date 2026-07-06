import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  handleSkillOsList,
  handleSkillOsShow,
  handleSkillOsStatus,
  handleSkillOsValidate,
} from '../../../src/cli/handlers/skill-os.js';

describe('Skill OS Handlers Suite', () => {
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  let logOutput = [];
  let errorOutput = [];
  let warnOutput = [];
  let exitCode = null;

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

  it('status prints registry counts', () => {
    handleSkillOsStatus({ target: process.cwd() });
    const out = logOutput.join('\n');
    expect(out).toContain('Skill OS Status');
    expect(out).toContain('Schemas: 5');
    expect(out).toContain('Skills: 7');
    expect(out).toContain('Prompt templates: 4');
    expect(out).toContain('Tool permissions: 10');
    expect(out).toContain('Agent clusters: 6');
    expect(out).toContain('Validation: passed');
  });

  it('validate passes for bundled registries', () => {
    handleSkillOsValidate({ target: process.cwd() });
    expect(logOutput.join('\n')).toContain('Validation: passed');
    expect(exitCode).toBe(null);
  });

  it('list skills prints known skill IDs', () => {
    handleSkillOsList('skills', { target: process.cwd() });
    expect(logOutput.join('\n')).toContain('- release-governance');
  });

  it('list prompts prints known prompt IDs', () => {
    handleSkillOsList('prompts', { target: process.cwd() });
    expect(logOutput.join('\n')).toContain('- release-audit');
  });

  it('list permissions prints known permission IDs', () => {
    handleSkillOsList('permissions', { target: process.cwd() });
    expect(logOutput.join('\n')).toContain('- npm-publish');
  });

  it('list clusters prints known cluster IDs', () => {
    handleSkillOsList('clusters', { target: process.cwd() });
    expect(logOutput.join('\n')).toContain('- core-technical');
  });

  it('show skill prints details', () => {
    handleSkillOsShow('skill', 'release-governance', { target: process.cwd() });
    const out = logOutput.join('\n');
    expect(out).toContain('Skill: release-governance');
    expect(out).toContain('Category: release-governance');
    expect(out).toContain('Risk: high');
    expect(out).toContain('Skill file:');
  });

  it('show prompt prints RACE+ details', () => {
    handleSkillOsShow('prompt', 'release-audit', { target: process.cwd() });
    const out = logOutput.join('\n');
    expect(out).toContain('Prompt: release-audit');
    expect(out).toContain('Role: Release engineer');
    expect(out).toContain('Expectation:');
    expect(out).toContain('Next action:');
  });

  it('show permission prints permission class', () => {
    handleSkillOsShow('permission', 'npm-publish', { target: process.cwd() });
    const out = logOutput.join('\n');
    expect(out).toContain('Permission: npm-publish');
    expect(out).toContain('Class: restricted-admin');
    expect(out).toContain('Requires confirmation: true');
  });

  it('show cluster prints cluster scope', () => {
    handleSkillOsShow('cluster', 'core-technical', { target: process.cwd() });
    const out = logOutput.join('\n');
    expect(out).toContain('Cluster: core-technical');
    expect(out).toContain('Scope:');
    expect(out).toContain('- source code');
  });

  it('invalid list type fails cleanly', () => {
    expect(() => handleSkillOsList('unknown', { target: process.cwd() })).toThrow('process.exit: 1');
    expect(exitCode).toBe(1);
    expect(errorOutput.join('\n')).toContain('Please specify a Skill OS list type');
  });

  it('missing show ID fails cleanly', () => {
    expect(() => handleSkillOsShow('skill', null, { target: process.cwd() })).toThrow('process.exit: 1');
    expect(exitCode).toBe(1);
    expect(errorOutput.join('\n')).toContain('Please specify a skill ID');
  });

  it('unknown ID fails cleanly', () => {
    expect(() => handleSkillOsShow('skill', 'unknown-skill', { target: process.cwd() })).toThrow('process.exit: 1');
    expect(exitCode).toBe(1);
    expect(errorOutput.join('\n')).toContain("Skill OS skill 'unknown-skill' not found");
  });

  it('validation failure exits non-zero', () => {
    const failure = {
      usingFallback: false,
      files: { schemas: [], registries: [] },
      registries: {},
      validation: {
        success: false,
        errors: ['skill registry broken'],
        warnings: [],
        summary: {},
      },
    };

    expect(() => handleSkillOsValidate(
      { target: process.cwd() },
      { loadSkillOsDataFn: () => failure },
    )).toThrow('process.exit: 1');
    expect(exitCode).toBe(1);
    expect(logOutput.join('\n')).toContain('Validation: failed');
    expect(errorOutput.join('\n')).toContain('skill registry broken');
  });
});
