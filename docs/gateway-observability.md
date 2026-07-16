# Gateway Observability

v4.2 Sprint G adds local, bounded, in-memory observability for the localhost mock gateway runtime.

Current scope:

- structured request lifecycle events
- request and trace identifiers
- bounded in-memory traces
- usage accounting records
- static cost-estimation hooks
- mock-provider health snapshots
- local metrics snapshots
- redacted audit records
- optional localhost-only read endpoints

The observability layer does not upload telemetry, persist logs, call analytics services, probe external providers, retain prompts or completions by default, or read provider credentials.

## Runtime Boundary

Observability is attached to the mock runtime through explicit runtime state. There is no global collector and no server is started on import. The collector stores records in bounded arrays and evicts oldest entries deterministically when limits are reached.

## HTTP Boundary

Programmatic APIs are the primary surface. HTTP observability endpoints are disabled unless `observability.expose_http_endpoints` is set to `true`.

When enabled, the local runtime may expose:

- `GET /v1/gateway/metrics`
- `GET /v1/gateway/health/providers`
- `GET /v1/gateway/traces?limit=<bounded>`

These endpoints inherit the same localhost and bearer-auth boundary as the rest of the mock gateway.
