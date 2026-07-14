# MultiModel Dev OS Protocol Specification (v1.1.0)

This document defines the official, stable architectural protocol and design contracts for MultiModel Dev OS, establishing portable AI project context conventions.

> **Use when**: Implementing a custom CLI client, creating private adapters, or auditing Layer 1-3 protocol compliance.

---

## v4.2 Gateway Protocol Note

The v4.2 development lane adds gateway protocol contracts for a future local AI gateway. These contracts live alongside the stable workspace protocol and do not replace it.

Sprint A defines:

- a minimal OpenAI-compatible chat request shape
- normalized chat completion and stream chunk shapes
- provider adapter interface metadata
- routing request and route decision shapes
- usage metadata
- normalized gateway errors
- safe gateway configuration defaults

Sprint A does not start a server, expose live endpoints, call providers, load credentials, execute routing, execute fallback, or claim complete OpenAI API compatibility. See [Gateway Protocol](/gateway-protocol) and [Gateway Security Model](/gateway-security-model).

---

## 1. Protocol Architecture Layers

The protocol is divided into three distinct decoupled layers to guarantee portability:

```
┌────────────────────────────────────────────────────────┐
│ LAYER 1: Root Contracts (Single Source of Truth)       │
│ AGENTS.md • MEMORY.md • TASKS.md • RUNBOOK.md          │
└──────────────────────────┬─────────────────────────────┘
                           │ Centralizes project context
┌──────────────────────────▼─────────────────────────────┐
│ LAYER 2: Configuration & Modules (.ai/)                │
│ context/ • agents/ • skills/ • prompts/ • checks/      │
└──────────────────────────┬─────────────────────────────┘
                           │ routes files dynamically
┌──────────────────────────▼─────────────────────────────┐
│ LAYER 3: Tool & IDE Adapters                           │
│ .cursorrules • CLAUDE.md • .vscode/ • .gemini/        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Stability Matrix (v1.1.0 Freeze)

To prevent breaking changes, protocol definitions are designated as **Stable** or **Experimental**:

### A. Stable Protocol Components
These features are fully frozen. No breaking changes or renaming will occur in `v1.x`:
- **Core Workspace Contracts:** The names and root directories of `AGENTS.md`, `MEMORY.md`, `TASKS.md`, and `RUNBOOK.md` are completely frozen.
- **Scaffolding Subfolders:** Target folders `.ai/context/`, `.ai/skills/`, and `.ai/session-logs/` are strictly required by the sync CLI.
- **Adapters Interface:** Mappings to Cursor (`.cursorrules`), Claude (`CLAUDE.md`), VS Code (`.vscode/settings.json`), and Gemini (`GEMINI.md`) are guaranteed.
- **Core Commands:** Subcommands `init`, `verify`, `validate`, `doctor`, and `templates` will retain their signatures.

### B. Experimental Components
These components represent early specs and may undergo minor tweaks in future minor releases:
- **Caveman Mode Custom Overrides:** Custom manual template modifications under `.ai/templates/`.
- **Dynamic Context Routing:** Pre-implementation check validations inside `.ai/checks/context-budget.md`.

---

## 3. CLI Command Contracts

All compliant MultiModel Dev OS CLIs must strictly support the following execution contracts:
- **`init` Scaffolding:** Recursively writes root documents and links requested adapters.
- **`validate` Quality Gate:** Asserts that required folders and enabled adapter rules exist on disk.
- **`doctor` Diagnostic:** Advisory audit of `.gitignore` setups and folder compatibility.
- **`templates` Inspector:** Displays available stack configurations.

Explore our [Stable Protocol Specification](/stable-protocol) or [Upgrade & Migration Guide](/migration-guide) for details.
