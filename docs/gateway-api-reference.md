# Gateway API Reference

The gateway JavaScript API is grouped by layer. These exports are intended for local foundation work, tests, and the v4.2.0 mock-only gateway foundation.

## Protocol and Contracts

Status: stable foundation.

- Gateway protocol constants.
- Request validation and normalization helpers.
- Normalized error helpers.
- Provider adapter description helpers.
- Routing request and route decision constructors.

These helpers do not start servers, read credentials, or call providers.

## Runtime Registry

Status: metadata-only.

- `buildGatewayRegistrySnapshot`
- Provider, model, local-model, and routing-preset registry helpers.
- Registry loader, normalization, and validation helpers.

Registry snapshots are deterministic and runtime-readable. They do not read credential values, probe local engines, or contact provider URLs.

## Routing

Status: dry-run only.

- Candidate creation and filtering.
- Routing policy normalization.
- Deterministic scoring.
- Route resolution and dry-run route planning.
- Fallback-chain planning.

Routing functions return decisions and explanations. They do not execute requests or fallback attempts.

## Resilience

Status: simulation-only.

- Failure classification.
- Retry eligibility.
- Backoff planning.
- Timeout budget planning.
- Fallback transition planning.
- Circuit-breaker simulation.
- Rate-limit and quota response planning.
- Full resilience simulation.

Resilience APIs use caller-supplied simulated outcomes. They do not sleep, retry, persist state, or call providers.

## Runtime

Status: local mock & governed non-stream (v4.3 Sprint E1).

- `createGatewayServer`
- `createExecutionDispatcher`
- `validateGovernedRuntimeConfig`
- Gateway runtime config validation.
- Mock provider & governed non-stream dispatcher.
- Request body, response, SSE, timeout, auth, and lifecycle helpers.

The runtime supports localhost mock `/health`, `/v1/models`, and `/v1/chat/completions` (both mock non-stream/stream and governed external non-stream execution via injected transport). External streaming is deferred to Sprint E2.

## Clients

Status: preview-only.

- Client profile registry.
- Endpoint normalization.
- Compatibility validation.
- Config preview generation.
- Local compatibility harness.
- Redacted diagnostics.

Client APIs generate previews and tests against the mock runtime. They do not write global configuration, install third-party clients, or execute those clients.

## Observability

Status: local in-memory.

- `createGatewayObservabilityCollector`
- Event, trace, usage, cost, metrics, health, redaction, query, and snapshot helpers.

Observability is bounded and redacted. It does not persist logs, upload telemetry, retain prompt/completion content by default, or probe external providers.
