# multimodel-dev-os

> Portable, vendor-neutral project configuration for AI coding tools.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![v0.1](https://img.shields.io/badge/version-0.1-orange.svg)](CHANGELOG.md)

A shared set of markdown files that any AI coding tool can read — Codex,
Antigravity, Cursor, Claude, Gemini, VS Code, or whatever comes next.
Not an AI agent. Not an operating system. Think `.editorconfig` for AI tools.

## The Problem

You use Cursor for implementation, Claude for architecture, Codex for review.
Each tool has its own config format, context window, and memory system.
When you switch tools, context is lost. When two agents work on the same
repo, they step on each other.

## The Solution

One set of markdown files that all AI tools read:

```
AGENTS.md   → What this project is and how to work on it
MEMORY.md   → What we've learned and decided
TASKS.md    → What needs to be done
RUNBOOK.md  → How to deploy, rollback, and respond to incidents
.ai/        → Agent config, skills, checks, prompts, session logs
```

Tool-specific adapters translate these into native formats:

```
adapters/codex/        → Codex-native config
adapters/antigravity/  → Antigravity/Gemini-native config
adapters/cursor/       → .cursorrules
adapters/claude/       → CLAUDE.md
adapters/gemini/       → GEMINI.md
adapters/vscode/       → .vscode/settings.json
```

## Quick Start

**macOS / Linux / WSL:**
```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1 | iex
```

**Caveman Mode** (~79% fewer tokens):
```bash
curl -fsSL .../scripts/install.sh | bash -s -- --caveman
```

See [docs/quickstart.md](docs/quickstart.md) for all options.

## Architecture

```
┌─────────────────────────────────────────────┐
│           SOURCE OF TRUTH (root)            │
│                                             │
│  AGENTS.md  MEMORY.md  TASKS.md  RUNBOOK.md │
│                .ai/                         │
│    config · agents · skills · checks · ...  │
└──────────────────┬──────────────────────────┘
                   │
        Adapters read from ↑
                   │
  ┌────────┬───────┼───────┬────────┬─────────┐
  │        │       │       │        │         │
  ▼        ▼       ▼       ▼        ▼         ▼
Codex  Antigrav  Cursor  Claude  Gemini    VS Code
```

Adapters are **readers, not writers.** The root markdown files are the
single source of truth. Adapters translate into tool-native formats.

## Core Files

| File | Purpose | Audience |
|------|---------|----------|
| [`AGENTS.md`](AGENTS.md) | Project rules, build commands, conventions | AI agents |
| [`MEMORY.md`](MEMORY.md) | Architecture decisions, patterns, session notes | AI agents |
| [`TASKS.md`](TASKS.md) | Current sprint, backlog, completed work | AI + humans |
| [`RUNBOOK.md`](RUNBOOK.md) | Deploy, rollback, incident response | AI + humans |
| [`.ai/config.yaml`](.ai/config.yaml) | Mode, orchestrator, adapter settings | System |

## Supported Tools

| Tool | Adapter | Native File | Status |
|------|---------|-------------|--------|
| OpenAI Codex | [`adapters/codex/`](adapters/codex/) | `AGENTS.md` | ✅ v0.1 |
| Google Antigravity | [`adapters/antigravity/`](adapters/antigravity/) | `.gemini/settings.json` | ✅ v0.1 |
| Cursor | [`adapters/cursor/`](adapters/cursor/) | `.cursorrules` | ✅ v0.1 |
| Claude Code | [`adapters/claude/`](adapters/claude/) | `CLAUDE.md` | ✅ v0.1 |
| Gemini | [`adapters/gemini/`](adapters/gemini/) | `GEMINI.md` | ✅ v0.1 |
| VS Code | [`adapters/vscode/`](adapters/vscode/) | `.vscode/settings.json` | ✅ v0.1 |

Want to add a tool? See [docs/adapters.md](docs/adapters.md).

## Multimodel Orchestrator

Coordinate multiple AI agents on one project. Define roles in
`.ai/config.yaml`, detail coordination in `.ai/agents/multimodel-orchestrator.md`.

```yaml
orchestrator:
  mode: "sequential"
  agents:
    - name: "architect"
      tool: "claude"
      files: ["docs/**"]
    - name: "implementer"
      tool: "cursor"
      files: ["src/**"]
```

See [docs/multimodel-workflow.md](docs/multimodel-workflow.md).

## Caveman Mode

Minimal-token templates. Same structure, ~79% fewer tokens.

| Mode | AGENTS.md | Total |
|------|-----------|-------|
| Standard | ~500 tokens | ~1,600 tokens |
| Caveman | ~120 tokens | ~340 tokens |

See [docs/caveman-mode.md](docs/caveman-mode.md).

## Examples

| Project Type | Files |
|---|---|
| [Next.js App](examples/nextjs-app/) | AGENTS.md, MEMORY.md, config |
| [Python API](examples/python-api/) | AGENTS.md, MEMORY.md, config |

## "multimodel" ≠ "multimodal"

- **multimodel** = multiple AI models/tools on the same project
- **multimodal** = AI processing multiple input types (text, image, audio)

This project is about the first one.

## Docs

- [Quickstart](docs/quickstart.md)
- [Architecture](docs/architecture.md)
- [Adapters](docs/adapters.md)
- [Multi-agent Workflow](docs/multimodel-workflow.md)
- [Caveman Mode](docs/caveman-mode.md)
- [Installers](docs/installers.md)
- [CLI Roadmap](docs/cli-roadmap.md)
- [FAQ](docs/faq.md)

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
