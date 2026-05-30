# Architecture

## Design Principles

1. **Markdown-first** — all configuration is human-readable markdown or YAML
2. **Vendor-neutral** — no tool is the source of truth; the root files are
3. **Zero dependencies** — no runtime, no package manager, no build step
4. **Non-destructive** — installers never overwrite, adapters never conflict
5. **Progressive complexity** — start with `AGENTS.md`, add orchestrator later

## Layer Architecture

```
┌──────────────────────────────────────┐
│          Human Layer                 │
│   README.md  CONTRIBUTING.md  docs/  │
├──────────────────────────────────────┤
│        Source of Truth Layer         │
│  AGENTS.md  MEMORY.md  TASKS.md     │
│  RUNBOOK.md                         │
├──────────────────────────────────────┤
│        AI Operating Layer            │
│  .ai/config.yaml                    │
│  .ai/agents/multimodel-orchestrator.md│
│  .ai/context/  .ai/prompts/          │
│  .ai/skills/  .ai/checks/           │
│  .ai/session-logs/  .ai/templates/  │
├──────────────────────────────────────┤
│         Adapter Layer                │
│  adapters/codex/                    │
│  adapters/antigravity/              │
│  adapters/cursor/                   │
│  adapters/claude/                   │
│  adapters/gemini/                   │
│  adapters/vscode/                   │
└──────────────────────────────────────┘
```

## Data Flow

1. **User edits** root markdown files (`AGENTS.md`, etc.)
2. **Adapters read** from root files and translate to tool-native format
3. **AI agents** read their adapter file + root files
4. **Agents write** results back to `TASKS.md`, `MEMORY.md`, and session logs
5. **Orchestrator** coordinates multi-agent workflows via session logs

## File Ownership

| File | Owner | Who Reads | Who Writes |
|------|-------|-----------|------------|
| `AGENTS.md` | Human | All agents | Human |
| `MEMORY.md` | Shared | All agents | Human + agents |
| `TASKS.md` | Shared | All agents | Human + agents |
| `RUNBOOK.md` | Human | All agents | Human |
| `.ai/config.yaml` | Human | System | Human |
| `.ai/session-logs/*.md` | Agents | Next agent | Current agent |
| `adapters/*/` | Community | Specific tool | Maintainers |

## Security Considerations

- Never store secrets in any multimodel-dev-os file
- Handoff logs may contain sensitive context — gitignored by default
- Adapter config files should not contain API keys or tokens
- Use `.env` files (gitignored) for secrets, referenced in `RUNBOOK.md`
