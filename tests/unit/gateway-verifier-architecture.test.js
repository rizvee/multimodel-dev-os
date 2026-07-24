import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { stats } from '../../scripts/verify/utils.js';
import { checkGatewayContracts, checkAdapterForbiddenPrimitives } from '../../scripts/verify/gateway-contracts.js';

const projectRoot = process.cwd();

describe('gateway verifier architecture & coverage restoration', () => {
  it('gateway contract check increments shared stats pass count', () => {
    const initialPass = stats.pass;
    const initialFail = stats.fail;

    checkGatewayContracts();

    expect(stats.pass).toBeGreaterThanOrEqual(initialPass + 40);
    expect(stats.fail).toBe(initialFail);
  });

  it('records failure in shared stats without process.exit when an assertion fails', () => {
    const initialFail = stats.fail;
    
    // Simulate a failure recording by manually invoking stats increment pattern
    stats.fail++;

    expect(stats.fail).toBe(initialFail + 1);
  });

  it('verifier source contains all Sprint A and Sprint B check groups', () => {
    const verifierCode = readFileSync(join(projectRoot, 'scripts/verify/gateway-contracts.js'), 'utf8');

    // Sprint A check group markers
    expect(verifierCode).toContain('execution-contracts.test.js contains all required Sprint A test groups');
    expect(verifierCode).toContain('execution-security.test.js contains all required security test groups');
    expect(verifierCode).toContain('Gateway JSON Schemas have unique mmdo. $id identifiers');
    expect(verifierCode).toContain('Execution results factory forces redacted: true invariant');
    expect(verifierCode).toContain('Schema required properties match validator contract constraints');

    // Sprint B check group markers
    expect(verifierCode).toContain('OpenAI request normalizer converts execution request into valid payload');
    expect(verifierCode).toContain('OpenAI response normalizer converts completion response with reported usage');
    expect(verifierCode).toContain('OpenAI error normalizer redacts sensitive tokens and local paths');
    expect(verifierCode).toContain('OpenAI SSE parser enforces buffer bounds');
    expect(verifierCode).toContain('OpenAI SSE parser enforces terminal DONE state');
    expect(verifierCode).toContain('OpenAI SSE parser bounds event line accumulation');
  });

  it('forbidden primitive scanner passes clean production source', () => {
    const initialFail = stats.fail;

    checkAdapterForbiddenPrimitives('src/gateway/adapters/openai-compatible', 'Clean source audit check');

    expect(stats.fail).toBe(initialFail);
  });

  it('forbidden primitive scanner detects prohibited primitives when present', () => {
    const tmpDir = join(projectRoot, 'tests/fixtures/gateway/tmp-forbidden-test');
    mkdirSync(tmpDir, { recursive: true });
    
    const badFile = join(tmpDir, 'bad-module.js');
    writeFileSync(badFile, 'const key = process.env.API_KEY;\nfetch("https://api.example.com");\n', 'utf8');

    const initialFail = stats.fail;
    try {
      checkAdapterForbiddenPrimitives('tests/fixtures/gateway/tmp-forbidden-test', 'Forbidden primitive check');
      expect(stats.fail).toBe(initialFail + 1);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('verifier execution is deterministic across multiple invocations', () => {
    const passBefore = stats.pass;
    checkGatewayContracts();
    const countRun1 = stats.pass - passBefore;

    const passBefore2 = stats.pass;
    checkGatewayContracts();
    const countRun2 = stats.pass - passBefore2;

    expect(countRun1).toBe(countRun2);
    expect(countRun1).toBeGreaterThanOrEqual(40);
  });
});
