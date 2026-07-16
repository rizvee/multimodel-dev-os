# Gateway Circuit Breaker Simulation

v4.2 Sprint D adds pure circuit-breaker state transition simulation.

The circuit-breaker module does not persist state, probe provider health, start timers, or call providers. Callers provide the current state, event, policy, and current time.

## Policy Fields

```text
enabled
failure_threshold
success_threshold
open_duration_ms
half_open_max_attempts
tracked_categories
scope
metadata
```

Supported scopes:

- `provider`
- `model`
- `provider-model`

Supported states:

- `closed`
- `open`
- `half-open`

## Transition Model

`simulateCircuitBreakerTransition(...)` returns:

```text
previous_state
next_state
failure_count
success_count
opened_at
eligible_for_half_open_at
allows_attempt
reasons
```

Policy and configuration failures are not automatically counted as provider health failures. The tracked category list decides which simulated failures affect the breaker.

## Safety Boundary

This is not a runtime health system yet. It is a deterministic transition contract for tests, dry-run explanations, and future gateway design.
