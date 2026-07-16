# Gateway OpenAI Compatibility

The v4.2 gateway implements a minimal OpenAI-compatible local mock subset. It is intended for protocol validation, client setup previews, and local tests. It is not full OpenAI API compatibility.

## Compatibility Matrix

| Surface | Status | Notes |
|:---|:---|:---|
| `GET /health` | supported | Local gateway health metadata, not an OpenAI endpoint. |
| `GET /v1/models` | supported | Lists executable mock models only. External provider models remain metadata-only. |
| `POST /v1/chat/completions` | partially supported | Supports basic chat completion requests against mock models. |
| Non-streaming chat | supported | Deterministic mock responses only. |
| SSE streaming | supported | Deterministic mock chunks ending with `[DONE]`. |
| Request IDs | supported | `x-request-id` is returned for traceability. |
| Usage object | partially supported | Mock provider returns deterministic usage; no provider tokenizer is used. |
| Tools | partially supported | Mock tool-capable model metadata exists; no external tool execution occurs. |
| Images, audio, embeddings | intentionally unsupported | Planned contract areas only. |
| Provider-specific extensions | intentionally unsupported | External providers are not executable in v4.2 development. |
| Live retry/fallback | intentionally unsupported | Retry and fallback are simulation-only. |
| Full OpenAI API parity | planned | Not claimed by v4.2 Gateway Foundation. |

## Error Compatibility

Gateway errors use stable JSON responses with normalized error codes and HTTP status codes. Unsupported fields and malformed JSON fail explicitly. Public errors do not include stack traces, raw prompt bodies, authorization headers, bearer tokens, or provider credentials.

## Streaming Compatibility

Streaming uses server-sent events with JSON chunks and a final `data: [DONE]` marker. Chunk content is deterministic mock output. Stream observability records chunk counts and lifecycle metadata, not chunk text.

## Boundaries

- Only mock models are executable.
- External models are not advertised as callable through `/v1/models`.
- No provider credentials are loaded.
- No external provider request is made.
- No live failover, retry execution, or provider health probing exists.
