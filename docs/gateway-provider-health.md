# Gateway Provider Health

Sprint G introduces local provider health snapshots.

For the current runtime, mock-provider health can be updated from local mock requests. External providers remain metadata-only. No remote health probes, DNS lookups, HTTP checks, provider credentials, or local engine checks are used.

Mock health snapshots track request count, error count, consecutive successes/failures, last success/failure timestamps, and latency summaries.

This is separate from Sprint D circuit-breaker simulation. No circuit state is persisted.
