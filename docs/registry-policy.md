# Registry Policy

The Registry Policy Engine strictly restricts remote writes to:
- Allowed roots: `.ai/`, `adapters/`
- Blocked paths: `.git/`, `.env`, `node_modules/`, `package.json`, `package-lock.json`
- Approval gates: Bypasses require the `--approved` flag.
