# Multi-Model Routing & Presets Guide

To optimize context budgets and API costs, MultiModel Dev OS separates agent roles and routes tasks to specialized model families based on their complexity.

---

## Central Routing Configuration
Routing policies and presets reside in [.ai/models/routing-presets.yaml](../.ai/models/routing-presets.yaml):

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

## Runtime Registry Snapshot

v4.2 Sprint B loads routing presets into deterministic runtime-readable registry snapshots for future routing code. This preserves the existing YAML format and current CLI behavior.

The snapshot layer validates preset references, model IDs, provider IDs, and strategy metadata. It does not score candidates, execute routing decisions, call providers, or invoke fallback chains.

v4.2 Sprint C adds deterministic route planning over the normalized snapshot. The router can score candidates and produce fallback plans, but those plans are dry-run records only. No provider is contacted and no fallback is executed.

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

## Fallback Routing Metadata

Routing presets may declare primary, fallback, and cost-saving model preferences. In v4.2.0 these are metadata and dry-run planning inputs only:

1. Provider credential names may be referenced, but credential values are not read.
2. Preset references are validated locally.
3. Future routing code can consume the normalized snapshot.
4. No automatic fallback execution exists yet.
