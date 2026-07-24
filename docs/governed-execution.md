# Governed Opt-In Execution Architecture (v4.3 Sprint D Hardened)

## Overview

MultiModel Dev OS v4.3 Sprint D introduces an explicit opt-in execution gate and single-attempt governed executor (`src/gateway/execution/`) enforcing strict preflight policy, trusted endpoint binding, capability consistency, byte budgets, and secret safety before any provider execution attempt.

---

## Architectural Principles & Boundaries

1. **Disabled by Default**: External provider execution is strictly disabled unless `policy.enabled === true` and the provider ID is explicitly allowlisted in `policy.allowed_provider_ids`.
2. **Preflight Gate Evaluation**: `evaluateExecutionGate()` validates policies, trusted endpoint bindings, adapter type compatibility (`openai-compatible`), capabilities, streaming/tool flags, HTTPS protocols, and credential references.
3. **No Built-in Network Transport**: The execution layer contains zero network primitives (`fetch`, `http`, `https`, `net`, `tls`, `dns`). Execution requires an explicitly injected transport contract (`transport.execute(...)`).
4. **Single-Attempt Execution**: Governed execution allows exactly one attempt (`max_attempts: 1`). Retries and fallback transitions are strictly forbidden at the single-attempt executor level.
5. **Short-Lived Credential Scope & Destruction**: Resolved credentials exist inside opaque `ResolvedCredential` containers during transport invocation and are guaranteed to be destroyed in the `finally` block after execution completes or fails.
6. **Output Redaction & Trusted Transport Boundary**: Any transport result or thrown error is sanitized using `redactSensitiveValue(target, [credential])` *before* the credential container is destroyed. Note: an injected transport is in-process trusted code and could copy a raw secret during its callback; the framework guarantees container lifecycle destruction and result/error output redaction, not in-process memory isolation against malicious code.
7. **No Authorization Header Construction**: Transport selection and authorization header generation remain deferred. Zero `Authorization` or `Bearer` strings are constructed in production gateway execution code.
8. **No Gateway HTTP Server Integration**: The execution gate and executor are pure internal utilities. Integration into the local gateway HTTP server routes remains deferred to Sprint E.

---

## Governed Execution Lifecycle Ordering

Execution proceeds deterministically in 11 steps:

1. Basic request contract validation (`validateExecutionRequest`)
2. Execution gate preflight evaluation (`evaluateExecutionGate`)
3. Abort signal cancellation pre-check (`signal.aborted`)
4. Injected transport contract validation (`validateTransport`)
5. Credential resolution (`resolveEnvironmentCredential`)
6. Request normalization (`normalizeOpenAIExecutionRequest`) and request byte limit check (`max_request_bytes`)
7. Exactly one transport invocation (`await transport.execute(...)`)
8. Secret-aware transport result/error sanitization (`redactSensitiveValue`)
9. Credential container destruction (`resolvedCredential.destroy()` in `finally`)
10. Response/error normalization (`normalizeOpenAIResponse` / `normalizeOpenAIError`) and payload byte limit check (`max_response_bytes`)
11. Validated `ExecutionResult` output (`validateExecutionResult`)

### Attempt Count Semantics

- Failures occurring **before** `transport.execute()` begins (gate denial, invalid request, invalid transport, credential error, request_too_large, pre-aborted signal): `attempt_count: 0`.
- Failures occurring **after** `transport.execute()` begins (transport crash, provider error, response_too_large, post-invocation timeout): `attempt_count: 1`.
- Completed execution results: `attempt_count: 1`.

---

## Trusted Endpoint Binding Rules

`validateEndpointBinding()` binds request endpoints strictly to `provider_adapter.base_url`:

- Protocol must be `https:`
- Same hostname and same effective port
- Forbidden: embedded userinfo (`user:pass@`), URL fragments (`#hash`), query parameters (`?key=val`), and encoded path traversal (`%2e`, `/..`)
- Endpoint path must equal the trusted base path or be a true path-segment descendant (rejecting prefix tricks like `/v10` matching `/v1`)

---

## API Usage

```javascript
import {
  evaluateExecutionGate,
  executeGovernedRequest,
  createExecutionPolicy,
  createExecutionRequest,
} from './src/gateway/index.js';

// 1. Evaluate Preflight Gate
const gateResult = evaluateExecutionGate({
  policy,
  provider_id: 'openai',
  provider_adapter: openAIAdapter,
  request: executionRequest,
  endpoint,
  capability,
});

if (!gateResult.allowed) {
  console.log('Execution denied:', gateResult.reason);
}

// 2. Execute via Injected Transport
const result = await executeGovernedRequest({
  execution_request: executionRequest,
  provider_adapter: openAIAdapter,
  transport: {
    async execute({ payload, credential }) {
      // Injected transport implementation
      return { ... };
    },
  },
  environment: process.env,
});
### Signal & Timeout Behavior

- The executor races `transport.execute(...)` against the supplied `AbortSignal`.
- An uncooperative in-process transport may continue its own work after abort, but MultiModel Dev OS returns the cancellation result (`timed_out` / HTTP 504 or `cancelled` / HTTP 499), destroys its credential container, and discards late output.
- External streaming remains explicitly deferred to Sprint E2.
