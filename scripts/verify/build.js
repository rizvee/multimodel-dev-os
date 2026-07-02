import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { projectRoot, stats, RED, GREEN, NC } from './utils.js';

export function checkBuildOutput() {
  console.log('\nPost-build Generated CLI Checks:');
  try {
    // 1. Check build freshness
    try {
      execSync('node scripts/check-build-fresh.js', { cwd: projectRoot, stdio: 'ignore' });
      console.log(`  ${GREEN}✓${NC} generated bin matches current source layout`);
      stats.pass++;
    } catch (err) {
      console.error(`  ${RED}✗${NC} generated bin is stale! Run 'npm run build' and commit bin/multimodel-dev-os.js`);
      stats.fail++;
    }

    const buildPath = join(projectRoot, 'bin', 'multimodel-dev-os.js');
    if (!existsSync(buildPath)) {
      console.error(`  ${RED}✗${NC} bin/multimodel-dev-os.js (missing)`);
      stats.fail++;
      return;
    }

    const binContent = readFileSync(buildPath, 'utf8');
    
    // 2. Shebang count check
    const totalShebangs = (binContent.match(/#!/g) || []).length;
    if (binContent.startsWith('#!/usr/bin/env node') && totalShebangs === 1) {
      console.log(`  ${GREEN}✓${NC} generated bin has exactly one shebang at the top`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} generated bin has invalid shebang layout (count: ${totalShebangs})`);
      stats.fail++;
    }
    
    // 3. Warning header check
    if (binContent.includes('// Generated from src/. Do not edit directly.')) {
      console.log(`  ${GREEN}✓${NC} generated bin has warning header`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} generated bin is missing the warning header`);
      stats.fail++;
    }
    
    // 4. Safety checks for URL interpolation
    const hasUnsafeSync = binContent.includes("mod.get('${targetUrl}'") || (binContent.includes('execSync(`node -e "') && binContent.includes('${targetUrl}'));
    if (!hasUnsafeSync && /execFileSync\d*\(process\.execPath/.test(binContent)) {
      console.log(`  ${GREEN}✓${NC} generated bin is free of unsafe URL interpolation and uses execFileSync`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} generated bin fails safety scan (unsafe interpolation found)`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} post-build generated CLI checks failed: ${e.message}`);
    stats.fail++;
  }

  // 5. Codebase structural checks for shell-based fetch URL interpolation (redundancy check in original)
  try {
    const buildPath = join(projectRoot, 'bin', 'multimodel-dev-os.js');
    if (existsSync(buildPath)) {
      const cliCode = readFileSync(buildPath, 'utf8');
      const hasUnsafeSync = cliCode.includes("mod.get('${targetUrl}'") || (cliCode.includes('execSync(`node -e "') && cliCode.includes('${targetUrl}'));
      const usesExecFileSync = /execFileSync\d*\(process\.execPath/.test(cliCode);
      
      if (!hasUnsafeSync && usesExecFileSync) {
        console.log(`  ${GREEN}✓${NC} fetch helper uses execFileSync and does not use shell-based URL interpolation`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} codebase security check failed. Unsafe shell execution or URL interpolation detected.`);
        stats.fail++;
      }
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} codebase structural check failed: ${e.message}`);
    stats.fail++;
  }
}
