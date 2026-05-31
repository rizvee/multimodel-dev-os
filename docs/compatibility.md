# Compatibility & Customization Guide

This document maps how `multimodel-dev-os` integrates across diverse IDEs and terminal utilities, detailing what parameters developers can customize without breaking the protocol.

---

## 1. Supported Tool Matrix

The CLI routes centralized specifications directly to the following target adapters:

| Tool / Agent | Target Adapter File | Setup Instructions | Behavior Setup |
| :--- | :--- | :--- | :--- |
| **Cursor** | `.cursorrules` | `adapters/cursor/setup.md` | Inline autocomplete guidelines |
| **Claude Code** | `CLAUDE.md` | `adapters/claude/setup.md` | Terminal build and run controls |
| **VS Code** | `.vscode/settings.json` | `adapters/vscode/setup.md` | Editor layout and search limits |
| **Gemini** | `GEMINI.md` | `adapters/gemini/setup.md` | Prompt system context logs |
| **Antigravity** | `.gemini/settings.json` | `adapters/antigravity/setup.md` | Security and audit parameters |
| **Codex** | `adapters/codex/AGENTS.md` | `adapters/codex/setup.md` | Automated code scaffolding |

---

## 2. Safe Customizations

Developers can customize the following configurations inside the `.ai/` directory without breaking linter checkups:
- **Skills and Prompts:** Adding custom task files under `.ai/skills/` (e.g., custom database migrations, API setups).
- **Core Memory Notes:** Expanding milestones or architectural notes in `MEMORY.md` and `RUNBOOK.md`.
- **Model Routings:** Adjusting provider selections and endpoint targets inside `.ai/context/model-map.md`.

---

## 3. Strict Rules (Do Not Rename)

To guarantee validation compliance:
- **Do Not Rename Root Documents:** The core contract files (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) must reside exactly at the repository root and use capital letters.
- **Do Not Modify Schema Subfolders:** Subdirectories under `.ai/` (context, skills, prompts, checks, session-logs) must maintain lower-case names.
- **Do Not Interfere with CLI Flags:** Compliance checks expect `init`, `validate`, and `doctor` to accept `--target` and `--adapter` variables consistently.
