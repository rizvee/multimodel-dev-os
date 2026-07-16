# Gateway Mock Provider

Sprint E includes one executable provider: `mock`.

Mock models:

- `mock-chat`
- `mock-tools`
- `mock-stream`

The mock provider is deterministic and local-only:

- no network access
- no provider credentials
- no API keys
- no SDKs
- no local model engine probing
- no external requests

## Chat Behavior

Basic chat requests return a fixed assistant response:

```text
mock response
```

Tool requests against `mock-tools` return a deterministic mock tool-call shape.

`metadata.mode = "error"` produces a normalized mock upstream error for error-path testing.

Prompt text is not echoed in diagnostics by default.
