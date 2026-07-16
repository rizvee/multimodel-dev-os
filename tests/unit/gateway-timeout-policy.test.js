import { describe, expect, it } from 'vitest';
import { planTimeoutBudget, validateTimeoutPolicy } from '../../src/gateway/index.js';

describe('gateway timeout policy', () => {
  it('plans remaining operation budgets without timers', () => {
    const budget = planTimeoutBudget({
      policy: { total_operation_timeout_ms: 1000, provider_timeout_ms: 800, stream_idle_timeout_ms: 200, stream_total_timeout_ms: 900, timeout_retryable: true },
      elapsedMs: 100,
      plannedDelayMs: 200,
    });

    expect(budget.remaining_operation_ms).toBe(700);
    expect(budget.provider_budget_ms).toBe(700);
    expect(budget.retry_possible).toBe(true);
  });

  it('caps exhausted operation timeout budget', () => {
    const budget = planTimeoutBudget({
      policy: { total_operation_timeout_ms: 1000, provider_timeout_ms: 500, timeout_retryable: true },
      elapsedMs: 900,
      plannedDelayMs: 200,
    });

    expect(budget.remaining_operation_ms).toBe(0);
    expect(budget.retry_possible).toBe(false);
  });

  it('validates timeout policy relationships', () => {
    expect(validateTimeoutPolicy({ total_operation_timeout_ms: 10, provider_timeout_ms: 20 }).success).toBe(false);
    expect(validateTimeoutPolicy({ total_operation_timeout_ms: 100, provider_timeout_ms: 20 }).success).toBe(true);
  });
});
