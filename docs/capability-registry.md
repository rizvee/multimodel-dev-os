# Model Capability Registry

The **Capability Registry** manages and scores AI models across cognitive, speed, and cost vectors, eliminating hardcoded model routing logic.

---

## 1. Capabilities Score Matrix

Models are scored in `.ai/registries/capabilities.yaml` across six primary vectors:
*   `coding` — Syntax accuracy, language compliance, and refactoring competence.
*   `reasoning` — Multi-file plan generation and logical constraint auditing.
*   `repo-scan` — Needle-in-a-haystack retrieval accuracy at massive context scales.
*   `agentic-duration` — Ability to execute long-running task loops without losing parameters.
*   `mcp-compliance` — Native Model Context Protocol (MCP) tool bindings.
*   `local-offline` — Suitability for local resources (e.g. running via Ollama/Llama.cpp).

---

## 2. Dynamic Routing Engine

When executing workflow steps:
1.  **Workflows Query**: The workflow profile specifies the minimum capability scores required for each step (e.g., `planning` requires `reasoning: 0.85`, while `coding` requires `coding: 0.80`).
2.  **Capabilities Filter**: The router filters active models that meet or exceed these score thresholds.
3.  **Cost-Speed Trade-off**: From the matching models, the engine selects the candidate that optimizes cost, latency, or user-selected flags (e.g. `--local` or `--low-cost`).
