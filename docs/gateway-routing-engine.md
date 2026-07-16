# Gateway Routing Engine

v4.2 Sprint C adds a pure deterministic route planning engine on top of the runtime registry snapshot.

This is dry-run planning only:

- no provider is contacted
- no model request is executed
- no fallback attempt is executed
- no provider credentials are read
- no HTTP server is started
- no tokenization or live pricing lookup is performed

## Inputs

The router consumes:

- a Sprint B gateway registry snapshot
- a routing request
- an optional routing preset ID
- an optional caller policy
- caller-supplied request ID and decision timestamp

The resolver does not implicitly load registries. Callers provide the snapshot explicitly.

## Output

`resolveGatewayRoute()` returns a Sprint A route decision shape:

```text
selected_provider
selected_model
strategy
score
reasons
rejected_candidates
fallback_chain
warnings
request_id
decision_timestamp
explanation
```

`dryRunGatewayRoute()` wraps the decision:

```text
mode: dry-run
executed: false
```

`executed` is always `false` in Sprint C.

## Safety

Explanations are planning records. They do not include prompt bodies, credential values, authorization headers, or absolute local paths.

The router uses only static metadata and caller-supplied estimates.

## Current Scope

Sprint C supports:

- explicit provider/model selection
- alias resolution
- capability filtering
- context-window filtering
- provider/model exclusions
- local-only and local-preferred planning
- cost-first planning from static cost metadata
- latency-first planning from static latency hints
- context-aware planning
- balanced deterministic scoring
- user-policy weights
- fallback-chain planning without execution

Live retries, timeout handling, provider invocation, and fallback execution are reserved for later gateway runtime work.
