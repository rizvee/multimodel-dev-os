import { existsSync, readFileSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { projectRoot, stats, RED, GREEN, NC, verifyRegistryParsed, parseYaml, checkFile } from './utils.js';

export function checkRegistryParsers() {
  console.log('\nVerifying Registry Parsers and Syntax Sanity:');
  verifyRegistryParsed('.ai/models/registry.yaml', 'models');
  verifyRegistryParsed('.ai/models/providers.yaml', 'providers');
  verifyRegistryParsed('.ai/models/routing-presets.yaml', 'presets');
  verifyRegistryParsed('.ai/models/local-models.yaml', 'local_engines');
  verifyRegistryParsed('.ai/adapters/registry.yaml', 'adapters');
  verifyRegistryParsed('.ai/templates/registry.yaml', 'templates');
  verifyRegistryParsed('.ai/registries/capabilities.yaml', 'capabilities');
  verifyRegistryParsed('.ai/registries/tools.yaml', 'tools');
  verifyRegistryParsed('.ai/registries/workflows.yaml', 'workflows');
}

export function checkDashboardAndPlugins() {
  console.log('\nRunning TUI Dashboard & Plugin Pre-Flight Tests...');
  
  // Dashboard dry-run check
  try {
    const output = execSync('node bin/multimodel-dev-os.js dashboard --dry-run', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('Headless/CI Preview') && output.includes('npx multimodel-dev-os')) {
      console.log(`  ${GREEN}✓${NC} dashboard --dry-run executes successfully and displays headless preview`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} dashboard --dry-run output is missing preview strings`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} dashboard --dry-run execution failed: ${e.message}`);
    stats.fail++;
  }

  // Dashboard list-actions check
  try {
    const output = execSync('node bin/multimodel-dev-os.js dashboard --list-actions', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('Headless/CI Preview') && output.includes('npx multimodel-dev-os')) {
      console.log(`  ${GREEN}✓${NC} dashboard --list-actions executes successfully and displays headless preview`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} dashboard --list-actions output is missing preview strings`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} dashboard --list-actions execution failed: ${e.message}`);
    stats.fail++;
  }

  // Plugin validation check
  try {
    const output = execSync('node bin/multimodel-dev-os.js plugin validate .ai/plugins/plugin.example.yaml', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('fully valid and compliant')) {
      console.log(`  ${GREEN}✓${NC} plugin validate on example manifest passes successfully`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} plugin validate on example manifest failed to report compliance`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} plugin validate execution failed: ${e.message}`);
    stats.fail++;
  }

  // Plugin install refusal check (no --approved, should exit with code 1)
  try {
    execSync('node bin/multimodel-dev-os.js plugin install .ai/plugins/plugin.example.yaml', { cwd: projectRoot, stdio: 'pipe' });
    console.error(`  ${RED}✗${NC} plugin install without --approved should have exited with code 1, but exited with 0`);
    stats.fail++;
  } catch (e) {
    if (e.status === 1) {
      const stdErrOut = e.stderr ? e.stderr.toString() : '';
      const stdOutOut = e.stdout ? e.stdout.toString() : '';
      if (stdErrOut.includes('Installation refused') || stdOutOut.includes('Installation refused')) {
        console.log(`  ${GREEN}✓${NC} plugin install without --approved correctly refuses and exits with code 1`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} plugin install without --approved exited with 1 but missing refusal message`);
        stats.fail++;
      }
    } else {
      console.error(`  ${RED}✗${NC} plugin install without --approved failed with unexpected code ${e.status}: ${e.message}`);
      stats.fail++;
    }
  }

  // Plugin status check
  try {
    execSync('node bin/multimodel-dev-os.js plugin status', { cwd: projectRoot, stdio: 'ignore' });
    console.log(`  ${GREEN}✓${NC} plugin status executes without crashing`);
    stats.pass++;
  } catch (e) {
    console.error(`  ${RED}✗${NC} plugin status execution failed: ${e.message}`);
    stats.fail++;
  }
}

export function checkCatalogAndMarketplace() {
  console.log('\nRunning Catalog & Marketplace Pre-Flight Tests...');

  // Catalog list check
  try {
    const output = execSync('node bin/multimodel-dev-os.js catalog list', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('Workflow Marketplace & Plugin Catalog') && output.includes('git-workflows')) {
      console.log(`  ${GREEN}✓${NC} catalog list executes successfully and displays catalog listings`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog list output is missing catalog listings`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog list execution failed: ${e.message}`);
    stats.fail++;
  }

  // Catalog categories check
  try {
    const output = execSync('node bin/multimodel-dev-os.js catalog categories', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('Marketplace Categories') && output.includes('git')) {
      console.log(`  ${GREEN}✓${NC} catalog categories executes successfully`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog categories output is missing categories`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog categories execution failed: ${e.message}`);
    stats.fail++;
  }

  // Catalog search check
  try {
    const output = execSync('node bin/multimodel-dev-os.js catalog search release', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('Search Catalog Results') && output.includes('release-workflows')) {
      console.log(`  ${GREEN}✓${NC} catalog search release executes successfully`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog search release output is missing matches`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog search execution failed: ${e.message}`);
    stats.fail++;
  }

  // Catalog show check
  try {
    const output = execSync('node bin/multimodel-dev-os.js catalog show release-workflows', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('Catalog Plugin: Release Preparation') && output.includes('release-workflows')) {
      console.log(`  ${GREEN}✓${NC} catalog show release-workflows executes successfully`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog show output is missing details`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog show execution failed: ${e.message}`);
    stats.fail++;
  }

  // Catalog recommend check
  try {
    const output = execSync('node bin/multimodel-dev-os.js catalog recommend --target .', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('Marketplace Recommendations') && output.includes('git-workflows')) {
      console.log(`  ${GREEN}✓${NC} catalog recommend executes successfully`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog recommend output is missing recommendations`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog recommend execution failed: ${e.message}`);
    stats.fail++;
  }

  // Catalog status check
  try {
    const output = execSync('node bin/multimodel-dev-os.js catalog status --target .', { cwd: projectRoot, encoding: 'utf8' });
    if (output.includes('Auditing Catalog Plugins') && output.includes('git-workflows')) {
      console.log(`  ${GREEN}✓${NC} catalog status executes successfully`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog status output is missing audit results`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog status execution failed: ${e.message}`);
    stats.fail++;
  }

  // Catalog install refusal check (no --approved)
  try {
    execSync('node bin/multimodel-dev-os.js catalog install release-workflows', { cwd: projectRoot, stdio: 'pipe' });
    console.error(`  ${RED}✗${NC} catalog install without --approved should have exited with code 1, but exited with 0`);
    stats.fail++;
  } catch (e) {
    if (e.status === 1) {
      const stdOutOut = e.stdout ? e.stdout.toString() : '';
      const stdErrOut = e.stderr ? e.stderr.toString() : '';
      if (stdOutOut.includes('Installation refused') || stdErrOut.includes('Installation refused')) {
        console.log(`  ${GREEN}✓${NC} catalog install without --approved correctly refuses and exits with code 1`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} catalog install without --approved exited with 1 but missing refusal message`);
        stats.fail++;
      }
    } else {
      console.error(`  ${RED}✗${NC} catalog install without --approved failed with unexpected code ${e.status}: ${e.message}`);
      stats.fail++;
    }
  }

  // Catalog file checks and schema validations
  try {
    const catalogYamlPath = join(projectRoot, '.ai', 'plugins', 'catalog.yaml');
    if (existsSync(catalogYamlPath)) {
      console.log(`  ${GREEN}✓${NC} catalog.yaml file exists in registries`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog.yaml is missing`);
      stats.fail++;
    }

    // Parse and validate catalog plugins
    const catalogData = parseYaml(readFileSync(catalogYamlPath, 'utf8'));
    const plugins = (catalogData.catalog && catalogData.catalog.plugins) || [];
    let catalogValid = true;

    plugins.forEach(p => {
      const manifestPath = join(projectRoot, '.ai', 'plugins', 'catalog', `${p.slug}.yaml`);
      if (!existsSync(manifestPath)) {
        console.error(`  ${RED}✗${NC} Catalog plugin manifest missing for: ${p.slug}`);
        catalogValid = false;
      } else {
        const out = execSync(`node bin/multimodel-dev-os.js plugin validate .ai/plugins/catalog/${p.slug}.yaml`, { cwd: projectRoot, encoding: 'utf8' });
        if (!out.includes('fully valid and compliant')) {
          console.error(`  ${RED}✗${NC} Catalog plugin validate failed for: ${p.slug}`);
          catalogValid = false;
        }
      }
    });

    if (catalogValid) {
      console.log(`  ${GREEN}✓${NC} all bundled catalog plugins exist and pass validation rules`);
      stats.pass++;
    } else {
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog manifests integrity checks failed: ${e.message}`);
    stats.fail++;
  }
}

export function checkCatalogSearchEmptyState() {
  // Catalog search empty result state warning check
  try {
    const out = execSync('node bin/multimodel-dev-os.js catalog search no-match-term', { cwd: projectRoot, encoding: 'utf8' });
    if (out.includes('Warning: No plugins found matching')) {
      console.log(`  ${GREEN}✓${NC} catalog search empty state prints correct warning`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog search empty state does not print warning`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog search empty state check failed: ${e.message}`);
    stats.fail++;
  }
}

export function checkRegistryCLICommands() {
  console.log('\nRegistry & Policy Engine Verification:');

  // Verify registry CLI commands and help output flags
  try {
    const helpOutput = execSync('node bin/multimodel-dev-os.js --help', { cwd: projectRoot, encoding: 'utf8' });
    if (helpOutput.includes('registry <subcmd>') && helpOutput.includes('--all-sources')) {
      console.log(`  ${GREEN}✓${NC} CLI help output includes registry commands and flags`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} CLI help output missing registry subcommands or flags`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} CLI help check failed: ${e.message}`);
    stats.fail++;
  }

  // Verify registry status runs cleanly
  try {
    const statusOutput = execSync('node bin/multimodel-dev-os.js registry status', { cwd: projectRoot, encoding: 'utf8' });
    if (statusOutput.includes('allow_remote_registries') && statusOutput.includes('bundled')) {
      console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js registry status runs cleanly`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry status output invalid`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry status failed: ${e.message}`);
    stats.fail++;
  }

  // Verify registry list runs cleanly
  try {
    const listOutput = execSync('node bin/multimodel-dev-os.js registry list', { cwd: projectRoot, encoding: 'utf8' });
    if (listOutput.includes('bundled') && listOutput.includes('local')) {
      console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js registry list runs cleanly`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry list output invalid`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry list failed: ${e.message}`);
    stats.fail++;
  }

  // Verify registry sync checks validation behavior correctly
  try {
    try {
      execSync('node bin/multimodel-dev-os.js registry sync official', { cwd: projectRoot, stdio: 'pipe' });
      console.error(`  ${RED}✗${NC} registry sync official should have failed without --approved or because registry not found`);
      stats.fail++;
    } catch (err) {
      const errText = err.stderr ? err.stderr.toString() : '';
      const outText = err.stdout ? err.stdout.toString() : '';
      if (errText.includes('not found') || outText.includes('Registry Sync Refused')) {
        console.log(`  ${GREEN}✓${NC} registry sync checks validation behavior correctly`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} registry sync verification output mismatch: ${errText || outText}`);
        stats.fail++;
      }
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} registry sync check failed: ${e.message}`);
    stats.fail++;
  }

  // Verify registry verify bundled passes cleanly
  try {
    const verifyOutput = execSync('node bin/multimodel-dev-os.js registry verify bundled', { cwd: projectRoot, encoding: 'utf8' });
    if (verifyOutput.includes('verification passed')) {
      console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js registry verify bundled passes cleanly`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry verify bundled failed: ${verifyOutput}`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry verify bundled failed: ${e.message}`);
    stats.fail++;
  }

  // Verify registry show bundled runs cleanly
  try {
    const showOutput = execSync('node bin/multimodel-dev-os.js registry show bundled', { cwd: projectRoot, encoding: 'utf8' });
    if (showOutput.includes('bundled') && showOutput.includes('local')) {
      console.log(`  ${GREEN}✓${NC} node bin/multimodel-dev-os.js registry show bundled runs cleanly`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry show bundled failed: ${showOutput}`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} node bin/multimodel-dev-os.js registry show bundled failed: ${e.message}`);
    stats.fail++;
  }
}

export function checkSecurityHotfixRegressions() {
  console.log('\nSecurity Hotfix v3.0.2 Regression checks:');

  const tempPolicyDir = join(projectRoot, 'temp-verify-policy');
  const tempPolicySubdir = join(tempPolicyDir, '.ai', 'policies');
  const tempPolicyFile = join(tempPolicySubdir, 'registry-policy.yaml');

  try {
    mkdirSync(tempPolicySubdir, { recursive: true });
    writeFileSync(tempPolicyFile, 'allow_remote_registries: true\n', 'utf8');

    // 1. registry add rejects malformed URL
    try {
      execSync(`node bin/multimodel-dev-os.js registry add testmalformed not-a-url --approved --target "${tempPolicyDir}"`, { cwd: projectRoot, stdio: 'pipe' });
      console.error(`  ${RED}✗${NC} registry add should have rejected malformed URL`);
      stats.fail++;
    } catch (err) {
      const errText = err.stderr ? err.stderr.toString() : '';
      if (errText.includes('invalid') || errText.includes('malformed')) {
        console.log(`  ${GREEN}✓${NC} registry add rejects malformed URL`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} registry add malformed URL failed with unexpected error: ${errText}`);
        stats.fail++;
      }
    }

    // 2. registry add rejects URL containing quote/shell-injection characters
    try {
      execSync(`node bin/multimodel-dev-os.js registry add testinjection "https://example.com'console.log(1)" --approved --target "${tempPolicyDir}"`, { cwd: projectRoot, stdio: 'pipe' });
      console.error(`  ${RED}✗${NC} registry add should have rejected URL containing single quote`);
      stats.fail++;
    } catch (err) {
      const errText = err.stderr ? err.stderr.toString() : '';
      if (errText.includes('quote') || errText.includes('invalid') || errText.includes('metacharacter')) {
        console.log(`  ${GREEN}✓${NC} registry add rejects URL containing quote/shell-injection characters`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} registry add URL with quotes failed with unexpected error: ${errText}`);
        stats.fail++;
      }
    }

    // 3. registry add rejects non-HTTPS remote URL
    try {
      execSync(`node bin/multimodel-dev-os.js registry add testnonhttps http://example.com/catalog.yaml --approved --target "${tempPolicyDir}"`, { cwd: projectRoot, stdio: 'pipe' });
      console.error(`  ${RED}✗${NC} registry add should have rejected non-HTTPS URL`);
      stats.fail++;
    } catch (err) {
      const errText = err.stderr ? err.stderr.toString() : '';
      if (errText.includes('Only HTTPS is permitted') || errText.includes('protocol') || errText.includes('invalid')) {
        console.log(`  ${GREEN}✓${NC} registry add rejects non-HTTPS remote URL`);
        stats.pass++;
      } else {
        console.error(`  ${RED}✗${NC} registry add non-HTTPS URL failed with unexpected error: ${errText}`);
        stats.fail++;
      }
    }
  } catch (tempErr) {
    console.error(`  ${RED}✗${NC} Setting up temporary policy folder failed: ${tempErr.message}`);
    stats.fail++;
  } finally {
    try {
      if (existsSync(tempPolicyDir)) {
        rmSync(tempPolicyDir, { recursive: true, force: true });
      }
    } catch (e) {}
  }

  // 4. Backward compatibility catalog checks
  try {
    const catList = execSync('node bin/multimodel-dev-os.js catalog list', { cwd: projectRoot, encoding: 'utf8' });
    const catSearch = execSync('node bin/multimodel-dev-os.js catalog search release', { cwd: projectRoot, encoding: 'utf8' });
    const catRecommend = execSync('node bin/multimodel-dev-os.js catalog recommend --target .', { cwd: projectRoot, encoding: 'utf8' });
    
    if (catList.includes('Git Workflows') && catSearch.includes('Release Preparation') && catRecommend.includes('Recommendations')) {
      console.log(`  ${GREEN}✓${NC} catalog commands remain backward-compatible without remote sources`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} catalog commands backward compatibility check failed`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} catalog backward compatibility check failed: ${e.message}`);
    stats.fail++;
  }
}

export function checkSignedRegistryE2E() {
  console.log('\nSprint 3 Signed Registry E2E & Readiness Checks:');
  checkFile('src/registry/verdict.js');
  checkFile('tests/unit/registry-e2e-signature-fixtures.test.js');
  checkFile('docs/security-threat-model.md');
  checkFile('docs/v3.5.0-readiness.md');

  // Verify that the trusted-keys.yaml in the E2E fixtures directory exists
  const e2eKeysPath = 'tests/fixtures/signed-registries/trusted-keys.yaml';
  if (checkFile(e2eKeysPath)) {
    const e2eKeysContent = readFileSync(join(projectRoot, e2eKeysPath), 'utf8');
    if (e2eKeysContent.includes('test-key-valid') && e2eKeysContent.includes('test-key-revoked')) {
      console.log(`  ${GREEN}✓${NC} ${e2eKeysPath} is populated with test fixtures and marked for testing`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} ${e2eKeysPath} is missing expected test keys`);
      stats.fail++;
    }
  }
}
