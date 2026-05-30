# Security Policy

## Scope

multimodel-dev-os is a set of markdown templates and shell scripts.
It does not run a server, process user data, or manage credentials.

## Reporting a Vulnerability

If you discover a security issue (e.g., the installer script could be
exploited, or a template encourages insecure practices):

1. **Do not** open a public issue.
2. Email the maintainer or use GitHub's private vulnerability reporting.
3. Include a description, steps to reproduce, and any suggested fix.

## Response

- Acknowledgment within 48 hours.
- Fix or mitigation within 7 days for confirmed issues.
- Credit in the changelog unless you prefer anonymity.

## What This Project Does NOT Handle

- **Secrets management** — never store secrets in any multimodel-dev-os file.
- **Authentication** — this project has no auth layer.
- **User data** — this project processes no user data.

If your project uses multimodel-dev-os, you are responsible for your own
application's security. Keep secrets in `.env` files (gitignored) and
reference them in `RUNBOOK.md` without exposing values.
