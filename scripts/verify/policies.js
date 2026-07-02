import { readFileSync } from 'fs';
import { join } from 'path';
import { projectRoot, stats, RED, GREEN, NC, parseYaml, computeSHA256, checkFile } from './utils.js';

export function checkYamlParserRegressions() {
  try {
    const yamlTest = `
test_flow_array: ["git", "workflow", "vcs"]
test_quoted_string: "1.0.0"
test_comment_inside: "Work with # characters" # inline comment
test_quoted_bool: "true"
`;
    const parsed = parseYaml(yamlTest);
    if (parsed &&
        Array.isArray(parsed.test_flow_array) && parsed.test_flow_array.length === 3 && parsed.test_flow_array[0] === 'git' &&
        parsed.test_quoted_string === '1.0.0' &&
        parsed.test_comment_inside === 'Work with # characters' &&
        parsed.test_quoted_bool === 'true') {
      console.log(`  ${GREEN}✓${NC} YAML parser regression fixtures passed successfully`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} YAML parser regression fixtures failed. Flow arrays, quoted types, or comment stripping is broken.`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} YAML parser regression check crashed: ${e.message}`);
    stats.fail++;
  }
}

export function checkRegistryPolicyEngine() {
  console.log('\nRegistry & Policy Engine Verification:');

  // Check policy files
  checkFile('.ai/policies/registry-policy.yaml');
  checkFile('.ai/schema/registry-policy.schema.json');
  checkFile('.ai/registries/sources.yaml');

  // Verify policy JSON schema parses
  try {
    const schemaPath = join(projectRoot, '.ai', 'schema', 'registry-policy.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    if (schema.title === 'MultiModel Dev OS Registry Policy Schema') {
      console.log(`  ${GREEN}✓${NC} registry-policy schema JSON is valid and has correct title`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} registry-policy schema JSON title mismatch`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} registry-policy schema JSON check failed: ${e.message}`);
    stats.fail++;
  }

  // Verify sources.yaml parses and contains bundled source
  try {
    const sourcesPath = join(projectRoot, '.ai', 'registries', 'sources.yaml');
    const sourcesYaml = readFileSync(sourcesPath, 'utf8');
    const parsed = parseYaml(sourcesYaml);
    const bundled = (parsed.sources || []).find(s => s.name === 'bundled');
    if (bundled && bundled.type === 'local') {
      console.log(`  ${GREEN}✓${NC} sources.yaml parsed and verified local bundled registry`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} sources.yaml does not contain valid local bundled registry`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} sources.yaml check failed: ${e.message}`);
    stats.fail++;
  }

  // Verify default policy blocks remote registries
  try {
    const policyPath = join(projectRoot, '.ai', 'policies', 'registry-policy.yaml');
    const policyYaml = readFileSync(policyPath, 'utf8');
    const parsed = parseYaml(policyYaml);
    if (parsed.allow_remote_registries === false) {
      console.log(`  ${GREEN}✓${NC} default policy blocks remote registries (allow_remote_registries = false)`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} default policy does not block remote registries`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} default policy check failed: ${e.message}`);
    stats.fail++;
  }

  // Verify SHA256 helper is deterministic and works
  try {
    const fixture = 'MultiModel Dev OS v3.0.0';
    const expectedHash = 'feba01a9e59c59a74a15769517aed5e4f5361fa3bd454f1b127357998bdebabe'; // sha256 of 'MultiModel Dev OS v3.0.0'
    const actualHash = computeSHA256(fixture);
    if (actualHash === expectedHash) {
      console.log(`  ${GREEN}✓${NC} SHA256 checksum helper verified successfully`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} SHA256 checksum helper mismatch. Expected: ${expectedHash}, Got: ${actualHash}`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} SHA256 helper check failed: ${e.message}`);
    stats.fail++;
  }
}
