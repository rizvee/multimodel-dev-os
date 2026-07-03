# Provider Strategy & API Keys Reference

MultiModel Dev OS supports multi-vendor API routing by centralizing provider properties, endpoints, and credentials reference schemas.

---

## Provider Registry Configuration
Configure base URLs and API environment variables in [.ai/models/providers.yaml](../.ai/models/providers.yaml):

```yaml
providers:
  anthropic:
    name: "Anthropic"
    api_endpoint: "https://api.anthropic.com/v1"
    env_key: "ANTHROPIC_API_KEY"
    default_headers:
      "anthropic-version": "2023-06-01"

  google:
    name: "Google Gemini"
    api_endpoint: "https://generativelanguage.googleapis.com/v1beta"
    env_key: "GEMINI_API_KEY"

  openai:
    name: "OpenAI"
    api_endpoint: "https://api.openai.com/v1"
    env_key: "OPENAI_API_KEY"
```

---

## API Key Security Rules

To guarantee credential safety during agentic loops:
1. **Never commit raw keys**: Add `.env` and `.env.local` files to `.gitignore` to prevent committing secrets to version control.
2. **Centralized Environment Variables**: Centralize keys inside local shell environments or local `.env` configs.
3. **No hardcoded defaults**: The default `providers.yaml` refers only to standard environment variable keys (e.g. `ANTHROPIC_API_KEY`), never API secrets.

---

## custom endpoint routing (e.g. proxy/gateways)
For companies routing traffic through centralized proxy interfaces (such as OpenRouter, Cloudflare AI Gateway, or local mocks):
* Edit `.ai/models/providers.yaml` and update the `api_endpoint` parameter of the targeted provider.
* Update `default_headers` to inject custom authentication tokens or routing parameters required by the gateway.
