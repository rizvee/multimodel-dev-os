import esbuild from 'esbuild';
import { readFileSync, unlinkSync, existsSync } from 'fs';

const entryPoint = 'src/cli/main.js';
const currentFile = 'bin/multimodel-dev-os.js';
const tempFile = 'bin/multimodel-dev-os.tmp.js';

if (!existsSync(entryPoint)) {
  console.error(`[ERROR] Entrypoint file not found: ${entryPoint}`);
  process.exit(1);
}

if (!existsSync(currentFile)) {
  console.error(`[ERROR] Current build file not found: ${currentFile}`);
  console.error('Generated CLI is stale. Run npm run build and commit bin/multimodel-dev-os.js.');
  process.exit(1);
}

try {
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: tempFile,
    banner: {
      js: `#!/usr/bin/env node\n// Generated from src/. Do not edit directly.\n`
    }
  });

  const currentContent = readFileSync(currentFile, 'utf8');
  const tempContent = readFileSync(tempFile, 'utf8');

  // Clean up temp file immediately
  unlinkSync(tempFile);

  const normalize = str => str.replace(/\r\n/g, '\n');

  if (normalize(currentContent) !== normalize(tempContent)) {
    console.error('[ERROR] Generated CLI is stale. Run npm run build and commit bin/multimodel-dev-os.js.');
    process.exit(1);
  }

  console.log('Generated CLI is fresh.');
  process.exit(0);
} catch (err) {
  console.error('Build freshness check failed:', err);
  if (existsSync(tempFile)) {
    unlinkSync(tempFile);
  }
  process.exit(1);
}
