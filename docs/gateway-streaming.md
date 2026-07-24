# Governed External Streaming Specification (v4.3 Sprint E2)

## Overview

Sprint E2 introduces governed external streaming (`executeGovernedStream`) for OpenAI-compatible providers over Server-Sent Events (SSE). Outbound network transport, socket creation, and credential reads remain strictly externalized via injected dependencies (`transport.stream()`).

## Streaming Architecture

```
HTTP POST /v1/chat/completions (stream: true)
   │
   ├─► 1. Preflight Validation & Execution Gate Check
   │      - Request, Endpoint, Capability (sse_streaming: true), Policy
   │      - If preflight fails: Returns HTTP 400/403/404 JSON Error BEFORE headers sent
   │
   ├─► 2. Stream Acquisition
   │      - Races transport.stream() against Signal Abort & Effective Timeout
   │      - If acquisition fails: Returns HTTP 502/504 JSON Error BEFORE headers sent
   │
   ├─► 3. Send HTTP 200 OK SSE Response Headers
   │      - Content-Type: text/event-stream; charset=utf-8
   │      - Cache-Control: no-cache
   │      - Connection: keep-alive
   │
   └─► 4. Incremental SSE Consumption (`safeEventGenerator`)
          - Fragment byte accumulation & max_response_bytes enforcement
          - Feed raw fragments to `createOpenAISSEParser()`
          - Yield normalized chunk events: `data: JSON.stringify(chunk)\n\n`
          - Yield terminal `data: [DONE]\n\n`
          - Guarantee single credential destruction on all completion, error, timeout, or cancellation paths
```

## Transport Stream Interface

Injected transport must implement:

```js
transport.stream({
  endpoint,           // ProviderEndpoint
  payload,            // Normalized OpenAI request payload
  credential,         // ResolvedCredential container
  signal,             // AbortSignal
  request_timeout_ms, // Effective request timeout
  response_timeout_ms,// Effective idle timeout
  max_request_bytes,  // Request byte limit
  max_response_bytes, // Response byte limit
  stream: true,
});
```

Returns:
```js
{
  status: 200,
  headers: { 'content-type': 'text/event-stream' },
  body: AsyncIterable<string | Buffer | Uint8Array>,
}
```

## Error Handling & Resiliency

1. **Pre-Header Failures**: Preflight, gate denial, or stream acquisition errors return standard JSON gateway error responses with HTTP statuses (400, 403, 404, 500, 502, 504).
2. **Post-Header Failures**: Mid-stream errors emit a safe SSE error payload (`data: {"error":{...}}\n\n`), write terminal `data: [DONE]\n\n`, and close response without attempting JSON response writes.
3. **Client Disconnect**: Aborts execution signal, invokes `rawIterator.return()`, destroys credential container, and records `governed-stream-cancelled` observability event.
4. **Credential Safety**: Credential container `destroy()` method is invoked exactly once across all success, error, timeout, and cancellation paths.
