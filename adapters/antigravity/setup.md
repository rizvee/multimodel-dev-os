# Antigravity Adapter Setup Guide

## Overview

Google Antigravity automatically reads `AGENTS.md` from the repo root. This
adapter adds dynamic context loading, on-demand skill invocation, and
cross-agent handoff support via the `.ai/` directory structure.

## Quick Setup

```powershell
# From project root — copy adapter files
Copy-Item -Recurse adapters\antigravity\.gemini .gemini -Force

# Verify context files exist
Test-Path .ai\context\current-state.md  # should be True
Test-Path .ai\context\global-rules.md   # should be True
Test-Path .ai\context\task-format.md    # should be True
```

No further setup needed — Antigravity auto-detects `AGENTS.md` and `.gemini/`.

## Context Flow

```mermaid
graph TD
    A["Antigravity Session"] --> B["AGENTS.md<br/>(auto-detected)"]
    B --> C[".ai/context/current-state.md"]
    C --> D[".ai/context/global-rules.md"]
    D --> E[".ai/context/task-format.md"]

    A --> F["On-Demand Skills"]
    F --> G["~/.agents/skills/<name>/SKILL.md<br/>(128 canonical skills)"]
    F --> H[".ai/skills/<name>.md<br/>(22 project-local)"]

    A --> I["Guardrail Checks"]
    I --> J[".ai/checks/pre-*.md"]
    I --> K[".ai/checks/post-*.md"]

    A --> L["MCP Integration"]
    L --> M["Chrome DevTools"]
    L --> N["gcloud"]

    A --> O["Session Output"]
    O --> P["TASKS.md update"]
    O --> Q["MEMORY.md update"]
    O --> R[".ai/context/current-state.md update"]
    O --> S[".ai/session-logs/ handoff"]

    style C fill:#2d5016,stroke:#4a8c28,color:#fff
    style G fill:#1a3a5c,stroke:#2d6aa0,color:#fff
    style J fill:#5c1a1a,stroke:#a02d2d,color:#fff
```

## Feature Mapping

| multimodel-dev-os | Antigravity Feature | Notes |
|-------------------|-------------------|----|
| `AGENTS.md` | Auto-read at repo root | Primary instructions |
| `MEMORY.md` | Knowledge Items | Persistent project decisions |
| `TASKS.md` | Task artifacts (`task.md`) | Active work tracking |
| `.ai/skills/` | `view_file` on demand | Load only when needed |
| `~/.agents/skills/` | Global skill library | 128 canonical skills |
| `.ai/checks/` | Pre/post execution guards | Safety checklist |
| `.ai/context/` | Dynamic context files | Live state, rules, format |
| `.ai/session-logs/` | Conversation transcripts | Cross-agent handoff |
| `.ai/config.yaml` | Mode switching | Standard vs caveman |
| `.gemini/settings.json` | IDE-level overrides | Exclude patterns, model prefs |

## Token Budget Strategy

The adapter keeps per-turn instruction load under 1,000 tokens by:

1. **Dynamic loading** — context files are read on demand, not embedded
2. **On-demand skills** — only the relevant skill is loaded per phase
3. **Exclude patterns** — `node_modules/`, `dist/`, build artifacts never enter context
4. **Caveman mode** — switch `.ai/config.yaml` mode to `"caveman"` for large codebases

## Cross-Agent Handoff

When handing off to another agent (Claude, Cursor, Codex):

1. Update `.ai/context/current-state.md` with final state
2. Write session log to `.ai/session-logs/YYYY-MM-DD-antigravity.md`
3. Update `TASKS.md` with remaining work
4. Do not assume the next agent reads `.gemini/settings.json`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Settings not applied | Ensure `.gemini/` is at project root |
| Context missing | Check `.ai/context/` files exist |
| Skills not found | Verify `~/.agents/skills/` is populated |
| Stale state | Re-read `current-state.md` or ask agent to update it |
| Token budget exceeded | Switch to caveman mode in `.ai/config.yaml` |
