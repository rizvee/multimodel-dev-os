import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  buildGatewayRegistrySnapshot,
  getModel,
  getProvider,
  listLocalModels,
  listModels,
  listProviders,
  listRoutingPresets,
} from '../../src/gateway/index.js';
import { stats, GREEN, RED, NC, projectRoot } from './utils.js';
import { execFileSync } from 'child_process';

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

function readRegistrySource() {
  const root = join(projectRoot, 'src/gateway/registry');
  return readdirSync(root)
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(join(root, file), 'utf8'))
    .join('\n');
}

function checkCliSmoke(args, label) {
  try {
    execFileSync('node', ['bin/multimodel-dev-os.js', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    pass(label);
  } catch (error) {
    fail(`${label}: ${error.message}`);
  }
}

function checkNoPattern(source, pattern, label) {
  if (pattern.test(source)) {
    fail(label);
  } else {
    pass(label);
  }
}

export function checkGatewayRegistry() {
  console.log('\nGateway Runtime Registry Verification:');

  const sourceFiles = [
    'src/gateway/registry/loader.js',
    'src/gateway/registry/normalization.js',
    'src/gateway/registry/validation.js',
    'src/gateway/registry/provider-registry.js',
    'src/gateway/registry/model-registry.js',
    'src/gateway/registry/local-model-registry.js',
    'src/gateway/registry/routing-preset-registry.js',
    'src/gateway/registry/snapshot.js',
    'src/gateway/registry/errors.js',
    'src/gateway/registry/index.js',
  ];
  const schemaFiles = [
    '.ai/schema/runtime-provider.schema.json',
    '.ai/schema/runtime-model.schema.json',
    '.ai/schema/runtime-local-model.schema.json',
    '.ai/schema/runtime-routing-preset.schema.json',
    '.ai/schema/gateway-registry-snapshot.schema.json',
  ];

  if (sourceFiles.every((relPath) => readFileSync(join(projectRoot, relPath), 'utf8'))) {
    pass('Runtime registry modules exist');
  } else {
    fail('Runtime registry modules exist');
  }

  try {
    for (const relPath of schemaFiles) {
      readJson(relPath);
    }
    pass('Runtime registry schemas parse');
  } catch (error) {
    fail(`Runtime registry schemas parse: ${error.message}`);
  }

  const result = buildGatewayRegistrySnapshot({ rootDir: projectRoot });
  const snapshot = result.value;
  if (result.success) {
    pass('Bundled provider/model registries load successfully');
  } else {
    fail(`Bundled provider/model registries load successfully: ${result.diagnostics.errors.map((error) => error.message).join('; ')}`);
  }

  if (snapshot.providers.length > 0 && snapshot.models.length > 0 && snapshot.local_models.length > 0 && snapshot.routing_presets.length > 0) {
    pass('Normalized registry snapshots contain all registry families');
  } else {
    fail('Normalized registry snapshots contain all registry families');
  }

  const uniqueProviderIds = new Set(snapshot.providers.map((provider) => provider.id));
  const uniqueModelIds = new Set(snapshot.models.map((model) => model.id));
  if (uniqueProviderIds.size === snapshot.providers.length && uniqueModelIds.size === snapshot.models.length) {
    pass('Normalized IDs are unique');
  } else {
    fail('Normalized IDs are unique');
  }

  if (result.success) {
    pass('Cross references pass');
  } else {
    fail('Cross references pass');
  }

  const providerUrlsSafe = snapshot.providers.every((provider) => provider.local || provider.base_url?.startsWith('https://'));
  if (providerUrlsSafe) {
    pass('Provider URLs are metadata-safe');
  } else {
    fail('Provider URLs are metadata-safe');
  }

  const credentialEnvSafe = snapshot.providers.every((provider) => provider.credential_env === null || /^[A-Z][A-Z0-9_]*$/.test(provider.credential_env));
  if (credentialEnvSafe) {
    pass('Credential fields contain environment names only');
  } else {
    fail('Credential fields contain environment names only');
  }

  const localEndpointsSafe = snapshot.local_models.every((model) => model.endpoint === null || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(model.endpoint));
  if (localEndpointsSafe) {
    pass('Local endpoints are local');
  } else {
    fail('Local endpoints are local');
  }

  const serialized = JSON.stringify(snapshot);
  if (!/(sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,})/.test(serialized)) {
    pass('Registry snapshots contain no secret values');
  } else {
    fail('Registry snapshots contain no secret values');
  }

  if (getProvider(snapshot, snapshot.providers[0].id) && getModel(snapshot, snapshot.models[0].id)) {
    pass('Provider and model lookup APIs work');
  } else {
    fail('Provider and model lookup APIs work');
  }

  if (listProviders(snapshot).length > 0 && listModels(snapshot).length > 0 && listLocalModels(snapshot).length > 0 && listRoutingPresets(snapshot).length > 0) {
    pass('Registry list APIs work');
  } else {
    fail('Registry list APIs work');
  }

  const source = readRegistrySource();
  checkNoPattern(source, /\bfetch\s*\(|http\.request|https\.request|createConnection|createServer|\.listen\s*\(/, 'Registry loader contains no network operations');
  checkNoPattern(source, /process\.env\[/, 'Registry loader does not read provider credential environment variables');
  checkNoPattern(source, /writeFile|writeFileSync|appendFile|appendFileSync|mkdir|mkdirSync|rmSync|unlinkSync/, 'Registry modules perform no writes');

  checkCliSmoke(['models'], 'Existing models CLI remains functional');
  checkCliSmoke(['providers'], 'Existing providers CLI remains functional');
  checkCliSmoke(['route-model', 'coding'], 'Existing route-model CLI remains functional');

  const packageJson = readJson('package.json');
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
    pass('Package runtime dependencies remain zero');
  } else {
    fail('Package runtime dependencies remain zero');
  }
}
