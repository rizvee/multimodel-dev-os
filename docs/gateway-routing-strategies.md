# Gateway Routing Strategies

Gateway routing strategies are deterministic planning policies. They rank already-validated registry candidates and produce a dry-run decision.

## Strategy Vocabulary

- `explicit`
- `capability`
- `cost-first`
- `latency-first`
- `context-aware`
- `local-first`
- `fallback-chain`
- `balanced`
- `user-policy`

Route decisions preserve the Sprint A route-decision contract, including compatibility names such as `capability-based`, `context-window-aware`, and `privacy-local-first`.

## Hard Filters

Hard filters run before scoring:

- disabled provider or model
- excluded provider or model
- explicit provider/model mismatch
- missing required capability
- insufficient context window
- insufficient output-token allowance
- local-only privacy mismatch
- unsupported status
- invalid registry record

Rejected candidates keep stable reason codes for machine-readable diagnostics.

## Scoring

Scoring is deterministic and explainable. Score components include:

- required capability pass
- preferred capability match
- provider/model priority
- static estimated cost
- static latency metadata
- context fit
- local preference
- explicit preference
- status confidence

Missing cost is not treated as free. Missing latency is not treated as fastest.

## Cost Planning

Cost-first planning uses static registry metadata plus caller-supplied token estimates. It does not tokenize prompts, perform live pricing lookup, or claim billing accuracy.

## Latency Planning

Latency-first planning uses static metadata hints only. It does not probe providers, run health checks, or measure live latency.

## Fallback Planning

Fallback-chain planning returns an ordered fallback plan. It does not execute retries, failover, provider calls, or fallback attempts.
