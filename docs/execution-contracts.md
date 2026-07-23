# Execution Contracts Reference

MultiModel Dev OS v4.3 Sprint A establishes formal execution contracts, schemas, factories, and validation logic for outbound provider request execution.

These contracts define the structural boundaries and security requirements for governed model execution without performing network requests or credential resolution.

---

## 1. Core Principles

1. **Local-First Security**: Outbound execution contracts enforce strict HTTPS-only transport, zero redirect following, mandatory SSRF checks, and loopback/private network address rejection by default.
2. **Credential Redaction**: Credentials are referenced strictly by environment variable name (`credential_ref.env_var`). Raw API keys or authorization tokens are never accepted in contract definitions or stored in execution objects.
3. **Redacted Execution Results**: All execution result objects explicitly set `redacted: true`, ensuring downstream loggers and observability modules treat payload summaries as sanitized.
4. **Recursive Sensitive-Field Screening**: Metadata and error details are recursively screened (`validateSafeObject`) to reject secret key names (`api_key`, `secret`, `token`, `password`, `bearer`, etc.), stack traces, and absolute local filesystem paths.
5. **Zero Dependencies & Zero Transport**: All validators and factory functions use pure Node.js standard primitives and internal gateway utilities. No network primitives or external calls exist in Sprint A.

---

## 2. Complete Contract Set

### Execution Request (`createExecutionRequest`)
Defines a complete unit of work handed to a provider execution engine. All sub-objects (`policy`, `capability`, etc.) use strict composition.

### Execution Result (`createExecutionResult`)
Represents the output lifecycle state of an execution request with mandatory `redacted: true`.

### Credential Reference (`createCredentialRef`)
Specifies environment variable references (`source: "environment"`).

### Provider Endpoint (`createProviderEndpoint`)
Defines network destination safety rules (`protocol: "https"`, `follow_redirects: false`, `ssrf_check_required: true`).

### Execution Policy (`createExecutionPolicy`)
Defines execution governance controls (`enabled: false` by default, `max_attempts: 1`, `retry_enabled: false`, `fallback_enabled: false`).

### Provider Execution Capability (`createProviderExecutionCapability`)
Explicitly declares supported execution capabilities per provider without inferring capabilities from provider names.

### Normalized Execution Error (`createExecutionError`)
Standardized error object taxonomy (`code`, `category`, `message`, `retryable`, `status`, `details`, `redacted: true`).

---

## 3. Schema & Validator Parity

- **Local Composition**: All 7 JSON Schemas (`.ai/schema/gateway-*.schema.json`) use local relative `$ref` composition. No remote HTTP schema URLs are used.
- **Strict Keys**: `additionalProperties: false` is enforced across all security-sensitive contract objects and schema definitions.
- **Required Fields**: Every field required by JSON Schema is enforced by runtime validators (`validateRequiredFields`).

---

## 4. Validation API Usage

Import contracts directly from local gateway modules or deep package paths:

```js
// Local repository usage
import {
  createExecutionRequest,
  createExecutionResult,
  createCredentialRef,
  createProviderEndpoint,
  createExecutionPolicy,
  createProviderExecutionCapability,
  createExecutionError,
  validateCredentialRef,
  validateProviderEndpoint,
  validateExecutionPolicy,
  validateProviderExecutionCapability,
  validateExecutionError,
  validateExecutionRequest,
  validateExecutionResult,
} from './src/gateway/index.js';

// Installed package deep import usage
import {
  validateExecutionRequest,
  validateExecutionResult,
} from 'multimodel-dev-os/src/gateway/index.js';
```
