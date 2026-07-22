import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  buildGatewayRegistrySnapshot,
  dryRunGatewayRoute,
  resolveGatewayRoute,
  tryResolveGatewayRoute,
} from '../../src/gateway/index.js';
import { stats, GREEN, RED, NC, projectRoot } from './utils.js';

function pass(message) {
  console.log(`  ${GREEN}[ok]${NC} ${message}`);
  stats.pass++;
}

function fail(message) {
  console.error(`  ${RED}[x]${NC} ${message}`);
  stats.fail++;
}

function readJson(relPath) {
  return JSON.parse(readFileSync(join(projectRoot, relPath), 'utf8'));
}

function walkFiles(root) {
  const files = [];
  for (const entry of readdirSync(root)) {
    const fullPath = join(root, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...walkFiles(fullPath));
    if (stat.isFile()) files.push(fullPath);
  }
  return files;
}

function routerSource() {
  return walkFiles(join(projectRoot, 'src/gateway/router'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
}

function checkNoPattern(source, pattern, label) {
  if (pattern.test(source)) {
    fail(label);
  } else {
    pass(label);
  }
}

function checkJsonParse(paths, label) {
  try {
    for (const relPath of paths) readJson(relPath);
    pass(label);
  } catch (error) {
    fail(`${label}: ${error.message}`);
  }
}

export function checkGatewayRouter() {
  console.log('\nGateway Deterministic Router Verification:');

  const routerFiles = [
    'src/gateway/router/candidates.js',
    'src/gateway/router/filters.js',
    'src/gateway/router/policy.js',
    'src/gateway/router/scoring.js',
    'src/gateway/router/strategies.js',
    'src/gateway/router/fallback.js',
    'src/gateway/router/explanation.js',
    'src/gateway/router/route-resolver.js',
    'src/gateway/router/errors.js',
    'src/gateway/router/index.js',
  ];
  try {
    for (const relPath of routerFiles) readFileSync(join(projectRoot, relPath), 'utf8');
    pass('Router modules exist');
  } catch (error) {
    fail(`Router modules exist: ${error.message}`);
  }

  checkJsonParse([
    '.ai/schema/routing-policy.schema.json',
    '.ai/schema/route-candidate.schema.json',
    '.ai/schema/route-explanation.schema.json',
    '.ai/schema/gateway-dry-run.schema.json',
  ], 'Router schemas parse');

  const fixtureJsonFiles = walkFiles(join(projectRoot, 'tests/fixtures/gateway-routing'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(projectRoot, '').replace(/^[/\\]/, ''));
  checkJsonParse(fixtureJsonFiles, 'Routing fixtures parse');

  const snapshotResult = buildGatewayRegistrySnapshot({ rootDir: projectRoot });
  if (!snapshotResult.success) {
    fail('Bundled registry snapshot can be routed deterministically');
    return;
  }

  const request = {
    required_capabilities: ['tools'],
    estimated_input_tokens: 1000,
    required_context_window: 4000,
    privacy_policy: 'standard',
    fallback_allowed: true,
    metadata: { requested_output_tokens: 500 },
  };
  const options = {
    snapshot: snapshotResult.value,
    request,
    requestId: 'verify-route',
    decisionTime: 1800000000,
  };
  const first = resolveGatewayRoute(options);
  const second = resolveGatewayRoute(options);
  if (JSON.stringify(first) === JSON.stringify(second)) {
    pass('Repeated route resolution is equivalent');
  } else {
    fail('Repeated route resolution is equivalent');
  }

  const reversed = {
    ...snapshotResult.value,
    providers: [...snapshotResult.value.providers].reverse(),
    models: [...snapshotResult.value.models].reverse(),
    local_models: [...snapshotResult.value.local_models].reverse(),
  };
  const reversedDecision = resolveGatewayRoute({ ...options, snapshot: reversed });
  if (first.selected_provider === reversedDecision.selected_provider && first.selected_model === reversedDecision.selected_model) {
    pass('Input candidate order does not change route result');
  } else {
    fail('Input candidate order does not change route result');
  }

  const noViable = tryResolveGatewayRoute({
    snapshot: snapshotResult.value,
    request: { required_capabilities: ['audio'] },
    requestId: 'verify-no-viable',
    decisionTime: 1800000000,
  });
  if (!noViable.success && noViable.error.error.cause === 'no_viable_candidate') {
    pass('No-viable-candidate returns normalized error');
  } else {
    fail('No-viable-candidate returns normalized error');
  }

  const dryRun = dryRunGatewayRoute(options);
  if (dryRun.executed === false && dryRun.mode === 'dry-run') {
    pass('Dry-run reports executed false');
  } else {
    fail('Dry-run reports executed false');
  }
  if (first.fallback_chain.every((entry) => entry.reasons.join(' ').includes('planned'))) {
    pass('Fallback planning executes nothing');
  } else {
    fail('Fallback planning executes nothing');
  }
  const serialized = JSON.stringify(dryRun);
  if (!serialized.includes('secret prompt') && !/(sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{12,})/.test(serialized)) {
    pass('Explanation contains no prompt bodies or credentials');
  } else {
    fail('Explanation contains no prompt bodies or credentials');
  }

  const source = routerSource();
  checkNoPattern(source, /\bfetch\s*\(|http\.request|https\.request|createConnection|createServer|\.listen\s*\(/, 'Router code contains no network calls or server creation');
  checkNoPattern(source, /child_process|@openai|openai|anthropic|gemini/i, 'Router code contains no provider SDK imports');
  checkNoPattern(source, /process\.env\[/, 'Router code contains no environment credential reads');
  checkNoPattern(source, /writeFile|writeFileSync|appendFile|appendFileSync|mkdir|mkdirSync|rmSync|unlinkSync/, 'Router code contains no filesystem writes');

  const packageJson = readJson('package.json');
  if (packageJson.version === '4.3.0-dev.0') pass('Package version matches active development lane 4.3.0-dev.0');
  else fail(`Package version check failed: expected 4.3.0-dev.0 but found "${packageJson.version}"`);
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
    pass('Runtime dependencies remain zero');
  } else {
    fail('Runtime dependencies remain zero');
  }
}
