# multimodel-dev-os

> Portable, vendor-neutral project configuration and CLI tool for AI coding agents.

[![npm version](https://img.shields.io/npm/v/multimodel-dev-os.svg?color=blue)](https://www.npmjs.com/package/multimodel-dev-os)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/rizvee/multimodel-dev-os?include_prereleases)](https://github.com/rizvee/multimodel-dev-os/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/rizvee/multimodel-dev-os/verify.yml?branch=main)](https://github.com/rizvee/multimodel-dev-os/actions)
[![npm downloads](https://img.shields.io/npm/dm/multimodel-dev-os.svg?color=green)](https://www.npmjs.com/package/multimodel-dev-os)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 10-Second Quickstart

Bootstrap your project instantly via `npx`:

```bash
npx multimodel-dev-os@latest init
```

`multimodel-dev-os` is a lightweight, vendor-neutral configuration specification and local CLI utility that scaffolds a standardized operational context layout for your AI pair-programmers (such as Codex, Antigravity, Cursor, Claude Code, Gemini, or VS Code). It acts like `.editorconfig` but is optimized for multi-model AI coding agents.

---

## Why This Exists

AI coding tools are incredibly fast, but switching between them introduces context fragmentation:
1. **Context Loss:** You use **Cursor** for quick code completions, **Claude Code** for command-line implementations, and **Gemini/Antigravity** for auditing large code volumes. Every context switch drops your operational parameters.
2. **Instruction Drift:** Different tools look for different files (`.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, `.gemini/settings.json`). If you modify build scripts or styling rules in one place, they quickly drift across others, causing confusing compile failures.

`multimodel-dev-os` establishes a single source of truth inside your repository using a standardized root structure (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) and a `.ai/` context configuration directory.

---

## Why Not Just AGENTS.md?

While you can write a raw instruction file manually, `multimodel-dev-os` provides a robust, standardized context-management architecture:

| Feature | AGENTS.md Only | Tool-Specific Prompt Packs | MultiModel Dev OS |
| :--- | :--- | :--- | :--- |
| **Portability** | Hard to coordinate across different IDEs/CLIs | None (locked to one platform) | **Universal** (Single source of truth) |
| **Drift Prevention** | Manual copy-pasting of rules | None | **Automated** (Adapters sync root rules instantly) |
| **Token Optimization** | Read entire file every turn | Basic prompts | **Caveman Mode** (cuts token consumption by **~79%**) |
| **Tool Translation** | None (IDE files must be managed manually) | None | **Zero-Duplication** (Dynamic reference generation) |
| **Quality Gates** | None | None | **Verify checkup** (`npx multimodel-dev-os verify`) |

---

## Supported Tool Matrix

| Tool | Adapter File | Reads Source of Truth From | Status |
|------|--------------|----------------------------|--------|
| OpenAI Codex | `adapters/codex/AGENTS.md` | `/AGENTS.md` | ✅ Production-Ready |
| Google Antigravity | `adapters/antigravity/AGENTS.md` | `/AGENTS.md` | ✅ Production-Ready |
| Cursor | `adapters/cursor/.cursorrules` | `/AGENTS.md`, `/MEMORY.md`, `/TASKS.md` | ✅ Production-Ready |
| Claude Code | `adapters/claude/CLAUDE.md` | `/AGENTS.md`, `/MEMORY.md`, `/TASKS.md` | ✅ Production-Ready |
| Gemini | `adapters/gemini/GEMINI.md` | `/AGENTS.md` | ✅ Production-Ready |
| VS Code | `adapters/vscode/.vscode/settings.json` | `/AGENTS.md` (via exclusions) | ✅ Production-Ready |

---

## Extended Quickstart Options

Customize your scaffolding instantly via CLI argument flags:

```bash
# 1. Scaffolding with standard template profile
npx multimodel-dev-os@latest init

# 2. Scaffolding for a specific tech stack (e.g. Next.js App Router)
npx multimodel-dev-os@latest init --template nextjs-saas

# 3. Injecting a specific tool adapter profile (e.g. OpenAI Codex)
npx multimodel-dev-os@latest init --adapter codex

# 4. Bootstrapping with Caveman Mode (slashes token footprints by ~79%)
npx multimodel-dev-os@latest init --caveman

# 5. Verifying the structural health of your workspace directories
npx multimodel-dev-os@latest verify
```

---

## Architecture Layout

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

Adapters are **readers, not writers.** The root markdown files are the single source of truth. Adapters translate these into tool-native formats without duplicating instructions.

---

## Core Operational Files

| File | Purpose | Audience |
|------|---------|----------|
| [`AGENTS.md`](AGENTS.md) | Project rules, build commands, conventions | AI agents |
| [`MEMORY.md`](MEMORY.md) | Architecture decisions, patterns, session notes | AI agents |
| [`TASKS.md`](TASKS.md) | Current sprint, backlog, completed work | AI + humans |
| [`RUNBOOK.md`](RUNBOOK.md) | Deploy, rollback, incident response | AI + humans |
| [`.ai/config.yaml`](.ai/config.yaml) | Mode, orchestrator, adapter settings | System |

---

## Multimodel Orchestrator

Coordinate multiple AI agents on one project. Define roles in `.ai/config.yaml`, detail coordination in `.ai/agents/multimodel-orchestrator.md`.

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

---

## Caveman Mode

Minimal-token templates. Same structure, ~79% fewer tokens.

| Mode | AGENTS.md | Total |
|------|-----------|-------|
| Standard | ~500 tokens | ~1,600 tokens |
| Caveman | ~120 tokens | ~340 tokens |

See [docs/caveman-mode.md](docs/caveman-mode.md).

---

## Scaffolding Templates

We provide target-specific layouts for common application architectures:
* [Next.js SaaS Stack](examples/nextjs-saas/) (TypeScript, Prisma, Tailwind)
* [WordPress Custom Plugin/Site](examples/wordpress-site/) (PHP, standard blocks)
* [Headless E-commerce Store](examples/ecommerce-store/) (Payment processing, Webhooks)
* [SEO Static Landing Page](examples/seo-landing-page/) (Astro, static optimizations)
* [General Application](examples/general-app/) (Default baseline configuration)

See [docs/use-cases.md](docs/use-cases.md) for full stack examples.

---

## Documentation

* [Quickstart Guide](docs/quickstart.md)
* [Comparison Matrix](docs/comparison.md)
* [Use Cases & Stack Templates](docs/use-cases.md)
* [Social Launch Kit](docs/launch-kit.md)
* [Architecture Overview](docs/architecture.md)
* [Adapters Guide](docs/adapters.md)
* [Multi-agent Workflows](docs/multimodel-workflow.md)
* [Caveman Mode](docs/caveman-mode.md)
* [Script Installers Guide](docs/installers.md)
* [CLI Development Roadmap](docs/cli-roadmap.md)
* [NPM Publishing Runbook](docs/npm-publishing.md)
* [Frequently Asked Questions (FAQ)](docs/faq.md)

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

---

## License

This project is licensed under the [MIT License](LICENSE).
