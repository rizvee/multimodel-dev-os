#!/usr/bin/env node

/**
 * MultiModel Dev OS - Prepublish Guard
 * Blocks accidental npm publications.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 1. Check environment variable override
if (process.env.MMDO_ALLOW_PUBLISH !== 'true') {
  console.error('\n\x1b[31m[ABORT] Publishing requires explicit release approval. Set MMDO_ALLOW_PUBLISH=true only during an approved npm publish.\x1b[0m');
  console.error('To override this guard during the approved release, set the environment variable:');
  console.log('  \x1b[33mMMDO_ALLOW_PUBLISH=true\x1b[0m\n');
  process.exit(1);
}

// 2. Enforce package version begins with '2.'
try {
  const packageJsonPath = join(projectRoot, 'package.json');
  if (existsSync(packageJsonPath)) {
    const pkgData = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const version = pkgData.version || '';
    if (!version.startsWith('2.')) {
      console.error(`\n\x1b[31m[ABORT] Blocked publishing version ${version}.\x1b[0m`);
      console.error('Only major v2 version package releases (version starting with "2.") are permitted.');
      console.log('Update the version in package.json to v2.0.0 or higher.\n');
      process.exit(1);
    }
  }
} catch (e) {
  console.error(`\n\x1b[31m[ERROR] Failed to read package.json version: ${e.message}\x1b[0m\n`);
  process.exit(1);
}

console.log('\x1b[32m✔ Prepublish guard passed. Proceeding with approved publication...\x1b[0m');
process.exit(0);
