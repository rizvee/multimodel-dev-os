# OpenAI-Compatible Adapter Normalization Reference

MultiModel Dev OS v4.3 Sprint B establishes pure, deterministic normalization logic for OpenAI-compatible model provider adapters (`src/gateway/adapters/openai-compatible/`).

This module operates strictly on plain data objects without performing network connections, opening sockets, reading environment variables, constructing `Authorization` headers, or triggering provider execution.

---

## 1. Request Normalization (`normalizeOpenAIExecutionRequest`)

Converts a validated execution request object into a standard OpenAI-compatible `POST /v1/chat/completions` request payload.

### Processing Rules:
- **Execution Request Validation**: Evaluates the input using `validateExecutionRequest`. Returns validation errors if invalid.
- **Capability Assertions**:
  - Rejects `stream: true` if `capability.sse_streaming !== true` (returns `unsupported_capability`).
  - Rejects requests containing `tools` or `tool_choice` if `capability.tool_calls !== true` (returns `unsupported_capability`).
- **Allowlisted Fields Only**: Copies `model`, `messages`, `temperature`, `top_p`, `max_tokens`, `stop`, `stream`, `tools`, `tool_choice`, `user`.
- **Isolation**: Strips internal routing state, policy objects, endpoint URLs, credential references, and metadata.
- **Message Roles**: Preserves `system`, `user`, `assistant`, `tool` role sequencing and tool calls.
- **Immutability**: Input execution request objects are never mutated.

---

## 2. Response Normalization (`normalizeOpenAIResponse`)

Converts an upstream OpenAI chat completion response into standard gateway chat completion response contracts.

### Processing Rules:
- **Upstream Validation**: Verifies `choices` is a non-empty array with valid message structure.
- **Choice Mapping**: Maps `index`, `message` (`role`, `content`, `tool_calls`), and `finish_reason`.
- **Usage Normalization**:
  - Maps `prompt_tokens` → `input_tokens`
  - Maps `completion_tokens` → `output_tokens`
  - Maps `total_tokens` → `total_tokens`
  - Sets `provider_reported: true` and `estimated: false`
- **Field Stripping**: Discards unknown provider fields, raw header objects, and system fingerprints.

---

## 3. Error Normalization (`normalizeOpenAIError`)

Maps HTTP status codes and upstream provider error bodies into standard Sprint A `ExecutionError` objects.

### Taxonomy Mapping:
- `400` / `422` → `request_invalid`
- `404` → `request_invalid` (or `model_not_found` when model-specific)
- `401` / `403` → `upstream_authentication`
- `408` / `504` → `timeout`
- `413` → `request_too_large` / `response_too_large`
- `429` → `upstream_rate_limit` (or `upstream_quota` when quota evidence exists)
- `500-599` → `upstream_server_error`
- Malformed SSE / JSON → `stream_error` / `upstream_protocol_error`
- Fallback → `internal_execution_error`

### Redaction & Safety Boundaries:
- Enforces `redacted: true` on all generated execution error objects.
- Strips Bearer tokens (`sk-*`), raw HTTP headers, stack traces, and local filesystem paths.
- Details pass `validateSafeMetadata` screening against secret key taxonomy and prototype properties.
- **Non-Throwing Guarantee**: Normalizer never throws exceptions for malformed or circular input.

---

## 4. Incremental SSE Parser (`createOpenAISSEParser`)

Stateful, transport-independent Server-Sent Events (SSE) stream chunk parser.

### Processing Rules:
- **Line Endings**: Handles both CRLF (`\r\n`) and LF (`\n`).
- **Fragmentation & Framing**: Concatenates partial chunks, splits multiple events per chunk, and handles `data: [DONE]`.
- **Normalized Emissions**: Emits `{ type: 'chunk', data }`, `{ type: 'usage', data }`, `{ type: 'done' }`, or `{ type: 'error', error }`.
- **Buffer & Event Boundaries**:
  - `max_buffer_size`: Default 1MB. Resets parser and emits `stream_error` if exceeded.
  - `max_event_size`: Default 512KB. Emits `stream_error` if an individual SSE event exceeds limit.
- **Zero Retention**: Flushes raw buffer strings after event emission; contains zero network or timer primitives.
