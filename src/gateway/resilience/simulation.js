import { classifyGatewayFailure } from './failure-classification.js';
import { normalizeRetryPolicy, evaluateRetryEligibility } from './retry-policy.js';
import { planRetryDelay } from './backoff.js';
import { normalizeTimeoutPolicy, planTimeoutBudget } from './timeout-policy.js';
import { planFallbackTransition } from './fallback-transition.js';
import { simulateCircuitBreakerTransition } from './circuit-breaker.js';
import { planRateLimitResponse } from './rate-limit.js';
import { planQuotaResponse } from './quota.js';
import { createResilienceEvent } from './events.js';
import { createResilienceExplanation } from './explanation.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialRoute(routeDecision) {
  if (!routeDecision) return null;
  return {
    provider_id: routeDecision.selected_provider || null,
    model_id: routeDecision.selected_model || null,
  };
}

function finalStatusForFailure(failure, fallbackTransition) {
  if (failure?.category === 'policy-denied') return 'denied';
  if (failure?.category === 'authentication' || failure?.category === 'configuration' || failure?.category === 'quota') {
    return fallbackTransition?.transition_allowed ? 'exhausted' : 'user-action-required';
  }
  return 'exhausted';
}

export function simulateGatewayResilience({
  routeDecision,
  outcomes = [],
  retryPolicy = {},
  timeoutPolicy = {},
  circuitBreakerPolicy = {},
  requestId = 'resilience-simulation',
  startTime = 1,
} = {}) {
  const decision = clone(routeDecision || {});
  const normalizedRetryPolicy = normalizeRetryPolicy(retryPolicy);
  const normalizedTimeoutPolicy = normalizeTimeoutPolicy(timeoutPolicy);
  const simulatedOutcomes = Array.isArray(outcomes) ? clone(outcomes) : [];
  const warnings = [];
  const events = [];
  const attempts = [];
  const retries = [];
  const fallbackTransitions = [];
  const circuitEvents = [];
  const rateLimitDecisions = [];
  const quotaDecisions = [];
  const attemptHistory = [];
  const transitionHistory = [];
  let currentRoute = initialRoute(decision);
  let finalStatus = 'invalid-simulation';
  let elapsed = 0;
  let circuitState = {};
  const maxSteps = Math.max(1, simulatedOutcomes.length + (decision.fallback_chain?.length || 0) + normalizedRetryPolicy.max_attempts + 2);

  if (!currentRoute?.provider_id || !currentRoute?.model_id || simulatedOutcomes.length === 0) {
    warnings.push('simulation requires a route decision and caller-supplied outcomes');
    const explanation = createResilienceExplanation({
      finalStatus,
      initialRoute: currentRoute,
      attempts,
      retryDecisions: retries,
      fallbackDecisions: fallbackTransitions,
      circuitBreakerDecisions: circuitEvents,
      rateLimitDecisions,
      quotaDecisions,
      warnings,
    });
    return {
      mode: 'simulation',
      executed: false,
      final_status: finalStatus,
      selected_route: currentRoute,
      final_route: currentRoute,
      attempts,
      retries,
      fallback_transitions: fallbackTransitions,
      circuit_events: circuitEvents,
      timeline: events,
      explanation,
      warnings,
    };
  }

  for (let index = 0; index < simulatedOutcomes.length && index < maxSteps; index++) {
    const outcome = simulatedOutcomes[index];
    const attempt = index + 1;
    const providerId = outcome.provider_id || currentRoute.provider_id;
    const modelId = outcome.model_id || currentRoute.model_id;
    const timestamp = startTime + elapsed + attempt;
    const plannedAttempt = { attempt, provider_id: providerId, model_id: modelId, result: outcome.result || 'failure' };
    attempts.push(plannedAttempt);
    events.push(createResilienceEvent({
      request_id: requestId,
      type: 'attempt-planned',
      attempt,
      provider_id: providerId,
      model_id: modelId,
      timestamp,
      metadata: { mode: 'simulation' },
    }));

    if (outcome.result === 'success') {
      finalStatus = 'planned-success';
      const circuit = simulateCircuitBreakerTransition({
        currentState: circuitState,
        event: { result: 'success' },
        policy: circuitBreakerPolicy,
        currentTime: timestamp,
      });
      circuitState = {
        state: circuit.next_state,
        failure_count: circuit.failure_count,
        success_count: circuit.success_count,
        opened_at: circuit.opened_at,
      };
      circuitEvents.push(circuit);
      break;
    }

    const failure = classifyGatewayFailure({
      error: outcome.error || { code: 'internal_error' },
      providerId,
      modelId,
      attempt,
      requestId,
    });
    events.push(createResilienceEvent({
      request_id: requestId,
      type: 'attempt-failed',
      attempt,
      provider_id: providerId,
      model_id: modelId,
      failure,
      timestamp,
    }));

    const circuit = simulateCircuitBreakerTransition({
      currentState: circuitState,
      event: { result: 'failure', failure },
      policy: circuitBreakerPolicy,
      currentTime: timestamp,
    });
    circuitState = {
      state: circuit.next_state,
      failure_count: circuit.failure_count,
      success_count: circuit.success_count,
      opened_at: circuit.opened_at,
    };
    circuitEvents.push(circuit);

    const rateLimitDecision = failure.category === 'rate-limit'
      ? planRateLimitResponse({ failure, rateLimit: outcome.rate_limit || {}, retryPolicy: normalizedRetryPolicy, currentTime: timestamp })
      : null;
    if (rateLimitDecision) rateLimitDecisions.push(rateLimitDecision);
    const quotaDecision = failure.category === 'quota'
      ? planQuotaResponse({ quota: outcome.quota || { exhausted: true }, failure, fallbackChain: decision.fallback_chain || [], policy: { fallback_allowed: true } })
      : null;
    if (quotaDecision) quotaDecisions.push(quotaDecision);

    const retryDecision = evaluateRetryEligibility({
      failure,
      policy: normalizedRetryPolicy,
      attemptHistory,
      currentCandidate: currentRoute,
    });
    const delay = planRetryDelay({
      attempt: retryDecision.next_attempt,
      policy: normalizedRetryPolicy,
      retryAfterMs: failure.retry_after_ms,
      deterministicSeed: `${requestId}:${attempt}`,
    });
    const timeoutBudget = planTimeoutBudget({
      policy: normalizedTimeoutPolicy,
      elapsedMs: elapsed,
      attempt,
      plannedDelayMs: delay.bounded_delay_ms,
    });
    retryDecision.planned_delay_ms = delay.bounded_delay_ms;
    retryDecision.timeout_budget = timeoutBudget;
    retries.push(retryDecision);

    if (retryDecision.eligible && timeoutBudget.retry_possible !== false) {
      attemptHistory.push({ provider_id: providerId, model_id: modelId, planned_delay_ms: delay.bounded_delay_ms });
      elapsed += delay.bounded_delay_ms;
      events.push(createResilienceEvent({
        request_id: requestId,
        type: 'retry-planned',
        attempt,
        provider_id: providerId,
        model_id: modelId,
        retry_decision: retryDecision,
        timestamp,
      }));
      continue;
    }

    const fallbackTransition = planFallbackTransition({
      primary: currentRoute,
      fallbackChain: decision.fallback_chain || [],
      failure,
      retryDecision,
      policy: { fallback_allowed: true, max_fallbacks: decision.fallback_chain?.length || 0 },
      transitionHistory,
    });
    fallbackTransitions.push(fallbackTransition);
    if (fallbackTransition.transition_allowed) {
      transitionHistory.push(fallbackTransition);
      currentRoute = fallbackTransition.to;
      events.push(createResilienceEvent({
        request_id: requestId,
        type: 'fallback-planned',
        attempt,
        provider_id: providerId,
        model_id: modelId,
        failure,
        fallback_transition: fallbackTransition,
        timestamp,
      }));
      continue;
    }
    events.push(createResilienceEvent({
      request_id: requestId,
      type: 'fallback-rejected',
      attempt,
      provider_id: providerId,
      model_id: modelId,
      failure,
      fallback_transition: fallbackTransition,
      timestamp,
    }));
    finalStatus = finalStatusForFailure(failure, fallbackTransition);
    break;
  }

  if (finalStatus === 'invalid-simulation') finalStatus = 'exhausted';
  events.push(createResilienceEvent({
    request_id: requestId,
    type: 'simulation-complete',
    attempt: Math.max(1, attempts.length),
    provider_id: currentRoute.provider_id,
    model_id: currentRoute.model_id,
    timestamp: startTime + elapsed + attempts.length + 1,
    metadata: { final_status: finalStatus },
  }));

  const timeoutBudget = planTimeoutBudget({
    policy: normalizedTimeoutPolicy,
    elapsedMs: elapsed,
    attempt: Math.max(1, attempts.length),
    plannedDelayMs: 0,
  });
  const explanation = createResilienceExplanation({
    finalStatus,
    initialRoute: initialRoute(decision),
    attempts,
    retryDecisions: retries,
    fallbackDecisions: fallbackTransitions,
    timeoutBudget,
    circuitBreakerDecisions: circuitEvents,
    rateLimitDecisions,
    quotaDecisions,
    warnings,
  });

  return {
    mode: 'simulation',
    executed: false,
    final_status: finalStatus,
    selected_route: initialRoute(decision),
    final_route: currentRoute,
    attempts,
    retries,
    fallback_transitions: fallbackTransitions,
    circuit_events: circuitEvents,
    timeline: events,
    explanation,
    warnings,
  };
}
