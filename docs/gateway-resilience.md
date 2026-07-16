# Gateway Resilience Planning

v4.2 Sprint D adds deterministic resilience planning and simulation contracts for the future gateway runtime.

This layer is simulation-only:

- no provider request is made
- no retry is performed
- no fallback transition is performed against a provider
- no timeout wait occurs
- no circuit-breaker state is persisted
- no rate-limit or quota metadata is fetched from a live service
- no credentials are loaded
- no HTTP server is started

## What It Models

The resilience layer models how a future gateway should reason about:

- normalized provider failure categories
- retry eligibility
- retry budgets
- deterministic backoff schedules
- timeout budgets
- fallback transitions
- circuit-breaker state transitions
- rate-limit and quota responses
- resilience event records
- full failure-chain simulations

All inputs are caller-supplied fixtures or in-memory objects.

## Core APIs

The public gateway export includes:

```js
classifyGatewayFailure(...)
evaluateRetryEligibility(...)
planRetryDelay(...)
planTimeoutBudget(...)
planFallbackTransition(...)
simulateCircuitBreakerTransition(...)
planRateLimitResponse(...)
planQuotaResponse(...)
createResilienceEvent(...)
simulateGatewayResilience(...)
```

These APIs return plans and explanations. They do not communicate with model providers.

## Simulation Output

`simulateGatewayResilience(...)` returns:

```text
mode: simulation
executed: false
final_status
selected_route
final_route
attempts
retries
fallback_transitions
circuit_events
timeline
explanation
warnings
```

`executed` is always `false` in Sprint D.

## Relationship to Routing

Sprint C produces a route decision and fallback chain. Sprint D consumes that planned route metadata and caller-supplied outcomes to simulate how retry, timeout, quota, and fallback decisions would be recorded.

It does not change Sprint C route selection.

## Next Scope

Sprint E introduces the first localhost-only gateway runtime with a mock provider. External provider calls remain disabled in Sprint E.
