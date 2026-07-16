# Gateway Streaming

Sprint E supports deterministic mock streaming through server-sent events.

Streaming applies only to mock models. The gateway does not proxy external provider streams.

## Response Headers

```text
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
```

## Event Shape

Each chunk is emitted as:

```text
data: {...}
```

The stream ends with:

```text
data: [DONE]
```

## Timeout Boundary

The runtime enforces stream idle and total timeouts with bounded local timers. It does not execute retry or fallback after a stream timeout in Sprint E.
