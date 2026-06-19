import esbuild from 'esbuild';
import { existsSync, chmodSync, readFileSync } from 'fs';

const entryPoint = 'src/cli/main.js';
const outfile = 'bin/multimodel-dev-os.js';

if (!existsSync(entryPoint)) {
  console.error(`[ERROR] Entrypoint file not found: ${entryPoint}`);
  process.exit(1);
}

esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: outfile,
  banner: {
    js: `#!/usr/bin/env node\n// Generated from src/. Do not edit directly.\n`
  }
}).then(() => {
  // Post-build validation & hardening
  try {
    const content = readFileSync(outfile, 'utf8');
    
    // 1. Check shebang counts
    const shebangMatches = content.match(/^#!/g) || [];
    const totalShebangs = (content.match(/#!/g) || []).length;
    
    // We expect exactly one shebang at the very top
    if (totalShebangs !== 1 || !content.startsWith('#!/usr/bin/env node')) {
      console.error('[ERROR] Compiled output has invalid shebang configuration.');
      process.exit(1);
    }
    
    // 2. Check warning header
    if (!content.includes('// Generated from src/. Do not edit directly.')) {
      console.error('[ERROR] Compiled output is missing the generation warning header.');
      process.exit(1);
    }
    
    // 3. Check for unsafe URL interpolation patterns
    if (content.includes("mod.get('${targetUrl}'") || (content.includes('execSync(`node -e "') && content.includes('${targetUrl}'))) {
      console.error('[ERROR] Compiled output contains unsafe registry URL interpolation!');
      process.exit(1);
    }

    // 4. Set execution permissions (0755)
    chmodSync(outfile, 0o755);
    
    console.log('Build succeeded.');
  } catch (e) {
    console.error('Post-build verification failed:', e.message);
    process.exit(1);
  }
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
