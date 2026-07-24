# OpenAI-Compatible Adapter Normalization Reference

MultiModel Dev OS v4.3 Sprint B establishes pure, deterministic normalization logic for OpenAI-compatible model provider adapters (`src/gateway/adapters/openai-compatible/`).

This module operates strictly on plain data objects as pure transformations. It does not perform network connections, open sockets, resolve credentials, read environment variables, construct `Authorization` headers, or trigger provider execution.

---

## 1. Request Normalization (`normalizeOpenAIExecutionRequest`)

Converts a validated execution request object into a standard OpenAI-compatible `POST /v1/chat/completions` request payload.

### Processing Rules:
- **Execution Request Validation**: Evaluates input using `validateExecutionRequest`. Returns validation errors if invalid.
- **Capability Assertions**:
  - Rejects `stream: true` if `capability.sse_streaming !== true` (returns `unsupported_capability`).
  - Rejects requests containing `tools` or `tool_choice` if `capability.tool_calls !== true` (returns `unsupported_capability`).
- **Allowlisted Fields Only**: Copies `model`, `messages`, `temperature`, `top_p`, `max_tokens`, `stop`, `stream`, `tools`, `tool_choice`, `user`.
- **Deep Reference Isolation**: Deep-copies messages, stop arrays, tools, JSON-schema parameters, and `tool_choice` objects. Mutating output payloads does not alter input execution requests.
- **Undefined Property Removal**: Emitted payloads omit properties with `undefined` values.
- **Isolation**: Strips internal routing state, policy objects, endpoint URLs, credential references, and metadata.
- **Immutability**: Input execution request objects are never mutated.

---

## 2. Response Normalization (`normalizeOpenAIResponse`)

Converts an upstream OpenAI chat completion response into standard gateway chat completion response contracts.

### Processing Rules:
- **Choice & Upstream Validation**: Validates every choice in `upstreamResponse.choices`. Malformed secondary choices fail safely with `upstream_protocol_error`.
- **Tool Call Capability Verification**: Requires `context.capability.tool_calls === true` if capability context is supplied when choices contain tool calls. Returns `unsupported_capability` if denied.
- **Choice & Role Mapping**: Allowlists roles (`system`, `user`, `assistant`, `tool`, `developer`) and finish reasons. Normalizes choice indexes deterministically.
- **Deterministic Timestamps**: Resolves `created` timestamp using valid upstream `created` > 0, explicit `context.created` > 0, or deterministic fallback `0`. Does not invoke `Date.now()` or `new Date()`.
- **Usage Normalization**: Maps token usage fields and sets `provider_reported: true`.
- **Field Stripping**: Discards unknown provider fields, raw header objects, and system fingerprints.

---

## 3. Error Normalization (`normalizeOpenAIError`)

Maps HTTP status codes and upstream provider error bodies into standard `ExecutionError` objects using `EXECUTION_CONTRACT_VERSION`.

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
- Strips Bearer tokens (`sk-*`), raw HTTP headers, stack traces, and local filesystem paths using regex and `validateSafeMetadata`.
- Non-throwing on arbitrary inputs, circular objects, or throwing getters.

---

## 4. Incremental SSE Parser (`createOpenAISSEParser`)

Stateful, transport-independent Server-Sent Events (SSE) stream chunk parser.

### Processing Rules:
- **Option Validation**: Requires positive finite integers for `max_buffer_size` (<= 16MB) and `max_event_size` (<= 8MB). Throws `TypeError` on invalid options at factory creation.
- **Input Type Enforcement**: Accepts only `string`, `Buffer`, or `Uint8Array`. Other inputs produce a `stream_error` without invoking `.toString()`.
- **UTF-8 Streaming Decoder**: Uses `TextDecoder('utf-8')` to handle multi-byte UTF-8 character splits across chunk boundaries.
- **Byte-Bounded Accounting**: Measures limits in UTF-8 bytes (`Buffer.byteLength`). Bounds undecoded buffer, current line buffer, and accumulated event line bytes without blank delimiters.
- **SSE Framing & Multi-Line Data**: Handles LF/CRLF, comment lines (`:`), line fragmentation, multi-event chunks, and joins multi-line `data:` fields with `\n` per SSE specification.
- **Terminal `[DONE]` State**: Emits `{ type: 'done' }` upon encountering `data: [DONE]`. Subsequent input emits a `stream_error` until `reset()` is invoked.
- **Multi-Choice Delta Allowlisting**: Normalizes and allowlists every choice delta. Asserts declared tool call capabilities for stream deltas containing tool calls.
- **Zero Retention**: Flushes raw buffer strings after event emission; contains zero network or timer primitives.
