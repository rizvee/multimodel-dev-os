import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/cli/main.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'bin/multimodel-dev-os.js',
  banner: {
    js: `#!/usr/bin/env node\n// Generated from src/. Do not edit directly.\n`
  }
}).then(() => {
  console.log('Build succeeded.');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
