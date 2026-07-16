# Gateway Custom Clients

Custom clients can use the local OpenAI-compatible subset directly.

## curl

```bash
curl http://127.0.0.1:8787/health
```

## PowerShell

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8787/health
```

## Node.js

Use Node's built-in HTTP APIs or a local-only client request to:

- `GET /health`
- `GET /v1/models`
- `POST /v1/chat/completions`

Only mock models are executable in Sprint F.
