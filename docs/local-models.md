# Local & Open-Weight Offline Models Guide

MultiModel Dev OS supports offline development workflows utilizing open-weight models running on local developer hardware (via Ollama, Llama.cpp, or vLLM).

---

## Local Models Configuration
Local model bindings are defined in [.ai/models/local-models.yaml](../.ai/models/local-models.yaml):

```yaml
local_engines:
  ollama:
    base_url: "http://localhost:11434/v1"
    models:
      - alias: local-coder-model
        official_id: qwen2.5-coder:7b
      - alias: open-weight-reasoner
        official_id: deepseek-r1:8b
```

---

## Local Setup Instructions

### 1. Using Ollama
To spin up a local model runner and pull target coding weights:
```bash
# Install Ollama and run server
ollama run qwen2.5-coder:7b

# In another terminal tab, run MultiModel Dev OS verify
node bin/multimodel-dev-os.js verify
```

### 2. Local fallback routing
To configure local fallback when remote APIs are unavailable, set your primary model map to point to the local coder model:
```yaml
# .ai/context/model-map.md
Planning: open-weight-reasoner
Execution: local-coder-model
```

---

## Benefits & Optimization
* **Zero API Cost**: Local model queries carry no token charges.
* **Privacy Compliance**: No code snippets or workspace context files leave the local host machine.
* **Offline-Ready**: Develop and build applications on flights or remote zones with zero internet dependencies.
