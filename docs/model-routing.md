# Multi-Model Routing & Presets Guide

To optimize context budgets and API costs, MultiModel Dev OS separates agent roles and routes tasks to specialized model families based on their complexity.

---

## Central Routing Configuration
Routing policies and presets reside in [.ai/models/routing-presets.yaml](file:///F:/multimodel-dev-os/.ai/models/routing-presets.yaml):

```yaml
presets:
  planning:
    primary: claude-sonnet-latest
    fallback: gemini-pro-latest
  debugging:
    primary: deepseek-coder-latest
    fallback: gemini-flash-latest
```

---

## Standard Presets Matrix

### 1. Planning (`planning` Preset)
* **Goal**: Architect implementation files, outline tasks checklists, and coordinate directory hierarchies.
* **Primary Target**: Premium reasoning models (e.g. `claude-sonnet-latest`, `gemini-pro-latest`).
* **Requirements**: Comprehensive context processing, high structured-output obedience.

### 2. Code Writing (`coding` Preset)
* **Goal**: Generate precise diffs and write modular, functional scripts.
* **Primary Target**: Fast, high-accuracy coding models (e.g. `deepseek-coder-latest`, `claude-sonnet-latest`).
* **Requirements**: Coding tier premium classification.

### 3. Quick Fixes & Verification (`verification` Preset)
* **Goal**: Run unit tests, verify CLI diagnostic outputs, and perform style compliance checks.
* **Primary Target**: Low-cost, fast inference models (e.g. `gemini-flash-latest`).
* **Requirements**: Speed tier fast classification, tool calling support.

---

## Fallback Routing Logic
When executing commands via terminal agents or local adapters:
1. Verify target provider key exists (e.g. `GEMINI_API_KEY`).
2. If primary model endpoint fails, check `capabilities.fallback` mapping in `registry.yaml`.
3. Route queries automatically to fallback options or fallback to `local-coder-model`.
