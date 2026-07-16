# Gateway Local Server

The Sprint E gateway server binds to `127.0.0.1` by default and supports ephemeral local ports for tests.

## Safe Defaults

```text
host: 127.0.0.1
port: 0
auth_mode: none-localhost-only
request_size_limit_bytes: 1048576
request_timeout_ms: 30000
stream_idle_timeout_ms: 15000
stream_total_timeout_ms: 60000
provider_timeout_ms: 30000
redact_prompts: true
allow_remote_binding: false
fallback_enabled: false
```

Remote binding is rejected unless explicitly enabled and paired with bearer-token authentication.

## Endpoints

- `GET /health`
- `GET /v1/models`
- `POST /v1/chat/completions`

Only mock models are executable in Sprint E. Registry-backed external providers remain metadata-only.

Sprint F client examples should point at this local server only. They should use mock models and avoid raw tokens in commands or files.

Sprint G observability can be enabled in memory for the local server. Optional observability endpoints remain disabled unless explicitly configured and inherit the local/auth boundary.

## Shutdown

`stop()` is idempotent and closes the local server. Active sockets are closed within a bounded shutdown window.
