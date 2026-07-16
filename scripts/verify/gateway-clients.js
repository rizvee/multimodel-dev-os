import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  generateGatewayClientConfig,
  listGatewayClientProfiles,
  loadGatewayClientProfiles,
  normalizeGatewayEndpointConfig,
  testGatewayClientPlan,
  validateGatewayClientCompatibility,
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

function checkJsonParse(paths, label) {
  try {
    for (const relPath of paths) readJson(relPath);
    pass(label);
  } catch (error) {
    fail(`${label}: ${error.message}`);
  }
}

function sourceFor(relPath) {
  return walkFiles(join(projectRoot, relPath))
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
}

function checkNoPattern(source, pattern, label) {
  if (pattern.test(source)) fail(label);
  else pass(label);
}

export async function checkGatewayClients() {
  console.log('\nGateway Client Integration Verification:');

  const required = [
    '.ai/registries/gateway-clients.yaml',
    '.ai/schema/gateway-client-profile.schema.json',
    '.ai/schema/gateway-client-config-plan.schema.json',
    '.ai/schema/gateway-endpoint-config.schema.json',
    '.ai/schema/gateway-client-validation.schema.json',
  ];
  try {
    for (const relPath of required) readFileSync(join(projectRoot, relPath), 'utf8');
    pass('Gateway client registry and schemas exist');
  } catch (error) {
    fail(`Gateway client registry and schemas exist: ${error.message}`);
  }

  checkJsonParse(required.filter((path) => path.endsWith('.json')), 'Gateway client schemas parse');
  const fixtureJsonFiles = walkFiles(join(projectRoot, 'tests/fixtures/gateway-clients'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(projectRoot, '').replace(/^[/\\]/, ''));
  checkJsonParse(fixtureJsonFiles, 'Gateway client fixtures parse');

  const registry = loadGatewayClientProfiles({ rootDir: projectRoot });
  if (registry.diagnostics.length === 0 && registry.profiles.length >= 12) pass('Client profiles validate');
  else fail(`Client profiles validate: ${JSON.stringify(registry.diagnostics)}`);

  const ids = registry.profiles.map((profile) => profile.id);
  if (new Set(ids).size === ids.length) pass('Client profile IDs are unique');
  else fail('Client profile IDs are unique');

  const profiles = listGatewayClientProfiles({ rootDir: projectRoot });
  if (profiles.filter((profile) => profile.status === 'validated').every((profile) => profile.metadata?.validated_local === true)) {
    pass('Compatibility statuses are honest');
  } else {
    fail('Compatibility statuses are honest');
  }

  const endpoint = normalizeGatewayEndpointConfig();
  if (endpoint.base_url === 'http://127.0.0.1:8787/v1') pass('Endpoint defaults to loopback');
  else fail('Endpoint defaults to loopback');

  const genericPlan = generateGatewayClientConfig({ clientId: 'generic-openai', workspaceRoot: projectRoot });
  if (genericPlan.writes_performed === false && genericPlan.files.every((file) => file.action === 'preview')) pass('Preview performs no writes');
  else fail('Preview performs no writes');
  if (genericPlan.files.every((file) => file.relative_path.startsWith('.ai/gateway-clients/') && !file.relative_path.includes('..'))) pass('Generated paths stay inside workspace');
  else fail('Generated paths stay inside workspace');
  if (!JSON.stringify(genericPlan).match(/sk-[A-Za-z0-9]|Bearer [A-Za-z0-9]{8,}/)) pass('Generated config contains no raw secrets');
  else fail('Generated config contains no raw secrets');

  const compatibility = validateGatewayClientCompatibility({ client: registry.profilesById['generic-openai'], endpoint, model: 'mock-chat' });
  if (compatibility.level === 'validated-local' && compatibility.compatible === true) pass('Validated-local profiles pass compatibility checks');
  else fail('Validated-local profiles pass compatibility checks');
  if (registry.profilesById.cursor.status === 'example-only' && registry.profilesById.cursor.metadata.validated_local === false) pass('Example-only profiles remain labeled correctly');
  else fail('Example-only profiles remain labeled correctly');

  const localResult = await testGatewayClientPlan({ clientPlan: genericPlan });
  if (localResult.passed && localResult.executed_external_client === false && localResult.external_provider_called === false) pass('Validated-local profiles pass local mock tests');
  else fail('Validated-local profiles pass local mock tests');

  const source = sourceFor('src/gateway/clients');
  const executablePattern = new RegExp(`${['child', 'process'].join('_')}|exec\\(|spawn\\(|execFile\\(`);
  checkNoPattern(source, executablePattern, 'Client modules do not invoke external executables');
  checkNoPattern(source, /OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|COHERE_API_KEY|MISTRAL_API_KEY|process\.env\[/, 'Client modules do not read provider credentials');
  checkNoPattern(source, /homedir\(|\.cursor|\.continue|\.cline|\.aider|global config/i, 'Client modules do not target global configuration paths');
  checkNoPattern(source, /https:\/\/api\.openai\.com|https:\/\/api\.anthropic\.com|generativelanguage\.googleapis\.com/, 'Client modules contain no executable external provider endpoints');

  const packageJson = readJson('package.json');
  if (packageJson.version === '4.2.0-dev.0') pass('Package version remains 4.2.0-dev.0');
  else fail('Package version remains 4.2.0-dev.0');
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) pass('Runtime dependencies remain zero');
  else fail('Runtime dependencies remain zero');
}
