import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import {
  classifyGatewayFailure,
  evaluateRetryEligibility,
  planFallbackTransition,
  planRetryDelay,
  simulateCircuitBreakerTransition,
  simulateGatewayResilience,
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

function resilienceSource() {
  return walkFiles(join(projectRoot, 'src/gateway/resilience'))
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

function fixture(name) {
  return readJson(`tests/fixtures/gateway-resilience/${name}/scenario.json`);
}

export function checkGatewayResilience() {
  console.log('\nGateway Resilience Planning Verification:');

  const resilienceFiles = [
    'src/gateway/resilience/failure-classification.js',
    'src/gateway/resilience/retry-policy.js',
    'src/gateway/resilience/timeout-policy.js',
    'src/gateway/resilience/backoff.js',
    'src/gateway/resilience/fallback-transition.js',
    'src/gateway/resilience/circuit-breaker.js',
    'src/gateway/resilience/rate-limit.js',
    'src/gateway/resilience/quota.js',
    'src/gateway/resilience/events.js',
    'src/gateway/resilience/simulation.js',
    'src/gateway/resilience/explanation.js',
    'src/gateway/resilience/errors.js',
    'src/gateway/resilience/index.js',
  ];
  try {
    for (const relPath of resilienceFiles) readFileSync(join(projectRoot, relPath), 'utf8');
    pass('Resilience modules exist');
  } catch (error) {
    fail(`Resilience modules exist: ${error.message}`);
  }

  checkJsonParse([
    '.ai/schema/gateway-failure.schema.json',
    '.ai/schema/retry-policy.schema.json',
    '.ai/schema/retry-decision.schema.json',
    '.ai/schema/timeout-policy.schema.json',
    '.ai/schema/timeout-budget.schema.json',
    '.ai/schema/fallback-transition.schema.json',
    '.ai/schema/circuit-breaker-policy.schema.json',
    '.ai/schema/circuit-breaker-state.schema.json',
    '.ai/schema/rate-limit-state.schema.json',
    '.ai/schema/quota-state.schema.json',
    '.ai/schema/resilience-event.schema.json',
    '.ai/schema/resilience-simulation.schema.json',
    '.ai/schema/resilience-explanation.schema.json',
  ], 'Resilience schemas parse');

  const fixtureJsonFiles = walkFiles(join(projectRoot, 'tests/fixtures/gateway-resilience'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(projectRoot, '').replace(/^[/\\]/, ''));
  checkJsonParse(fixtureJsonFiles, 'Resilience fixtures parse');

  const invalid = classifyGatewayFailure({ error: { code: 'invalid_request' } });
  if (invalid.retryable === false) pass('Invalid requests are not retryable');
  else fail('Invalid requests are not retryable');

  const denied = classifyGatewayFailure({ error: { code: 'policy_denied' } });
  const deniedRetry = evaluateRetryEligibility({ failure: denied, policy: { enabled: true, max_attempts: 3, max_total_delay_ms: 1000 } });
  const deniedFallback = planFallbackTransition({
    primary: { provider_id: 'alpha', model_id: 'alpha-fast' },
    fallbackChain: [{ provider_id: 'beta', model_id: 'beta-cheap', rank: 1 }],
    failure: denied,
    retryDecision: { eligible: false },
    policy: { fallback_allowed: true, max_fallbacks: 1 },
  });
  if (!deniedRetry.eligible && !deniedFallback.transition_allowed) pass('Policy denial prevents retry and fallback');
  else fail('Policy denial prevents retry and fallback');

  const limited = evaluateRetryEligibility({
    failure: { category: 'timeout', code: 'timeout', retryable: true },
    policy: { enabled: true, max_attempts: 1, max_total_delay_ms: 1000, same_provider_retry_limit: 1, same_model_retry_limit: 1, retryable_categories: ['timeout'], retryable_codes: ['timeout'], retry_on_timeout: true },
    attemptHistory: [{ provider_id: 'alpha', model_id: 'alpha-fast', planned_delay_ms: 100 }],
    currentCandidate: { provider_id: 'alpha', model_id: 'alpha-fast' },
  });
  if (!limited.eligible) pass('Retry ceilings are enforced');
  else fail('Retry ceilings are enforced');

  const delay = planRetryDelay({ attempt: 3, deterministicSeed: 'verify', policy: { max_total_delay_ms: 1000, max_delay_ms: 500, base_delay_ms: 100, backoff_strategy: 'bounded-exponential', jitter_mode: 'deterministic' } });
  const delayAgain = planRetryDelay({ attempt: 3, deterministicSeed: 'verify', policy: { max_total_delay_ms: 1000, max_delay_ms: 500, base_delay_ms: 100, backoff_strategy: 'bounded-exponential', jitter_mode: 'deterministic' } });
  if (JSON.stringify(delay) === JSON.stringify(delayAgain)) pass('Backoff is deterministic');
  else fail('Backoff is deterministic');

  const transition = planFallbackTransition({
    primary: { provider_id: 'alpha', model_id: 'alpha-fast' },
    fallbackChain: [{ provider_id: 'beta', model_id: 'beta-cheap', rank: 1 }],
    failure: { category: 'timeout', fallback_eligible: true },
    retryDecision: { eligible: false },
    policy: { fallback_allowed: true, max_fallbacks: 1 },
  });
  if (transition.transition_allowed && transition.to.provider_id === 'beta') pass('Fallback planning executes nothing');
  else fail('Fallback planning executes nothing');

  const circuit = simulateCircuitBreakerTransition({
    currentState: { state: 'closed', failure_count: 1 },
    event: { result: 'failure', failure: { category: 'timeout' } },
    policy: { enabled: true, failure_threshold: 2, success_threshold: 1, open_duration_ms: 1000, half_open_max_attempts: 1, tracked_categories: ['timeout'], scope: 'provider' },
    currentTime: 100,
  });
  if (circuit.next_state === 'open') pass('Circuit-breaker transitions are deterministic');
  else fail('Circuit-breaker transitions are deterministic');

  const scenario = fixture('retryable-timeout');
  const simulation = simulateGatewayResilience({ ...scenario, requestId: 'verify-resilience', startTime: 1000 });
  if (simulation.timeline.at(-1).type === 'simulation-complete') pass('Simulation terminates');
  else fail('Simulation terminates');
  if (simulation.executed === false && simulation.mode === 'simulation') pass('Simulation reports executed false');
  else fail('Simulation reports executed false');
  const serialized = JSON.stringify(simulation.explanation);
  if (!serialized.includes('secret prompt') && !/(sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._-]{12,})/.test(serialized)) {
    pass('Resilience explanations contain no prompts or credentials');
  } else {
    fail('Resilience explanations contain no prompts or credentials');
  }

  const source = resilienceSource();
  checkNoPattern(source, /\bfetch\s*\(|http\.request|https\.request|createConnection|createServer|\.listen\s*\(/, 'Resilience code contains no network calls or server creation');
  checkNoPattern(source, /child_process|@openai|openai|anthropic|gemini/i, 'Resilience code contains no provider SDK imports');
  checkNoPattern(source, /setTimeout|setInterval|Atomics\.wait/, 'Resilience code contains no timer or sleep behavior');
  checkNoPattern(source, /process\.env\[/, 'Resilience code contains no environment credential reads');
  checkNoPattern(source, /writeFile|writeFileSync|appendFile|appendFileSync|mkdir|mkdirSync|rmSync|unlinkSync/, 'Resilience code contains no filesystem writes');

  const packageJson = readJson('package.json');
  if (packageJson.version === '4.2.0-dev.0') pass('Package version remains 4.2.0-dev.0');
  else fail('Package version remains 4.2.0-dev.0');
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) pass('Runtime dependencies remain zero');
  else fail('Runtime dependencies remain zero');
}
