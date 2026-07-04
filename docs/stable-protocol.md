# Stable Protocol Specification (v1.1.0 Freeze)

This document formalizes the official, frozen architectural layers and design contracts for the MultiModel Dev OS protocol, guaranteeing portability and long-term stability across diverse AI coding agents.

> **Best for**: Third-party client integrations, tool adapter developers, and engineering teams establishing robust AI coding guidelines.

---

## 1. Frozen Layers Architecture

MultiModel Dev OS enforces a three-tier design to decouple core workspace context from individual IDE adapters:

```
┌────────────────────────────────────────────────────────┐
│ LAYER 1: Root Contracts (Single Source of Truth)       │
│ AGENTS.md • MEMORY.md • TASKS.md • RUNBOOK.md          │
│ Status: FROZEN                                         │
└──────────────────────────┬─────────────────────────────┘
                           │ Centralizes project context
┌──────────────────────────▼─────────────────────────────┐
│ LAYER 2: Configuration & Modules (.ai/)                │
│ context/ • agents/ • skills/ • prompts/ • checks/      │
│ Status: FROZEN                                         │
└──────────────────────────┬─────────────────────────────┘
                           │ Routes files dynamically
┌──────────────────────────▼─────────────────────────────┐
│ LAYER 3: Tool & IDE Adapters                           │
│ .cursorrules • CLAUDE.md • .vscode/ • .gemini/        │
│ Status: FROZEN                                         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Layer 1: Root Contracts

The following root files serve as the workspace single source of truth and are completely frozen:
- **`AGENTS.md`**: Defines team structures, boundaries, and adapter-specific project instructions.
- **`MEMORY.md`**: Preserves key context decisions, codebase state, and repository milestones.
- **`TASKS.md`**: Tracks current active goals and backlog.
- **`RUNBOOK.md`**: Operational scripts and workspace verify procedures.

---

## 3. Layer 2: Scaffolding Layout

The following directories and files under `.ai/` are strictly locked:
- **`.ai/config.yaml`**: Standard configuration file mapping templates and active adapters.
- **`.ai/context/`**: Standard markdown files containing architecture guidelines, briefs, and SEO rules.
- **`.ai/skills/`**: High-frequency modular instructions for agent workflows.
- **`.ai/session-logs/`**: Standard directory for tracking agent workspace operations.

---

## 4. Layer 3: Adapters Setup

IDE adapters translate centralized rules to tool-specific paths (Cursor project rules / Claude Code project instructions):
- **Cursor**: Linked via root `.cursorrules`
- **Claude**: Linked via root `CLAUDE.md`
- **Gemini**: Linked via `.gemini/settings.json`
- **VS Code**: Linked via `.vscode/settings.json`

---

## 5. Experimental vs. Stable Scope

- **Stable**: Root files, scaffolding directories, CLI subcommand signatures, and standard config structures.
- **Experimental**: Custom check overrides under `.ai/checks/` and stack-specific context routing.

Explore our [Upgrades & Migration Guide](/migration-guide) or [Release Quality Checklist](/v1-checklist) for staging controls.
