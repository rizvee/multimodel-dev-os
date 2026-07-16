# Gateway Observability Security

The observability layer is private by default and redacted by design.

It removes or omits authorization headers, cookies, bearer tokens, API keys, credential values, raw request bodies, prompt content, completion content, query values, absolute local paths, machine usernames, and environment values.

No reversible masking is used. Sensitive values are replaced with placeholders such as `[REDACTED]`, `[CONTENT OMITTED]`, or `[PATH OMITTED]`.

No telemetry exporter, analytics SDK, filesystem logger, usage database, or metrics cache is introduced in Sprint G.
