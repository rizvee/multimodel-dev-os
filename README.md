# MultiModel Dev OS

<p align="center">
  <img src="assets/logo.png" alt="MultiModel Dev OS Logo" width="160">
</p>

<p align="center">
  <b>The portable AI Dev OS for every model, every tool, every workflow.</b><br>
  <sub>One workspace. Zero lock-in. Ship faster with Codex, Gemini, Claude, Cursor, Antigravity, VS Code, and more.</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/multimodel-dev-os"><img src="https://img.shields.io/npm/v/multimodel-dev-os.svg?color=blue&style=flat-square" alt="NPM Version"></a>
  <a href="https://www.npmjs.com/package/multimodel-dev-os"><img src="https://img.shields.io/npm/dm/multimodel-dev-os.svg?color=orange&style=flat-square" alt="NPM Downloads"></a>
  <a href="https://github.com/rizvee/multimodel-dev-os/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/multimodel-dev-os.svg?color=green&style=flat-square" alt="License"></a>
  <a href="https://github.com/rizvee/multimodel-dev-os/releases"><img src="https://img.shields.io/github/v/release/rizvee/multimodel-dev-os?color=indigo&style=flat-square" alt="GitHub Release"></a>
  <a href="https://github.com/rizvee/multimodel-dev-os/actions"><img src="https://img.shields.io/github/actions/workflow/status/rizvee/multimodel-dev-os/verify.yml?branch=main&style=flat-square&label=verification" alt="Build Verification"></a>
  <a href="https://github.com/rizvee/multimodel-dev-os/blob/main/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-emerald.svg?style=flat-square" alt="PRs Welcome"></a>
</p>

---

## Get started in 30 seconds

```bash
npx multimodel-dev-os@latest init
```

That's it. Your workspace now has a unified AI context layer that works across **every major AI coding tool** — no config duplication, no context loss, no vendor lock-in.

<p align="center">
  <img src="assets/social-preview.svg" alt="MultiModel Dev OS Banner" width="100%">
</p>

---

## The Problem

AI pair programmers are powerful individually, but switching between them creates real friction:

| Pain Point | What Happens |
|:---|:---|
| **Context Fragmentation** | You use Cursor for autocomplete, Claude Code for terminal ops, Gemini for deep audits. Every switch forces a full context rebuild. |
| **Instruction Drift** | `.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, `.gemini/settings.json` — change one, the rest go stale. |
| **Token Waste** | Without context budgets, prompts bloat and API bills spike. |
| **Onboarding Friction** | New team members start from scratch with every tool. |

## The Solution

**MultiModel Dev OS** creates a single source of truth — four root contracts and a `.ai/` directory that bridges every tool dynamically:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Root Contracts (Single Source of Truth)           │
│  AGENTS.md  •  MEMORY.md  •  TASKS.md  •  RUNBOOK.md      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  LAYER 2: Configuration Engine (.ai/)                       │
│  context/  agents/  skills/  prompts/  checks/  models/    │
│  registries/  intelligence/  policies/                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  LAYER 3: Tool & IDE Adapters                               │
│  .cursorrules  CLAUDE.md  .vscode/  .gemini/  GEMINI.md    │
└─────────────────────────────────────────────────────────────┘
```

<p align="center">
  <img src="assets/architecture-preview.svg" alt="Architecture Diagram" width="100%">
</p>

---

## Supported Tools & Agents

| Tool / Agent | Adapter File | Status |
|:---|:---|:---|
| **Codex** (OpenAI) | `adapters/codex/AGENTS.md` | ✅ Full support |
| **Antigravity** (Google DeepMind) | `.gemini/settings.json` | ✅ Full support |
| **Cursor** | `.cursorrules` | ✅ Full support |
| **Claude Code** (Anthropic) | `CLAUDE.md` | ✅ Full support |
| **Gemini** (Google) | `GEMINI.md` | ✅ Full support |
| **VS Code** (Copilot) | `.vscode/settings.json` | ✅ Full support |
| **Cline / Continue / Roo Code** | Via adapter registry | 🔌 Adapter-ready |
| **Aider / Windsurf** | Via adapter registry | 🔌 Adapter-ready |
| **MCP Tools** (gcloud, Chrome DevTools) | Via tool registry | 🔌 Registry-ready |

> **Zero lock-in.** Switch tools freely — your context, rules, and memory travel with you.

---

## CLI Commands

MultiModel Dev OS ships a pure Node.js CLI with **zero runtime dependencies**.

<p align="center">
  <img src="assets/terminal-demo.svg" alt="Terminal Demo Sequence" width="100%">
</p>

### Initialize a Workspace

```bash
# Default workspace
npx multimodel-dev-os@latest init

# Pick a template
npx multimodel-dev-os@latest init --template nextjs-saas
npx multimodel-dev-os@latest init --template wordpress-site
npx multimodel-dev-os@latest init --template ecommerce-store
npx multimodel-dev-os@latest init --template seo-landing-page
npx multimodel-dev-os@latest init --template expo-react-native-android
npx multimodel-dev-os@latest init --template general-app

# Inject a specific adapter
npx multimodel-dev-os@latest init --adapter cursor
npx multimodel-dev-os@latest init --adapter claude
```

### Codebase Scanning & Memory

```bash
# Scan target repository structure and framework signals
npx multimodel-dev-os@latest scan

# Show compact repository intelligence state status
npx multimodel-dev-os@latest status

# Compile hash-compressed codebase state memory
npx multimodel-dev-os@latest memory build

# Incremental update of codebase state memory
npx multimodel-dev-os@latest memory refresh

# Diff current codebase state against memory files
npx multimodel-dev-os@latest memory diff
```

### Feedback Learning & Proposals

```bash
# Log developer preference or instruction feedback
npx multimodel-dev-os@latest feedback add "Avoid Tailwind CSS" --type preference

# View logged feedback entries
npx multimodel-dev-os@latest feedback list

# Compile raw feedback logs into active rules
npx multimodel-dev-os@latest feedback summarize

# Generate structured codebase improvement proposal
npx multimodel-dev-os@latest improve propose --title "Fix config issues"

# Review active proposals and statuses
npx multimodel-dev-os@latest improve review

# View improvement engine status
npx multimodel-dev-os@latest improve status

# Validate proposal safety gates and operations
npx multimodel-dev-os@latest improve validate .ai/proposals/proposal-xxxx.md

# Preview proposed changes in unified diff format
npx multimodel-dev-os@latest improve diff .ai/proposals/proposal-xxxx.md

# Apply deterministic approved operations to codebase
npx multimodel-dev-os@latest improve apply .ai/proposals/proposal-xxxx.md --approved

# View applied proposals execution history audit log
npx multimodel-dev-os@latest improve log

# Orchestrate development workflow pipelines
npx multimodel-dev-os@latest workflow run repo-health
npx multimodel-dev-os@latest workflow list

# Compile or print token-compressed agent session handoff summaries
npx multimodel-dev-os@latest handoff build
npx multimodel-dev-os@latest handoff show

# Onboard existing repositories safely
npx multimodel-dev-os@latest onboard analyze
npx multimodel-dev-os@latest onboard recommend
npx multimodel-dev-os@latest onboard plan
npx multimodel-dev-os@latest onboard apply --approved
npx multimodel-dev-os@latest onboard status

# Manage and sync IDE adapter configuration files
npx multimodel-dev-os@latest adapter status
npx multimodel-dev-os@latest adapter diff cursor
npx multimodel-dev-os@latest adapter sync cursor --approved
npx multimodel-dev-os@latest adapter sync all --approved
```

### Explore Registries

```bash
npx multimodel-dev-os@latest templates     # List all templates
npx multimodel-dev-os@latest models        # View model registry
npx multimodel-dev-os@latest adapters      # View adapter registry
npx multimodel-dev-os@latest models --json # Machine-readable output
```

### Quality Gates

```bash
npx multimodel-dev-os@latest validate      # Strict schema validation
npx multimodel-dev-os@latest doctor        # Advisory compatibility checks
npx multimodel-dev-os@latest verify        # Full release audit
```

### Caveman Mode

Cut prompt token overhead by **~79%** with compressed shorthand declarations:

```bash
npx multimodel-dev-os@latest init --caveman
```

---

## Why Not Just a Manual AGENTS.md?

| Capability | Manual Rules File | MultiModel Dev OS |
|:---|:---|:---|
| **Tool Sync** | Manual copy-paste across tools | Automated dynamic adapters |
| **Context Budgets** | Bloats prompts, wastes tokens | Caveman Mode cuts **~79%** token overhead |
| **Standards** | Easy to drift and corrupt | CLI `validate` + `doctor` + 193-assertion `verify` |
| **Templates** | Start from scratch | 6 production-ready real-world templates |
| **Model Registry** | Hardcoded model names | Dynamic capability-scored registry with routing presets |
| **Safety** | No guardrails | Prepublish guards, schema validation, hygiene checks |

---

## Cost & Context Optimization

Minimize prompt overhead and API billing with built-in context-reduction techniques:

<p align="center">
  <img src="assets/cost-optimization.svg" alt="Cost Optimization Funnel" width="100%">
</p>

Read the full playbook: **[Cost Optimization Guide](https://rizvee.github.io/multimodel-dev-os/cost-optimization)**

---

## 5-Day Adoption Roadmap

Deploy MultiModel Dev OS across your team in under a week:

<p align="center">
  <img src="assets/ai-dev-os-roadmap.svg" alt="5-Day Adoption Roadmap" width="100%">
</p>

Step-by-step timeline: **[5-Day Adoption Playbook](https://rizvee.github.io/multimodel-dev-os/5-day-roadmap)**

---

## Real-World Case Studies

- 📦 [Full-Stack Next.js SaaS: Database Schema Synchronization](https://rizvee.github.io/multimodel-dev-os/case-studies/nextjs-saas)
- 🔌 [WordPress Theme Scaffolding: Folder Boundary Protections](https://rizvee.github.io/multimodel-dev-os/case-studies/wordpress-site)
- 🛒 [E-Commerce Webhooks: State Verification Alignment](https://rizvee.github.io/multimodel-dev-os/case-studies/ecommerce-store)
- 📈 [SEO Landing Pages: Core Web Vitals Linter Budgets](https://rizvee.github.io/multimodel-dev-os/case-studies/seo-landing-page)
- 🚀 [Multi-Model Handoff: Sequential Session Logging](https://rizvee.github.io/multimodel-dev-os/case-studies/multimodel-handoff)

---

## Intelligence Layer (v2.1.0 — Coming Next)

The next major milestone introduces a **future-proof intelligence layer** — registry-driven, feedback-enabled, with strict human-in-the-loop safety gates:

| Component | Description |
|:---|:---|
| **Capability Registry** | Score models across coding, reasoning, repo-scan, agentic-duration, MCP compliance — no hardcoded names |
| **Tool Registry** | Define IDE, terminal, and MCP tool integrations dynamically |
| **Hash-Compressed Memory** | Token-efficient codebase fingerprints, summaries, and dependency maps |
| **Feedback Learning** | Convert developer corrections into reusable system rules |
| **Self-Improvement Engine** | Proposal → Review → Apply cycles with mandatory HITL approval and automatic rollback |

> [!NOTE]
> The v2.1.0 schemas, registries, and policies are already committed and verified (193/193 assertions pass). CLI implementation is the next phase.

Learn more:
- [Future-Proof Architecture](https://rizvee.github.io/multimodel-dev-os/future-proof-architecture)
- [Hash-Compressed Memory](https://rizvee.github.io/multimodel-dev-os/hash-compressed-memory)
- [Feedback Learning](https://rizvee.github.io/multimodel-dev-os/feedback-learning)
- [Capability Registry Guide](https://rizvee.github.io/multimodel-dev-os/capability-registry)
- [v2 Roadmap (v2.1 → v3.0)](https://rizvee.github.io/multimodel-dev-os/v2-roadmap)

---

## Roadmap

| Version | Focus | Status |
|:---|:---|:---|
| **v2.0.0** | Template Galaxy, Model Registry, Stable Protocol | ✅ Released |
| **v2.0.1** | Post-release polish, docs cleanup, 193 verify assertions | ✅ Released |
| **v2.1.0** | Intelligence Core — Registries, Memory Engine, Capability Routing | ✅ Released |
| **v2.2.0** | Feedback Loops & MCP Tool Integrations | ✅ Released |
| **v2.3.0** | Proposal Engine & Safety Controls | ✅ Released |
| **v2.4.0** | Approved Proposal Application Engine | ✅ Released |
| **v2.4.1** | Proposal Apply UX + Safety Patch | ✅ Released |
| **v2.5.0** | Repository Intelligence Command Center | ✅ Released |
| **v3.0.0** | Unified Autonomous Co-Pilot Ecosystem | 🔮 Future |

Full details: **[v2 Roadmap](https://rizvee.github.io/multimodel-dev-os/v2-roadmap)**

---

## Documentation & Resources

| Resource | Link |
|:---|:---|
| 📖 Documentation Portal | **[rizvee.github.io/multimodel-dev-os](https://rizvee.github.io/multimodel-dev-os/)** |
| 🐙 GitHub Repository | **[github.com/rizvee/multimodel-dev-os](https://github.com/rizvee/multimodel-dev-os)** |
| 📦 NPM Registry | **[npmjs.com/package/multimodel-dev-os](https://www.npmjs.com/package/multimodel-dev-os)** |
| 🤖 AI Discoverability | **[llms.txt](https://rizvee.github.io/multimodel-dev-os/llms.txt)** |
| 🚀 Quick Start | **[Quickstart Guide](https://rizvee.github.io/multimodel-dev-os/quickstart)** |
| 🏗️ Architecture | **[Architecture Deep Dive](https://rizvee.github.io/multimodel-dev-os/architecture)** |
| 🔄 Migration Guide | **[Upgrade from v1.x](https://rizvee.github.io/multimodel-dev-os/migration-guide)** |
| 🛡️ Stable Protocol | **[Protocol Specification](https://rizvee.github.io/multimodel-dev-os/stable-protocol)** |

---

## Contributing

We welcome contributions! Propose new adapters, request templates, improve docs, or report issues.

Read our **[Contributing Guidelines](CONTRIBUTING.md)** to get started.

---

## License

MIT License. Copyright (c) 2026-present MultiModel Dev OS team.