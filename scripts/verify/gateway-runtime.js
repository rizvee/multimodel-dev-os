import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { request } from 'http';
import {
  createGatewayServer,
  DEFAULT_GATEWAY_RUNTIME_CONFIG,
  validateGatewayRuntimeConfig,
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

function runtimeSource() {
  return walkFiles(join(projectRoot, 'src/gateway/runtime'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
}

function checkNoPattern(source, pattern, label) {
  if (pattern.test(source)) fail(label);
  else pass(label);
}

function checkJsonParse(paths, label) {
  try {
    for (const relPath of paths) readJson(relPath);
    pass(label);
  } catch (error) {
    fail(`${label}: ${error.message}`);
  }
}

function httpRequest({ address, method = 'GET', path = '/', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body === null ? null : Buffer.from(body);
    const req = request({
      host: '127.0.0.1',
      port: address.port,
      method,
      path,
      headers: {
        ...(payload ? { 'content-length': payload.length } : {}),
        ...headers,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function checkRuntimeSmoke() {
  const gateway = createGatewayServer({
    config: {
      host: '127.0.0.1',
      port: 0,
      request_id_factory: () => 'req-verify-runtime',
    },
  });
  try {
    const address = await gateway.start();
    const health = await httpRequest({ address, path: '/health' });
    const models = await httpRequest({ address, path: '/v1/models' });
    const chat = await httpRequest({
      address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: JSON.stringify({ model: 'mock-chat', messages: [{ role: 'user', content: 'hello' }] }),
      headers: { 'content-type': 'application/json' },
    });
    const stream = await httpRequest({
      address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: JSON.stringify({ model: 'mock-stream', stream: true, messages: [{ role: 'user', content: 'stream' }] }),
      headers: { 'content-type': 'application/json' },
    });
    const malformed = await httpRequest({
      address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: '{"',
      headers: { 'content-type': 'application/json' },
    });
    if (health.status === 200 && JSON.parse(health.body).runtime === 'mock-local') pass('Health endpoint passes on ephemeral loopback port');
    else fail('Health endpoint passes on ephemeral loopback port');
    if (models.status === 200 && JSON.parse(models.body).data.some((model) => model.id === 'mock-chat')) pass('Model listing passes');
    else fail('Model listing passes');
    if (chat.status === 200 && JSON.parse(chat.body).provider_id === 'mock') pass('Mock chat passes');
    else fail('Mock chat passes');
    if (stream.status === 200 && stream.body.includes('data: [DONE]')) pass('Mock stream passes');
    else fail('Mock stream passes');
    if (malformed.status === 400 && JSON.parse(malformed.body).error.request_id === 'req-verify-runtime') pass('Malformed request normalized');
    else fail('Malformed request normalized');
    if (health.headers['x-request-id'] === 'req-verify-runtime') pass('Request ID present');
    else fail('Request ID present');
    if (!chat.body.includes('hello')) pass('Prompt content absent from diagnostics');
    else fail('Prompt content absent from diagnostics');
  } catch (error) {
    fail(`Runtime smoke checks: ${error.message}`);
  } finally {
    await gateway.stop();
    if (gateway.state() === 'stopped') pass('Server stops cleanly');
    else fail('Server stops cleanly');
  }
}

export async function checkGatewayRuntime() {
  console.log('\nGateway Local Runtime Verification:');

  const runtimeFiles = [
    'src/gateway/runtime/server.js',
    'src/gateway/runtime/app.js',
    'src/gateway/runtime/router.js',
    'src/gateway/runtime/request-context.js',
    'src/gateway/runtime/body-reader.js',
    'src/gateway/runtime/response-writer.js',
    'src/gateway/runtime/sse.js',
    'src/gateway/runtime/limits.js',
    'src/gateway/runtime/timeouts.js',
    'src/gateway/runtime/auth.js',
    'src/gateway/runtime/lifecycle.js',
    'src/gateway/runtime/errors.js',
    'src/gateway/runtime/mock-provider.js',
    'src/gateway/runtime/index.js',
  ];
  try {
    for (const relPath of runtimeFiles) readFileSync(join(projectRoot, relPath), 'utf8');
    pass('Runtime modules exist');
  } catch (error) {
    fail(`Runtime modules exist: ${error.message}`);
  }

  checkJsonParse([
    '.ai/schema/gateway-health-response.schema.json',
    '.ai/schema/gateway-model-list.schema.json',
    '.ai/schema/gateway-runtime-state.schema.json',
    '.ai/schema/gateway-runtime-config.schema.json',
    '.ai/schema/gateway-runtime-error.schema.json',
    '.ai/schema/gateway-sse-chunk.schema.json',
  ], 'Runtime schemas parse');

  const fixtureJsonFiles = walkFiles(join(projectRoot, 'tests/fixtures/gateway-runtime'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(projectRoot, '').replace(/^[/\\]/, ''));
  checkJsonParse(fixtureJsonFiles, 'Runtime fixtures parse');

  const imported = createGatewayServer();
  if (imported.state() === 'created' && imported.address() === null) pass('Server does not start on import');
  else fail('Server does not start on import');

  if (DEFAULT_GATEWAY_RUNTIME_CONFIG.host === '127.0.0.1') pass('Default host is loopback');
  else fail('Default host is loopback');
  if (!validateGatewayRuntimeConfig({ host: '0.0.0.0' }).success) pass('Unsafe binding rejected');
  else fail('Unsafe binding rejected');
  if (!validateGatewayRuntimeConfig({ host: '192.168.1.5', allow_remote_binding: true, auth_mode: 'none-localhost-only' }).success) pass('Remote binding without auth rejected');
  else fail('Remote binding without auth rejected');

  await checkRuntimeSmoke();

  const source = runtimeSource();
  checkNoPattern(source, /\bfetch\s*\(|https\.request|dns\.lookup|dns\.resolve|child_process/, 'Runtime contains no outbound provider primitives');
  checkNoPattern(source, /OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|process\.env\[/, 'Runtime contains no provider API key reads');
  checkNoPattern(source, /@openai|anthropic|gemini|mistral|cohere/i, 'Runtime contains no provider SDK imports');
  checkNoPattern(source, /writeFile|writeFileSync|appendFile|appendFileSync|mkdir|mkdirSync|rmSync|unlinkSync/, 'Runtime contains no filesystem writes');
  checkNoPattern(source, /Access-Control-Allow-Origin['"]?\s*:\s*['"]\*/, 'Runtime does not enable wildcard CORS');

  const packageJson = readJson('package.json');
  if (packageJson.version === '4.3.0-dev.0') pass('Package version matches active development lane 4.3.0-dev.0');
  else fail(`Package version check failed: expected 4.3.0-dev.0 but found "${packageJson.version}"`);
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) pass('Runtime dependencies remain zero');
  else fail('Runtime dependencies remain zero');
}
