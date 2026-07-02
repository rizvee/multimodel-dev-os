import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const tempDir = join(process.cwd(), 'temp-plugin-handler-test');

vi.mock('../../../src/core/globals.js', async (importOriginal) => {
  const original = await importOriginal();
  const path = require('path');
  return {
    ...original,
    sourceRoot: path.join(process.cwd(), 'temp-plugin-handler-test')
  };
});

import {
  handlePluginList,
  handlePluginShow,
  handlePluginValidate,
  handlePluginInstall,
  handlePluginStatus
} from '../../../src/cli/handlers/plugin.js';

describe('Plugin Handlers Suite', () => {
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

    mkdirSync(join(tempDir, '.ai', 'plugins'), { recursive: true });
    mkdirSync(join(tempDir, '.ai', 'policies'), { recursive: true });

    // Write a mock policy file
    writeFileSync(join(tempDir, '.ai', 'policies', 'registry-policy.yaml'), `
allow_remote_registries: true
max_plugin_files: 20
max_plugin_size_kb: 100
allowed_file_extensions: [".md", ".yaml", ".yml", ".json"]
allowed_write_roots: [".ai/", "adapters/"]
blocked_paths: [".env"]
`, 'utf8');

    // Write a mock plugin yaml configuration
    writeFileSync(join(tempDir, 'mock-plugin.yaml'), `
name: "Mock Plugin"
slug: "mock-plugin"
version: "1.0.0"
description: "A mock plugin for testing"
author: "Test Author"
manifest:
  files:
    - path: ".ai/plugins/mock-plugin.yaml"
      content: "manifest file content"
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

  it('handlePluginValidate should validate a plugin configuration file', () => {
    try {
      handlePluginValidate(join(tempDir, 'mock-plugin.yaml'), { target: tempDir });
    } catch (e) {
      // should exit 0
    }
    expect(logOutput.join('\n')).toContain('is fully valid and compliant!');
  });

  it('handlePluginInstall should refuse without --approved flag', () => {
    try {
      handlePluginInstall(join(tempDir, 'mock-plugin.yaml'), { target: tempDir });
    } catch (e) {
      expect(e.message).toContain('process.exit: 1');
    }
    expect(exitCode).toBe(1);
    expect(errorOutput.join('\n')).toContain('--approved');
  });

  it('handlePluginInstall should install the plugin with --approved flag', () => {
    handlePluginInstall(join(tempDir, 'mock-plugin.yaml'), { target: tempDir, approved: true });
    expect(logOutput.join('\n')).toContain('installed successfully!');
    expect(existsSync(join(tempDir, '.ai', 'plugins', 'mock-plugin.yaml'))).toBe(true);
  });

  it('handlePluginList should list installed plugins', () => {
    handlePluginList({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Installed Plugins in:');
    expect(out).toContain('Mock Plugin');
  });

  it('handlePluginShow should show details of a plugin', () => {
    handlePluginShow('mock-plugin', { target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Plugin Specifications: Mock Plugin');
    expect(out).toContain('mock-plugin');
  });

  it('handlePluginStatus should output security posture info', () => {
    handlePluginStatus({ target: tempDir });
    const out = logOutput.join('\n');
    expect(out).toContain('Auditing Plugins Status');
    expect(out).toContain('Mock Plugin');
  });
});
