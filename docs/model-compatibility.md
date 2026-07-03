# Model Compatibility & Capabilities Registry

MultiModel Dev OS v1.2.0 introduces a centralized, registry-driven configuration layer to specify target AI model behaviors, token windows, cost metrics, and specialized capabilities.

This ensures that agentic coding workflows are future-proof, allowing developers to route prompts to optimal engines without updating core codebase packages.

---

## Central Registry File
The core system registry resides in [.ai/models/registry.yaml](../.ai/models/registry.yaml):

```yaml
models:
  claude-sonnet-latest:
    provider: anthropic
    alias: claude-3-5-sonnet
    official_id: claude-3-5-sonnet-20241022
    context_window: 200000
    tiers:
      cost: high
      speed: medium
      reasoning: premium
      coding: premium
    capabilities:
      vision: true
      tool_use: true

  gemini-flash-latest:
    provider: google
    alias: gemini-1.5-flash
    official_id: gemini-1.5-flash-001
    context_window: 1048576
    tiers:
      cost: low
      speed: fast
      reasoning: medium
      coding: medium
    capabilities:
      vision: true
      tool_use: true
```

---

## Schema Attributes Reference

| Property | Type | Description |
| :--- | :--- | :--- |
| `provider` | String | Matches identifier in [providers.yaml](../.ai/models/providers.yaml). |
| `alias` | String | Common developer name or shortcut (e.g. `gpt-4o`). |
| `official_id` | String | Precise API endpoint identifier string. |
| `context_window` | Integer | Maximum token capacity of the model. |
| `tiers` | Object | Speed, cost, reasoning, and coding classifications (low/medium/high/premium). |
| `capabilities` | Object | Toggles indicating `vision` or `tool_use` (function calling) support. |

---

## Dynamic Placeholders
If a model name is future-facing or unverified, it is registered as a configurable placeholder or alias:
* `gpt-coding-latest`
* `deepseek-coder-latest`
* `local-coder-model`
* `open-weight-reasoner`

This strategy prevents hardcoding unverified API configurations and allows instant mapping via localized parameters.
