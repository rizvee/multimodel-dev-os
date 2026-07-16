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

## Client Validation

Sprint F uses this mock provider for client plan validation. Passing a Sprint F compatibility test means the generated plan works against the local mock protocol; it does not mean a named third-party client was installed or executed.

Sprint G provider-health snapshots are execution-backed only for this mock provider. External providers remain metadata-only and are not probed.
