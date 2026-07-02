import { execSync } from 'child_process';
import { projectRoot, stats, RED, GREEN, NC } from './utils.js';

export function checkDryRunVerifyCommand() {
  try {
    execSync('node bin/multimodel-dev-os.js verify', { cwd: projectRoot, stdio: 'ignore' });
    console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js verify`);
    stats.pass++;
  } catch (e) {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js verify failed: ${e.message}`);
    stats.fail++;
  }
}
