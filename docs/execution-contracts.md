# Execution Contracts Reference

MultiModel Dev OS v4.3 Sprint A establishes formal execution contracts, schemas, factories, and validation logic for outbound provider request execution.

These contracts define the structural boundaries and security requirements for governed model execution without performing network requests or credential resolution.

---

## 1. Core Principles

1. **Local-First Security**: Outbound execution contracts enforce strict HTTPS-only transport, zero redirect following, mandatory SSRF checks, and loopback/private network address rejection by default.
2. **Credential Redaction**: Credentials are referenced strictly by environment variable name (`credential_ref.env_var`). Raw API keys or authorization tokens are never accepted in contract definitions or stored in execution objects.
3. **Redacted Execution Results**: All execution result objects explicitly set `redacted: true`, ensuring downstream loggers and observability modules treat payload summaries as sanitized.
4. **Zero Dependencies**: All validators and factory functions use pure Node.js standard primitives and internal gateway utilities.

---

## 2. Contract Schemas

### Execution Request (`createExecutionRequest`)

Defines a complete unit of work handed to a provider execution engine.

```json
{
  "request_id": "exec-req-001",
  "provider_id": "openai-compatible",
  "model_id": "gpt-4o",
  "gateway_request": {
    "model": "gpt-4o",
    "messages": [
      { "role": "user", "content": "Hello" }
    ],
    "stream": false
  },
  "credential_ref": {
    "source": "environment",
    "env_var": "OPENAI_API_KEY",
    "required": true
  },
  "endpoint": {
    "url": "https://api.openai.com/v1/chat/completions",
    "protocol": "https",
    "headers_allowlist": ["authorization", "content-type", "user-agent", "accept"],
    "follow_redirects": false,
    "ssrf_check_required": true
  },
  "options": {
    "timeout_ms": 60000,
    "max_response_bytes": 10485760,
    "stream": false,
    "follow_redirects": false
  },
  "metadata": {}
}
```

### Execution Result (`createExecutionResult`)

Represents the output lifecycle state of an execution request.

```json
{
  "request_id": "exec-req-001",
  "provider_id": "openai-compatible",
  "model_id": "gpt-4o",
  "state": "completed",
  "gateway_response": { ... },
  "error": null,
  "timing": {
    "started_at": 1800000000000,
    "completed_at": 1800000000500,
    "duration_ms": 500
  },
  "usage": { ... },
  "metadata": {},
  "redacted": true
}
```

#### Execution States (`EXECUTION_STATES`)
- `pending`: Request initialized but not dispatched.
- `executing`: In-flight transport execution.
- `completed`: Successfully completed and normalized.
- `failed`: Terminated with normalized error.
- `cancelled`: Aborted prior to or during execution.
- `timed_out`: Exceeded execution timeout budget.

### Credential Reference (`createCredentialRef`)

Specifies where the provider execution runtime should read credentials at request execution time.

```json
{
  "source": "environment",
  "env_var": "OPENAI_API_KEY",
  "required": true
}
```

- `source`: Restricted to `'environment'` (no file or vault loading).
- `env_var`: Name of environment variable. Raw secrets or inline values cause policy validation failure.

### Provider Endpoint (`createProviderEndpoint`)

Defines network destination safety rules.

```json
{
  "url": "https://api.openai.com/v1/chat/completions",
  "protocol": "https",
  "headers_allowlist": ["authorization", "content-type", "user-agent", "accept"],
  "follow_redirects": false,
  "ssrf_check_required": true
}
```

- `protocol`: Must be `'https'`.
- `follow_redirects`: Must be `false`.
- `ssrf_check_required`: Must be `true`.
- Local/private IP addresses (RFC 1918, loopback, link-local) are strictly rejected.

---

## 3. Validation API

Import validators directly from `src/gateway/index.js`:

```js
import {
  validateCredentialRef,
  validateProviderEndpoint,
  validateExecutionRequest,
  validateExecutionResult,
} from 'multimodel-dev-os/gateway';
```
