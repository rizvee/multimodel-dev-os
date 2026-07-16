import { readdirSync, readFileSync, statSync } from 'fs';
import { request } from 'http';
import { join } from 'path';
import {
  buildGatewayRegistrySnapshot,
  createGatewayObservabilityCollector,
  createGatewayServer,
  DEFAULT_GATEWAY_RUNTIME_CONFIG,
  dryRunGatewayRoute,
  generateGatewayClientConfig,
  redactGatewayObservability,
  simulateGatewayResilience,
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

function sourceFor(relPath) {
  return walkFiles(join(projectRoot, relPath))
    .filter((file) => file.endsWith('.js'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
}

function check(condition, label) {
  if (condition) pass(label);
  else fail(label);
}

function checkNoPattern(source, pattern, label) {
  check(!pattern.test(source), label);
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

async function checkLocalRuntimeReadiness() {
  const collector = createGatewayObservabilityCollector({
    config: { expose_http_endpoints: true, max_events: 25, max_traces: 25, max_usage_records: 25 },
  });
  const gateway = createGatewayServer({
    config: {
      host: '127.0.0.1',
      port: 0,
      request_id_factory: () => 'req-readiness',
      observability: { expose_http_endpoints: true },
    },
    observability: collector,
  });
  try {
    const address = await gateway.start();
    const health = await httpRequest({ address, path: '/health' });
    const models = await httpRequest({ address, path: '/v1/models' });
    const chat = await httpRequest({
      address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: JSON.stringify({ model: 'mock-chat', messages: [{ role: 'user', content: 'readiness prompt should not persist' }] }),
      headers: { 'content-type': 'application/json' },
    });
    const stream = await httpRequest({
      address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: JSON.stringify({ model: 'mock-stream', stream: true, messages: [{ role: 'user', content: 'stream readiness prompt' }] }),
      headers: { 'content-type': 'application/json' },
    });
    const invalid = await httpRequest({
      address,
      method: 'POST',
      path: '/v1/chat/completions',
      body: '{"',
      headers: { 'content-type': 'application/json' },
    });
    const metrics = await httpRequest({ address, path: '/v1/gateway/metrics' });
    const providerHealth = await httpRequest({ address, path: '/v1/gateway/health/providers' });
    const traces = await httpRequest({ address, path: '/v1/gateway/traces?limit=5' });
    const combined = [metrics.body, providerHealth.body, traces.body].join('\n');

    check(health.status === 200 && JSON.parse(health.body).runtime === 'mock-local', 'Readiness health smoke passes');
    check(models.status === 200 && JSON.parse(models.body).data.every((model) => model.id.startsWith('mock-')), 'Readiness models expose executable mock models only');
    check(chat.status === 200 && JSON.parse(chat.body).provider_id === 'mock', 'Readiness chat smoke passes');
    check(stream.status === 200 && stream.body.includes('data: [DONE]'), 'Readiness stream smoke passes');
    check(invalid.status === 400 && JSON.parse(invalid.body).error.request_id === 'req-readiness', 'Readiness invalid request is normalized');
    check(metrics.status === 200 && JSON.parse(metrics.body).requests_total >= 1, 'Readiness metrics endpoint smoke passes when enabled');
    check(providerHealth.status === 200 && JSON.parse(providerHealth.body).data.some((entry) => entry.provider_id === 'mock'), 'Readiness provider health endpoint smoke passes when enabled');
    check(traces.status === 200 && Array.isArray(JSON.parse(traces.body).data), 'Readiness trace endpoint is bounded and readable when enabled');
    check(!/readiness prompt|stream readiness prompt|authorization|Bearer\s+/i.test(combined), 'Readiness observability output omits prompts and authorization data');
  } catch (error) {
    fail(`Readiness local runtime smoke: ${error.message}`);
  } finally {
    await gateway.stop();
    check(gateway.state() === 'stopped', 'Readiness local runtime stops cleanly');
  }
}

export async function checkGatewayReleaseReadiness() {
  console.log('\nGateway Release Readiness Verification:');

  const gatewayExports = await import('../../src/gateway/index.js');
  check(Object.keys(gatewayExports).length > 0, 'Gateway layers import from public index');
  const importedServer = createGatewayServer();
  check(importedServer.state() === 'created' && importedServer.address() === null, 'Gateway runtime does not start on import');
  await importedServer.stop();

  check(DEFAULT_GATEWAY_RUNTIME_CONFIG.host === '127.0.0.1', 'Default runtime binding is loopback');
  check(!validateGatewayRuntimeConfig({ host: '0.0.0.0' }).success, 'Unsafe wildcard binding is rejected by default');
  check(!validateGatewayRuntimeConfig({ host: '192.168.1.10', allow_remote_binding: true, auth_mode: 'none-localhost-only' }).success, 'Remote binding without auth is rejected');

  const snapshot = buildGatewayRegistrySnapshot({ rootDir: projectRoot });
  check(snapshot.success && snapshot.value.providers.length > 0, 'Bundled gateway registry snapshot builds');
  check(snapshot.value.providers.filter((provider) => provider.id !== 'mock').every((provider) => provider.enabled === false || provider.status !== 'executable'), 'External providers remain non-executable metadata');

  const route = dryRunGatewayRoute({
    snapshot: snapshot.value,
    request: { requested_model: 'gpt-coding-latest' },
    requestId: 'route-readiness',
  });
  check(route.executed === false && route.decision?.selected_model === 'gpt-coding-latest', 'Deterministic route dry-run remains non-executing');

  const resilience = simulateGatewayResilience({
    routeDecision: route.decision,
    outcomes: [{ provider_id: route.decision?.selected_provider, model_id: route.decision?.selected_model, result: 'success' }],
    requestId: 'resilience-readiness',
    startTime: 1800000000000,
  });
  check(resilience.mode === 'simulation' && resilience.executed === false && resilience.final_status === 'planned-success', 'Resilience simulation remains non-executing');

  const clientPlan = generateGatewayClientConfig({
    clientId: 'generic-openai',
    endpoint: { port: 8787 },
    model: 'mock-chat',
    auth: { mode: 'bearer-token', token_env: 'MMDO_GATEWAY_TOKEN' },
    workspaceRoot: projectRoot,
  });
  check(clientPlan.writes_performed === false && clientPlan.mode === 'preview', 'Client configuration plans are preview-only');
  check(clientPlan.files.every((file) => !file.relative_path.includes('..') && file.contains_secrets === false), 'Client configuration paths are safe and secret-free');
  check(!clientPlan.files.map((file) => file.content).join('\n').includes('Bearer test-token'), 'Client configuration contains no raw token values');

  const collector = createGatewayObservabilityCollector({ config: { max_events: 1, max_traces: 1, max_usage_records: 1 } });
  collector.recordEvent({ event_id: 'evt-1', type: 'request-received' });
  collector.recordEvent({ event_id: 'evt-2', type: 'request-completed' });
  check(collector.getEvents().map((event) => event.event_id).join(',') === 'evt-2', 'Observability collector is bounded');
  const redacted = JSON.stringify(redactGatewayObservability({
    authorization: 'Bearer secret',
    prompt: 'sensitive prompt',
    path: 'C:\\Users\\ADMIN\\secret.txt',
  }));
  check(!redacted.includes('Bearer secret') && !redacted.includes('sensitive prompt') && !redacted.includes('C:\\Users\\ADMIN'), 'Observability redaction removes secrets, prompts, and local paths');

  const schemas = walkFiles(join(projectRoot, '.ai/schema'))
    .filter((file) => file.endsWith('.json') && file.includes('gateway'))
    .map((file) => file.replace(projectRoot, '').replace(/^[/\\]/, ''));
  try {
    for (const schema of schemas) readJson(schema);
    pass('Gateway schemas parse for release readiness');
  } catch (error) {
    fail(`Gateway schemas parse for release readiness: ${error.message}`);
  }

  await checkLocalRuntimeReadiness();

  const gatewaySource = sourceFor('src/gateway');
  checkNoPattern(gatewaySource, /OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|COHERE_API_KEY|MISTRAL_API_KEY|process\.env\[/, 'Gateway source contains no provider credential reads');
  checkNoPattern(gatewaySource, /https\.request|dns\.lookup|dns\.resolve|child_process|exec\(|spawn\(/, 'Gateway source contains no external provider/network or process execution primitives');
  checkNoPattern(gatewaySource, /writeFile|writeFileSync|appendFile|appendFileSync|mkdir|mkdirSync|unlink|rmSync/, 'Gateway source contains no runtime persistence writes');

  const docsSource = [
    readFileSync(join(projectRoot, 'README.md'), 'utf8'),
    ...walkFiles(join(projectRoot, 'docs')).filter((file) => file.endsWith('.md')).map((file) => readFileSync(file, 'utf8')),
  ].join('\n');
  checkNoPattern(docsSource, /fully OpenAI compatible|all clients supported|external providers enabled|automatic failover active|live retry enabled|gateway[^.\n]{0,80}production-ready|production-ready[^.\n]{0,80}gateway/i, 'Public docs avoid false gateway readiness claims');

  const packageJson = readJson('package.json');
  check(packageJson.version === '4.2.0-dev.0', 'Package version remains 4.2.0-dev.0');
  check(!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0, 'Runtime dependencies remain zero');
}
