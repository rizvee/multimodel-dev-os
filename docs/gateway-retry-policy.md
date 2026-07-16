# Gateway Retry Policy

v4.2 Sprint D defines retry policy contracts for gateway resilience simulation.

Retry planning is bounded and deterministic. The current implementation does not wait, sleep, schedule timers, contact providers, or repeat a model request.

## Policy Fields

```text
enabled
max_attempts
max_total_delay_ms
retryable_categories
retryable_codes
same_provider_retry_limit
same_model_retry_limit
respect_retry_after
backoff_strategy
base_delay_ms
max_delay_ms
multiplier
jitter_mode
retry_on_timeout
retry_on_rate_limit
metadata
```

## Safe Defaults

Defaults are conservative:

- retries are disabled unless explicitly enabled
- attempt counts are bounded
- total delay is bounded
- invalid requests are not retried
- authentication and configuration failures are not retried blindly
- policy denials cannot be retried
- deterministic jitter requires a caller-supplied seed

## Backoff Strategies

Supported planning strategies:

- `none`
- `fixed`
- `linear`
- `exponential`
- `retry-after`
- `bounded-exponential`

Backoff values are numbers in a plan. No real wait is started.

## Retry Eligibility

`evaluateRetryEligibility(...)` checks:

- failure retryability
- allowed categories and error codes
- attempt ceilings
- total delay ceilings
- same-provider retry ceilings
- same-model retry ceilings
- timeout and rate-limit policy flags

The function returns a decision object; it does not perform a retry.
