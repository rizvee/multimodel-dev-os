import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  createGatewayObservabilityCollector,
  estimateGatewayCost,
  metadataOnlyProviderHealth,
  normalizeGatewayObservabilityConfig,
  redactGatewayObservability,
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

export async function checkGatewayObservability() {
  console.log('\nGateway Observability Verification:');

  const modules = [
    'src/gateway/observability/collector.js',
    'src/gateway/observability/events.js',
    'src/gateway/observability/traces.js',
    'src/gateway/observability/usage.js',
    'src/gateway/observability/cost.js',
    'src/gateway/observability/metrics.js',
    'src/gateway/observability/health.js',
    'src/gateway/observability/redaction.js',
    'src/gateway/observability/queries.js',
    'src/gateway/observability/snapshot.js',
    'src/gateway/observability/index.js',
  ];
  try {
    for (const relPath of modules) readFileSync(join(projectRoot, relPath), 'utf8');
    pass('Observability modules exist');
  } catch (error) {
    fail(`Observability modules exist: ${error.message}`);
  }

  checkJsonParse([
    '.ai/schema/gateway-observability-config.schema.json',
    '.ai/schema/gateway-observability-event.schema.json',
    '.ai/schema/gateway-trace.schema.json',
    '.ai/schema/gateway-usage-record.schema.json',
    '.ai/schema/gateway-cost-estimate.schema.json',
    '.ai/schema/gateway-metrics.schema.json',
    '.ai/schema/gateway-provider-health.schema.json',
    '.ai/schema/gateway-observability-snapshot.schema.json',
  ], 'Observability schemas parse');

  const fixtureJsonFiles = walkFiles(join(projectRoot, 'tests/fixtures/gateway-observability'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(projectRoot, '').replace(/^[/\\]/, ''));
  checkJsonParse(fixtureJsonFiles, 'Observability fixtures parse');

  const collector = createGatewayObservabilityCollector({ config: { max_events: 2, max_traces: 2, max_usage_records: 2 }, timeFactory: () => 1800000000000 });
  collector.recordEvent({ event_id: 'evt-1', type: 'request-received' });
  collector.recordEvent({ event_id: 'evt-2', type: 'request-completed' });
  collector.recordEvent({ event_id: 'evt-3', type: 'request-failed' });
  if (collector.getEvents().map((event) => event.event_id).join(',') === 'evt-2,evt-3') pass('Collector is bounded');
  else fail('Collector is bounded');

  const second = createGatewayObservabilityCollector();
  if (second.getEvents().length === 0) pass('Collector is not global');
  else fail('Collector is not global');

  const config = normalizeGatewayObservabilityConfig();
  if (config.retain_prompt_content === false) pass('Prompt retention defaults false');
  else fail('Prompt retention defaults false');
  if (config.retain_response_content === false) pass('Response retention defaults false');
  else fail('Response retention defaults false');
  if (redactGatewayObservability({ authorization: 'Bearer token-value' }).authorization === '[REDACTED]') pass('Authorization always redacted');
  else fail('Authorization always redacted');

  const cost = estimateGatewayCost({ usage: { input_tokens: 1000, output_tokens: 1000 }, pricing: { input_cost: 1, output_cost: 2, currency: 'USD' } });
  if (cost.total_cost === 0.003 && cost.pricing_source === 'supplied') pass('Static cost estimation uses local metadata only');
  else fail('Static cost estimation uses local metadata only');
  if (estimateGatewayCost({ usage: { input_tokens: 1, output_tokens: 1 }, pricing: {} }).total_cost === null) pass('Unknown pricing does not become zero');
  else fail('Unknown pricing does not become zero');

  collector.recordTrace({ trace_id: 'trc-1', request_id: 'req-1', started_at: 1, completed_at: 2, duration_ms: 1, success: true });
  if (collector.getMetrics().requests_total === 1) pass('Metrics are deterministic');
  else fail('Metrics are deterministic');

  collector.updateHealth({ provider_id: 'mock', status: 'healthy', executable: true, local: true, request_count: 1 });
  if (collector.getHealth().mock.status === 'healthy') pass('Mock health snapshots work');
  else fail('Mock health snapshots work');
  if (metadataOnlyProviderHealth({ id: 'external' }).executable === false) pass('External providers stay non-executable');
  else fail('External providers stay non-executable');

  const source = sourceFor('src/gateway/observability');
  checkNoPattern(source, /writeFile|writeFileSync|appendFile|appendFileSync|mkdir|mkdirSync|rmSync|unlinkSync/, 'No persistent logs');
  checkNoPattern(source, /telemetry|sentry|datadog|newrelic|segment|posthog|mixpanel/i, 'No telemetry upload or analytics SDK');
  checkNoPattern(source, /OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|process\.env\[/, 'No provider API key reads');
  checkNoPattern(source, /\bfetch\s*\(|https\.request|dns\.lookup|dns\.resolve|child_process/, 'No external network requests');

  const packageJson = readJson('package.json');
  if (packageJson.version === '4.2.0') pass('Package version remains 4.2.0');
  else fail('Package version remains 4.2.0');
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) pass('Runtime dependencies remain zero');
  else fail('Runtime dependencies remain zero');
}
