# multimodel-dev-os

> Portable, vendor-neutral project configuration for AI coding tools.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![v0.1](https://img.shields.io/badge/version-0.1.1-orange.svg)](CHANGELOG.md)

A shared set of markdown files that any AI coding tool can read — Codex,
Antigravity, Cursor, Claude, Gemini, VS Code, or whatever comes next.
Think `.editorconfig` for AI tools.

> [!IMPORTANT]
> **v0.1 is a Markdown-first convention/specification layer.**
> It is a set of structured directory/file guidelines that AI models can natively parse, not a daemon process, autonomous runtime engine, or background executor. Command Line Interface (CLI) automation and runtime engine tools are scheduled for the **v0.2+** releases.

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

## Supported Tool Matrix

| Tool | Adapter File | Reads Source of Truth From | Status |
|------|--------------|----------------------------|--------|
| OpenAI Codex | `adapters/codex/AGENTS.md` | `/AGENTS.md` | ✅ v0.1 |
| Google Antigravity | `adapters/antigravity/AGENTS.md` | `/AGENTS.md` | ✅ v0.1 |
| Cursor | `adapters/cursor/.cursorrules` | `/AGENTS.md`, `/MEMORY.md`, `/TASKS.md` | ✅ v0.1 |
| Claude Code | `adapters/claude/CLAUDE.md` | `/AGENTS.md`, `/MEMORY.md`, `/TASKS.md` | ✅ v0.1 |
| Gemini | `adapters/gemini/GEMINI.md` | `/AGENTS.md` | ✅ v0.1 |
| VS Code | `adapters/vscode/.vscode/settings.json` | `/AGENTS.md` (via exclusions) | ✅ v0.1 |

## Quick Start

### Option 1: Automated Installation

**macOS / Linux / WSL (bash):**
```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1 | iex
```

**Caveman Mode Installation** (~79% fewer tokens):
```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash -s -- --caveman
```

### Option 2: Manual Setup

If you prefer not to execute external shell scripts:
1. Clone this repository locally.
2. Copy the core markdown files (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) and the `.ai/` directory into your project root.
3. Select the adapter configurations you need from the `adapters/` directory and copy them to your project root (e.g., `adapters/cursor/.cursorrules`).

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
| [Next.js SaaS](examples/nextjs-saas/) | AGENTS.md, MEMORY.md, config |
| [WordPress Site](examples/wordpress-site/) | AGENTS.md, MEMORY.md, config |
| [E-commerce Headless Store](examples/ecommerce-store/) | AGENTS.md, MEMORY.md, config |
| [SEO Static Landing Page](examples/seo-landing-page/) | AGENTS.md, MEMORY.md, config |
| [General AppScaffold](examples/general-app/) | AGENTS.md, MEMORY.md, config |

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
- [Testing Guide](docs/testing-v0.2.md)
- [NPM Publishing Runbook](docs/npm-publishing.md)
- [FAQ](docs/faq.md)

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
