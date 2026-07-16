# Gateway Resilience Simulation

Resilience simulation connects Sprint C route decisions with caller-supplied outcome fixtures.

Example input:

```json
[
  {
    "provider_id": "provider-a",
    "model_id": "model-a",
    "result": "failure",
    "error": { "code": "rate_limited" }
  },
  {
    "provider_id": "provider-b",
    "model_id": "model-b",
    "result": "success"
  }
]
```

The simulation does not infer live outcomes. It only consumes the provided sequence.

## Final Statuses

Possible statuses:

- `planned-success`
- `exhausted`
- `denied`
- `invalid-simulation`
- `user-action-required`

## Event Timeline

Simulation records can include:

- `attempt-planned`
- `attempt-failed`
- `retry-planned`
- `retry-rejected`
- `fallback-planned`
- `fallback-rejected`
- `circuit-opened`
- `circuit-half-open`
- `circuit-closed`
- `operation-aborted`
- `simulation-complete`

Events are planning records. They intentionally avoid wording that implies a provider was contacted.

## Explanation

The explanation includes:

- final status
- initial route
- planned attempts
- retry decisions
- fallback decisions
- timeout budget
- circuit-breaker decisions
- rate-limit and quota decisions
- warnings
- `executed: false`

Prompt bodies, credential values, authorization headers, and local absolute paths must not appear in explanations.
