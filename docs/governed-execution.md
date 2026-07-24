# Governed Opt-In Execution Architecture (v4.3 Sprint D)

## Overview

MultiModel Dev OS v4.3 Sprint D introduces an explicit opt-in execution gate (`src/gateway/execution/`) that enforces strict preflight policies before any provider adapter execution can occur.

---

## Architectural Principles & Boundaries

1. **Disabled by Default**: External provider execution is strictly disabled unless `policy.enabled === true` and the provider ID is explicitly allowlisted in `policy.allowed_provider_ids`.
2. **Preflight Gate Evaluation**: `evaluateExecutionGate()` validates policies, endpoints, adapter capabilities, streaming/tool flags, HTTPS protocols, SSRF check requirements, and credential availability.
3. **No Built-in Network Transport**: The execution layer contains zero network primitives (`fetch`, `http`, `https`, `net`, `tls`, `dns`). Execution requires an explicitly injected transport contract (`transport.execute(...)`).
4. **Single-Attempt Execution**: Governed execution allows exactly one attempt (`max_attempts: 1`). Retries and fallback transitions are strictly forbidden at the single-attempt executor level.
5. **Short-Lived Credential Scope**: Resolved credentials exist inside opaque `ResolvedCredential` containers during transport invocation and are guaranteed to be destroyed in the `finally` block after execution completes (or fails).
6. **No Authorization Header Construction**: Transport selection and authorization header generation remain deferred. Zero `Authorization` or `Bearer` strings are constructed in production repository code during Sprint D.
7. **No Gateway HTTP Server Integration**: The execution gate and executor are pure internal utilities. Integration into the local gateway HTTP server routes remains deferred to Sprint E.

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
      // Injected transport implementation (e.g. test mock)
      return { ... };
    },
  },
  environment: process.env,
});
```
