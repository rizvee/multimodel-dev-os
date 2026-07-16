# Gateway Client Compatibility

Sprint F compatibility is intentionally conservative.

## Validated Locally

Validated-local means MultiModel Dev OS started the localhost mock gateway and exercised the generated plan through local protocol requests. It does not mean a third-party client was installed or executed.

Current validated-local profiles:

- generic OpenAI-compatible client
- custom Node.js client

## Example Only

Example-only profiles provide safe snippets or setup guidance for clients that can commonly target OpenAI-compatible endpoints. These examples still require user review before applying them to the actual tool.

## Manual Review

Manual-review profiles avoid unsupported claims. They document what would need to be confirmed before a user points that client at the gateway.

## Runtime Boundary

The gateway remains localhost-only by default. External providers remain metadata-only. Retry, fallback, quota, and circuit-breaker logic remain inactive in the runtime.
