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

// 2. Read and validate package version
try {
  const packageJsonPath = join(projectRoot, 'package.json');
  if (existsSync(packageJsonPath)) {
    const pkgData = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const version = pkgData.version || '';

    // Semver regex pattern
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    const match = version.match(semverRegex);

    if (!match) {
      console.error(`\n\x1b[31m[ABORT] Blocked publishing version "${version}". Invalid semver format.\x1b[0m\n`);
      process.exit(1);
    }

    const major = parseInt(match[1], 10);
    const prerelease = match[4];

    // Block versions below 2.0.0
    if (major < 2) {
      console.error(`\n\x1b[31m[ABORT] Blocked publishing version "${version}". Only stable major versions >=2 are permitted.\x1b[0m\n`);
      process.exit(1);
    }

    // Block prerelease versions unless MMDO_ALLOW_PRERELEASE_PUBLISH=true
    if (prerelease && process.env.MMDO_ALLOW_PRERELEASE_PUBLISH !== 'true') {
      console.error(`\n\x1b[31m[ABORT] Blocked publishing prerelease version "${version}".\x1b[0m`);
      console.error('To publish prereleases, you must set: MMDO_ALLOW_PRERELEASE_PUBLISH=true\n');
      process.exit(1);
    }
  } else {
    console.error('\n\x1b[31m[ERROR] package.json not found.\x1b[0m\n');
    process.exit(1);
  }
} catch (e) {
  console.error(`\n\x1b[31m[ERROR] Failed to read package.json version: ${e.message}\x1b[0m\n`);
  process.exit(1);
}

console.log('\x1b[32m✔ Prepublish guard passed. Proceeding with approved publication...\x1b[0m');
process.exit(0);
