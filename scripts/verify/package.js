import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync, spawnSync } from 'child_process';
import { projectRoot, stats, RED, GREEN, YELLOW, NC, checkFile } from './utils.js';

export function verifyPackage() {
  console.log('\nRunning CLI & Packaging Pre-Flight Tests...');

  // 1. Verify package.json version dynamically
  let expectedVersion = '';
  try {
    const pkgData = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
    expectedVersion = pkgData.version;
    if (!expectedVersion || !/^\d+\.\d+\.\d+/.test(expectedVersion)) {
      console.error(`  ${RED}✗${NC} package.json version is invalid (found ${expectedVersion})`);
      stats.fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} package.json version is valid: ${expectedVersion}`);
      stats.pass++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} Failed to parse package.json: ${e.message}`);
    stats.fail++;
  }

  // 2. Verify CLI help displays current version dynamically
  try {
    const helpOutput = execSync('node bin/multimodel-dev-os.js --help', { cwd: projectRoot, encoding: 'utf8' });
    if (!helpOutput.includes(`v${expectedVersion}`)) {
      console.error(`  ${RED}✗${NC} CLI help does not display v${expectedVersion}`);
      stats.fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} CLI help displays v${expectedVersion}`);
      stats.pass++;
    }
    
    if (helpOutput.includes('scan') && helpOutput.includes('memory') && helpOutput.includes('status') && helpOutput.includes('workflow') && helpOutput.includes('handoff')) {
      console.log(`  ${GREEN}✓${NC} CLI help includes scan, memory, status, workflow, and handoff commands`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} CLI help is missing scan, memory, status, workflow, or handoff commands`);
      stats.fail++;
    }

    if (helpOutput.includes('dashboard') && helpOutput.includes('ui') && helpOutput.includes('plugin')) {
      console.log(`  ${GREEN}✓${NC} CLI help includes dashboard, ui, and plugin commands`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} CLI help is missing dashboard, ui, or plugin commands`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js --help failed: ${e.message}`);
    stats.fail++;
  }

  // 3. Verify prepublish guard behavior
  try {
    // Test 1: Blocks without MMDO_ALLOW_PUBLISH
    try {
      execSync('node scripts/prepublish-guard.js', { 
        cwd: projectRoot, 
        env: { ...process.env, MMDO_ALLOW_PUBLISH: 'false' }, 
        stdio: 'pipe' 
      });
      console.error(`  ${RED}✗${NC} prepublish-guard should have failed without MMDO_ALLOW_PUBLISH=true`);
      stats.fail++;
    } catch (err) {
      const output = err.stderr ? err.stderr.toString() : '';
      if (output.includes('Publishing requires explicit release approval')) {
        console.log(`  ${GREEN}✓${NC} prepublish guard blocks without MMDO_ALLOW_PUBLISH`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} prepublish guard failed with unexpected error: ${output}`);
        stats.fail++;
      }
    }

    // Test 2: Allows the current package version with MMDO_ALLOW_PUBLISH=true
    try {
      const output = execSync('node scripts/prepublish-guard.js', { 
        cwd: projectRoot, 
        env: { ...process.env, MMDO_ALLOW_PUBLISH: 'true' }, 
        encoding: 'utf8' 
      });
      if (output.includes('Prepublish guard passed')) {
        console.log(`  ${GREEN}✓${NC} prepublish guard allows version ${expectedVersion} when MMDO_ALLOW_PUBLISH=true`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} prepublish guard passed but stdout missing success indicator`);
        stats.fail++;
      }
    } catch (err) {
      const errText = err.stderr ? err.stderr.toString() : '';
      console.error(`  ${RED}✗${NC} prepublish guard blocked version ${expectedVersion}: ${errText || err.message}`);
      stats.fail++;
    }

    // Test 3: Guard output no longer has "Only major v2" wording
    const guardCode = readFileSync(join(projectRoot, 'scripts', 'prepublish-guard.js'), 'utf8');
    if (guardCode.includes('Only major v2')) {
      console.error(`  ${RED}✗${NC} prepublish-guard still contains "Only major v2" wording`);
      stats.fail++;
    } else {
      console.log(`  ${GREEN}✓${NC} prepublish guard no longer has "Only major v2" wording`);
      stats.pass++;
    }

    // Test 4: Package.json version is exactly the prepared patch release.
    if (expectedVersion === '4.0.1') {
      console.log(`  ${GREEN}✓${NC} package.json version is exactly 4.0.1`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} package.json version is not 4.0.1 (found ${expectedVersion})`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} prepublish guard checks failed: ${e.message}`);
    stats.fail++;
  }

  // 4. Verify npm pack dry-run shows current version dynamically and has clean hygiene
  verifyNpmPack(expectedVersion);

  // 5. Verify package safety & hygiene checks
  verifyHygiene();
}

function verifyNpmPack(expectedVersion) {
  try {
    const packResult_spawn = spawnSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: projectRoot,
      env: { ...process.env, MMDO_ALLOW_PUBLISH: 'true' },
      encoding: 'utf8',
    });
    if (packResult_spawn.status !== 0 && !packResult_spawn.stdout) {
      throw new Error(`npm pack --dry-run --json exited ${packResult_spawn.status}: ${packResult_spawn.stderr}`);
    }
    const packJsonOutput = packResult_spawn.stdout || '';

    let packData;
    try {
      packData = JSON.parse(packJsonOutput);
    } catch (jsonErr) {
      throw new Error(`JSON parse failed: ${jsonErr.message}\nRaw output: ${packJsonOutput.slice(0, 500)}`);
    }

    const packResult = Array.isArray(packData) ? packData[0] : packData;
    const packedVersion = packResult && packResult.version;
    const files = (packResult && Array.isArray(packResult.files)) ? packResult.files.map(f => f.path || f) : [];

    if (packedVersion === expectedVersion) {
      console.log(`  ${GREEN}✓${NC} npm pack --dry-run reports version ${expectedVersion}`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} npm pack --dry-run reported version ${packedVersion}, expected ${expectedVersion}`);
      stats.fail++;
    }

    const hasSrc = files.some(f => String(f).startsWith('src/') || String(f).startsWith('src\\'));
    const hasTests = files.some(f => String(f).startsWith('tests/') || String(f).startsWith('tests\\'));
    if (hasSrc && hasTests) {
      console.log(`  ${GREEN}✓${NC} npm pack includes 'src/' and 'tests/' directories`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} npm pack is missing 'src/' or 'tests/' directory (found: ${files.slice(0,5).join(', ')})`);
      stats.fail++;
    }

    const blacklistedFiles = files.filter(f => {
      const p = String(f);
      return p.includes('.npmrc') || p.includes('.env') || p.includes('node_modules') || p.endsWith('.tgz') || p.includes('coverage/');
    });
    if (blacklistedFiles.length === 0) {
      console.log(`  ${GREEN}✓${NC} npm pack excludes sensitive and temporary files (.npmrc, .env, node_modules, .tgz, coverage)`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} npm pack contains blacklisted files: ${blacklistedFiles.join(', ')}`);
      stats.fail++;
    }
  } catch (e) {
    // Fallback: re-run with --no-progress text mode and do best-effort string checks
    try {
      const packOutput = execSync('npm pack --dry-run --no-progress 2>&1', {
        cwd: projectRoot,
        env: { ...process.env, MMDO_ALLOW_PUBLISH: 'true' },
        encoding: 'utf8',
      });
      const clean = packOutput.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
      const hasVersion = clean.includes(`multimodel-dev-os@${expectedVersion}`) || clean.includes(`multimodel-dev-os-${expectedVersion}.tgz`) || clean.includes(`version:          ${expectedVersion}`);
      if (hasVersion) {
        console.log(`  ${GREEN}✓${NC} npm pack --dry-run reports version ${expectedVersion}`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} npm pack --dry-run did not report ${expectedVersion}`);
        stats.fail++;
      }

      if (clean.includes('src/') && clean.includes('tests/')) {
        console.log(`  ${GREEN}✓${NC} npm pack includes 'src/' and 'tests/' directories`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} npm pack is missing 'src/' or 'tests/' directory`);
        stats.fail++;
      }

      const cleanNoTgz = clean.replace(new RegExp(`multimodel-dev-os-${expectedVersion}\\.tgz`, 'g'), '');
      const hasBlacklisted = cleanNoTgz.includes('.npmrc') || cleanNoTgz.includes('.env') || cleanNoTgz.includes('node_modules') || cleanNoTgz.includes('.tgz') || cleanNoTgz.includes('coverage/');
      if (!hasBlacklisted) {
        console.log(`  ${GREEN}✓${NC} npm pack excludes sensitive and temporary files (.npmrc, .env, node_modules, .tgz, coverage)`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} npm pack text output contains blacklisted patterns (fallback check)`);
        stats.fail++;
      }
    } catch (e2) {
      console.error(`  ${RED}✗${NC} npm pack --dry-run failed: ${e2.message}`);
      stats.fail += 3;
    }
  }
}

function verifyHygiene() {
  console.log('\nPackage Safety & Hygiene Checks:');
  if (existsSync(join(projectRoot, '.npmrc')) && process.env.MMDO_ALLOW_PUBLISH !== 'true' && process.env.CI !== 'true' && process.env.MMDO_CI_VERIFICATION !== 'true') {
    console.error(`  ${RED}✗ .npmrc file exists in package root (security risk)${NC}`);
    stats.fail++;
  } else {
    if (existsSync(join(projectRoot, '.npmrc'))) {
      const reason = process.env.CI === 'true' ? 'CI' : (process.env.MMDO_CI_VERIFICATION === 'true' ? 'MMDO_CI_VERIFICATION' : 'MMDO_ALLOW_PUBLISH');
      console.log(`  ${YELLOW}!${NC} .npmrc file present in package root (allowed via ${reason})`);
      stats.warn++;
    } else {
      console.log(`  ${GREEN}✓${NC} No .npmrc file present in package root`);
      stats.pass++;
    }
  }

  const checkExamplesHygiene = (dir) => {
    if (!existsSync(dir)) return;
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          checkExamplesHygiene(fullPath);
        } else if (stat.isFile()) {
          if (item === '.env' || item.endsWith('.keystore') || item.endsWith('.jks')) {
            console.error(`  ${RED}✗ Unsafe file found inside examples: ${fullPath.replace(projectRoot, '')}${NC}`);
            stats.fail++;
          }
        }
      } catch (e) {}
    }
  };
  checkExamplesHygiene(join(projectRoot, 'examples'));
}
