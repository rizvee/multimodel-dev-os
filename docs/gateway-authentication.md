# Gateway Authentication

Sprint E supports two runtime authentication modes:

- `none-localhost-only`
- `bearer-token`

## none-localhost-only

This is the default. It is valid only for loopback binding and loopback requests.

The gateway does not trust forwarded headers by default. A spoofed `X-Forwarded-For` header does not make a remote request local.

## bearer-token

Bearer-token mode requires an explicit token supplied by the caller configuration.

Rules:

- no token is read from provider credential variables
- no token is written to disk
- invalid or missing tokens return normalized authentication errors
- authorization headers are not included in diagnostics

Non-local binding requires this mode. Remote exposure remains opt-in and is not the default.
