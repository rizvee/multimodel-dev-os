# Architecture

## Design Principles

1. **Markdown-first** — all configuration is human-readable markdown or YAML
2. **Vendor-neutral** — no tool is the source of truth; the root files are
3. **Zero dependencies** — no runtime, no package manager, no build step
4. **Non-destructive** — installers never overwrite, adapters never conflict
5. **Progressive complexity** — start with `AGENTS.md`, add orchestrator later
6. **Safety-first** — all write operations require explicit developer approval

## Layer Architecture

```
┌──────────────────────────────────────┐
│          Human Layer                 │
│   README.md  CONTRIBUTING.md  docs/  │
├──────────────────────────────────────┤
│    Layer 1: Source of Truth          │
│  AGENTS.md  MEMORY.md  TASKS.md     │
│  RUNBOOK.md                         │
├──────────────────────────────────────┤
│    Layer 2: AI Operating Layer       │
│  .ai/config.yaml                    │
│  .ai/agents/  .ai/context/          │
│  .ai/prompts/ .ai/skills/           │
│  .ai/checks/  .ai/templates/        │
│  .ai/models/  .ai/schema/           │
├──────────────────────────────────────┤
│    Layer 3: Adapter Layer            │
│  adapters/codex/                    │
│  adapters/antigravity/              │
│  adapters/cursor/                   │
│  adapters/claude/                   │
│  adapters/gemini/                   │
│  adapters/vscode/                   │
├──────────────────────────────────────┤
│    Layer 4: Intelligence Layer       │
│  .ai/intelligence/  (memory, handoff)│
│  .ai/registries/    (workflows,     │
│    capabilities, tools, sources,    │
│    trusted-keys)                     │
│  .ai/registry-cache/ (cached remote) │
│  .ai/proposals/     (improvements)  │
│  .ai/policies/      (safety, registry│
│    governance gates)                 │
├──────────────────────────────────────┤
│    Layer 5: CLI Dashboard & Plugins  │
│  dashboard / ui (TUI Command Center) │
│  plugin list/show/validate/install   │
│  catalog list/show/recommend/install │
│  registry list/add/sync/status/verify│
│    /keygen/lock/trust                │
│  onboard / adapter sync              │
└──────────────────────────────────────┘
```

## Data Flow

1. **User edits** root markdown files (`AGENTS.md`, etc.)
2. **Adapters read** from root files and translate to tool-native format
3. **AI agents** read their adapter file + root files
4. **Agents write** results back to `TASKS.md`, `MEMORY.md`, and session logs
5. **Orchestrator** coordinates multi-agent workflows via session logs
6. **Memory engine** indexes codebase state into hash-compressed summaries
7. **Feedback loop** captures developer corrections and compiles learning rules
8. **Proposal engine** drafts improvements, validates safety gates, and applies approved changes
9. **Handoff compiler** generates token-compressed session context for agent transfers

## v4.2 Gateway Contract Layer

The v4.2 development lane adds a gateway contract layer under `src/gateway/`. Sprint A is contracts-only:

- no HTTP server is started
- no provider APIs are called
- no credentials are loaded
- no routing decision is executed
- no fallback chain is executed
- no Skill OS permission is enforced at runtime

The gateway contract layer defines request/response validation, provider adapter interface expectations, routing request and route decision metadata, usage metadata, normalized errors, and safe gateway configuration defaults.

Skill OS remains the control plane. The gateway contracts are the first step toward a future runtime plane that can consume validated Skill OS, workflow, permission, guardrail, and model/provider metadata.

## File Ownership

| File | Owner | Who Reads | Who Writes |
|------|-------|-----------|------------|
| `AGENTS.md` | Human | All agents | Human |
| `MEMORY.md` | Shared | All agents | Human + agents |
| `TASKS.md` | Shared | All agents | Human + agents |
| `RUNBOOK.md` | Human | All agents | Human |
| `.ai/config.yaml` | Human | System | Human |
| `.ai/session-logs/*.md` | Agents | Next agent | Current agent |
| `.ai/intelligence/memory.*` | System | All agents | CLI (`memory build`) |
| `.ai/intelligence/handoff.md` | System | Next agent | CLI (`handoff build`) |
| `.ai/intelligence/feedback-log.jsonl` | System | CLI | CLI (`feedback add`) |
| `.ai/proposals/*.md` | System | Human + CLI | CLI (`improve propose`) |
| `.ai/registries/*.yaml` | System | CLI | CLI (`init` / `registry add`) |
| `.ai/policies/*.yaml` | Human | CLI | Human |
| `.ai/registry-cache/` | System | CLI | CLI (`registry sync`) |
| `adapters/*/` | Community | Specific tool | Maintainers |

## Security Considerations

- Never store secrets in any multimodel-dev-os file
- Handoff logs may contain sensitive context — gitignored by default
- Adapter config files should not contain API keys or tokens
- Use `.env` files (gitignored) for secrets, referenced in `RUNBOOK.md`
- Memory indexes, feedback logs, and proposals are gitignored by default
- The proposal `apply` command enforces 12 safety gates including path boundary checks
