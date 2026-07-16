# MultiModel Dev OS

<p align="center">
  <img src="assets/logo.png" alt="MultiModel Dev OS logo" width="150">
</p>

<p align="center">
  <strong>Portable project contracts, adapter templates, validation, and local gateway tooling for multi-agent coding workflows.</strong>
</p>

<p align="center">
  MultiModel Dev OS is a zero-runtime-dependency Node.js CLI for organizing shared instructions, context, skills, workflows, adapter files, and safety checks inside a repository.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/multimodel-dev-os"><img src="https://img.shields.io/npm/v/multimodel-dev-os.svg?style=flat-square" alt="npm version"></a>
  <a href="https://github.com/rizvee/multimodel-dev-os/releases/latest"><img src="https://img.shields.io/github/v/release/rizvee/multimodel-dev-os?style=flat-square" alt="latest GitHub release"></a>
  <a href="https://github.com/rizvee/multimodel-dev-os/actions/workflows/verify.yml"><img src="https://img.shields.io/github/actions/workflow/status/rizvee/multimodel-dev-os/verify.yml?branch=main&style=flat-square&label=verification" alt="verification workflow"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20 or newer"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://rizvee.github.io/multimodel-dev-os/">Documentation</a> ·
  <a href="https://rizvee.github.io/multimodel-dev-os/quickstart">Quickstart</a> ·
  <a href="https://rizvee.github.io/multimodel-dev-os/CLI">CLI reference</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

## Overview

AI coding tools use different project instruction and configuration formats. MultiModel Dev OS provides a repository-level structure for maintaining those files without treating any single editor, model, or provider as the source of truth.

It can help you:

- scaffold shared project contracts such as `AGENTS.md`, `MEMORY.md`, `TASKS.md`, and `RUNBOOK.md`;
- add templates for supported editor and assistant adapters;
- inspect and onboard existing repositories;
- validate project structure, registries, schemas, and release safety;
- manage declarative Skill OS metadata and read-only workflow plans;
- generate memory, feedback, proposal, and handoff artifacts;
- test the v4.2 Gateway Foundation through a localhost mock runtime.

MultiModel Dev OS does **not** install third-party AI clients, authenticate provider accounts, or make external model providers interchangeable automatically.

---

## Quick Start

### Requirements

- Node.js 20 or newer
- Windows, macOS, or Linux

### Initialize a workspace

```bash
npx multimodel-dev-os@latest init
```

Choose a bundled project template:

```bash
npx multimodel-dev-os@latest init --template nextjs-saas
```

Available templates include:

- `nextjs-saas`
- `wordpress-site`
- `ecommerce-store`
- `seo-landing-page`
- `expo-react-native-android`
- `general-app`

### Analyze an existing repository

```bash
npx multimodel-dev-os@latest onboard analyze
npx multimodel-dev-os@latest onboard recommend
npx multimodel-dev-os@latest onboard plan
```

Onboarding analysis and planning are read-only. Applying generated files requires explicit approval.

### Install globally

```bash
npm install -g multimodel-dev-os
multimodel-dev-os --help
```

---

## Core Capabilities

| Capability | Scope |
|:---|:---|
| **Workspace contracts** | Maintains a consistent root structure for instructions, memory, tasks, and operational notes. |
| **Project templates** | Scaffolds documented examples for common web, commerce, SEO, and mobile project types. |
| **Adapter templates** | Provides repository templates for Codex, Claude Code, Cursor, Gemini, Antigravity, and VS Code. |
| **Repository onboarding** | Scans an existing codebase, identifies project signals, and prepares a reviewable onboarding plan. |
| **Adapter synchronization** | Previews differences and synchronizes selected adapter files only after explicit approval. |
| **Memory and handoffs** | Builds hash-based repository memory and compact session handoff artifacts. |
| **Feedback and proposals** | Captures developer feedback and supports reviewable, approval-gated improvement proposals. |
| **Skill OS metadata** | Validates declarative skills, prompts, permission classes, guardrails, and workflow references. |
| **Verification** | Audits package structure, schemas, registries, security boundaries, generated output, and repository hygiene. |
| **Gateway Foundation** | Provides a programmatic localhost mock gateway, dry-run routing, resilience simulation, client previews, and local observability. |

The CLI has no third-party runtime dependencies. Development and documentation tooling remain listed as development dependencies.

---

## Integration Scope

The repository includes adapter templates and configuration guidance. “Bundled” means the project ships the relevant files; it does not imply official endorsement or complete behavioral compatibility with every version of a third-party tool.

| Tool | Bundled project asset | Scope |
|:---|:---|:---|
| **Codex** | `adapters/codex/AGENTS.md` | Adapter template |
| **Claude Code** | `adapters/claude/CLAUDE.md` | Adapter template |
| **Cursor** | `adapters/cursor/.cursorrules` | Adapter template |
| **Gemini** | `adapters/gemini/GEMINI.md` | Adapter template |
| **Antigravity** | `adapters/antigravity/` | Adapter and settings templates |
| **VS Code** | `adapters/vscode/.vscode/settings.json` | Workspace settings template |
| **Cline, Continue, Roo Code, Aider, and MCP clients** | Client profiles and examples | Preview or manual-review scope |
| **Generic OpenAI-compatible and Node clients** | Gateway client plans | Locally validated against the mock gateway only |

See the [client compatibility matrix](docs/gateway-client-compatibility-matrix.md) for the tested and untested surface of each integration.

---

## How the Workspace Is Organized

```text
project/
├─ AGENTS.md                 # Shared project instructions
├─ MEMORY.md                 # Durable project context
├─ TASKS.md                  # Current work state
├─ RUNBOOK.md                # Operational procedures
├─ .ai/
│  ├─ config.yaml
│  ├─ context/
│  ├─ skills/
│  ├─ prompts/
│  ├─ checks/
│  ├─ registries/
│  └─ schema/
└─ tool-specific adapter files
```

The root contracts remain human-readable. The `.ai/` layer adds machine-readable metadata, templates, registries, and validation rules.

---

## Essential Commands

```bash
# Initialize or inspect a project
npx multimodel-dev-os@latest init --template nextjs-saas
npx multimodel-dev-os@latest scan
npx multimodel-dev-os@latest status

# Onboard an existing repository
npx multimodel-dev-os@latest onboard analyze
npx multimodel-dev-os@latest onboard recommend
npx multimodel-dev-os@latest onboard plan

# Inspect and synchronize adapter files
npx multimodel-dev-os@latest adapter status
npx multimodel-dev-os@latest adapter diff codex
npx multimodel-dev-os@latest adapter sync codex --approved

# Memory, feedback, proposals, and handoffs
npx multimodel-dev-os@latest memory build
npx multimodel-dev-os@latest feedback list
npx multimodel-dev-os@latest improve review
npx multimodel-dev-os@latest handoff build

# Read-only workflows and Skill OS metadata
npx multimodel-dev-os@latest workflow list
npx multimodel-dev-os@latest workflow plan repo-health
npx multimodel-dev-os@latest skill-os status
npx multimodel-dev-os@latest skill-os validate

# Project and release checks
npx multimodel-dev-os@latest validate
npx multimodel-dev-os@latest doctor
npx multimodel-dev-os@latest verify
```

Write-capable commands use explicit approval flags, and overwriting existing files may require `--force`. Review command output before applying changes.

Full command documentation: **[CLI reference](https://rizvee.github.io/multimodel-dev-os/CLI)**.

---

## Skill OS Foundation

Skill OS is a declarative metadata and validation layer for:

- reusable skills and structured prompt templates;
- tool permission classes;
- advisory guardrails;
- workflow-to-skill references;
- required context declarations;
- draft-only business operator templates.

The current Skill OS layer does not execute external tools, enforce permissions at runtime, send messages, publish content, or turn advisory guardrails into live command blockers.

Start with:

- [Skill OS CLI](docs/skill-os-cli.md)
- [Structured Prompts](docs/structured-prompts.md)
- [Skill Registry](docs/skill-registry.md)
- [Tool Permissions](docs/tool-permissions.md)
- [Hooks and Guardrails](docs/hooks-and-guardrails.md)
- [Business Operator Layer](docs/business-operator-layer.md)

---

## Gateway Foundation — v4.2.0

v4.2.0 introduces a local Gateway Foundation intended for protocol, routing, resilience, compatibility, and observability development.

### Implemented

- localhost-first mock HTTP runtime;
- `GET /health`;
- `GET /v1/models`;
- `POST /v1/chat/completions`;
- deterministic mock chat and SSE streaming;
- runtime-readable provider and model metadata registries;
- deterministic route planning and explanations;
- retry, timeout, quota, rate-limit, fallback, and circuit-breaker simulation;
- preview-only client configuration plans;
- bounded in-memory metrics, traces, usage accounting, and static cost estimates;
- optional token-based authentication for explicitly configured access.

### Current boundaries

- The mock provider is the only executable provider.
- External providers remain metadata-only.
- Provider credential values are not loaded.
- Live provider requests, retry execution, and failover are not enabled.
- Third-party clients are not installed or executed by compatibility tests.
- Observability is local, bounded, redacted, and in-memory.
- The gateway implements a partial OpenAI-compatible subset, not the complete API.
- There is currently no gateway daemon or public hosted service.

Gateway documentation:

- [Architecture](docs/gateway-architecture.md)
- [Protocol](docs/gateway-protocol.md)
- [Runtime](docs/gateway-runtime.md)
- [OpenAI compatibility](docs/gateway-openai-compatibility.md)
- [Client compatibility matrix](docs/gateway-client-compatibility-matrix.md)
- [Observability](docs/gateway-observability.md)
- [Security model](docs/gateway-security-model.md)
- [Known limitations](docs/v4.2-known-limitations.md)
- [API reference](docs/gateway-api-reference.md)

---

## Safety Model

MultiModel Dev OS favors preview, validation, and explicit approval over implicit writes.

- Read-only commands are used for scanning, status, planning, and inspection.
- Write operations require an approval flag where supported.
- Existing files are not silently replaced; overwrite paths use explicit controls and backups where documented.
- Package and repository hygiene checks reject private workflow artifacts and common secret patterns.
- Registry and gateway inputs are validated before use.
- Release publication remains a manual maintainer action.

Review [Security](SECURITY.md), the [gateway security model](docs/gateway-security-model.md), and the [package safety guide](docs/package-safety.md) for the documented boundaries.

---

## Release Status

The current npm release is **v4.2.0**.

- npm package: [`multimodel-dev-os`](https://www.npmjs.com/package/multimodel-dev-os)
- GitHub release: [`v4.2.0`](https://github.com/rizvee/multimodel-dev-os/releases/tag/v4.2.0)
- detailed release notes: [docs/releases/v4.2.0.md](docs/releases/v4.2.0.md)
- release-state policy: [docs/release-state.md](docs/release-state.md)
- complete history: [CHANGELOG.md](CHANGELOG.md)

The optional GitHub Packages mirror is separate from the npm package and may have different visibility or access settings.

---

## Documentation

| Resource | Link |
|:---|:---|
| Documentation portal | [rizvee.github.io/multimodel-dev-os](https://rizvee.github.io/multimodel-dev-os/) |
| Quickstart | [Quickstart guide](https://rizvee.github.io/multimodel-dev-os/quickstart) |
| CLI commands | [CLI reference](https://rizvee.github.io/multimodel-dev-os/CLI) |
| Architecture | [Architecture overview](https://rizvee.github.io/multimodel-dev-os/architecture) |
| Templates | [Template guide](https://rizvee.github.io/multimodel-dev-os/templates-guide) |
| Adapter system | [Adapter documentation](https://rizvee.github.io/multimodel-dev-os/adapters) |
| Skill OS | [Skill OS CLI](https://rizvee.github.io/multimodel-dev-os/skill-os-cli) |
| Gateway | [Gateway architecture](https://rizvee.github.io/multimodel-dev-os/gateway-architecture) |
| Security | [Security threat model](https://rizvee.github.io/multimodel-dev-os/security-threat-model) |

---

## Project Development

```bash
git clone https://github.com/rizvee/multimodel-dev-os.git
cd multimodel-dev-os
npm ci
npm run build
npm test
npm run verify
npm run docs:build
```

The project uses development dependencies for building, testing, and documentation, while the published CLI has zero third-party runtime dependencies.

---

## Contributing

Contributions are welcome for adapters, templates, documentation, tests, registries, and validation rules.

- [Contributing guidelines](CONTRIBUTING.md)
- [Report a bug](https://github.com/rizvee/multimodel-dev-os/issues/new)
- [Request a feature](https://github.com/rizvee/multimodel-dev-os/issues/new)

Please keep compatibility claims evidence-based and document whether an integration is locally validated, protocol-compatible, example-only, or requires manual review.

---

## License

MultiModel Dev OS is available under the [MIT License](LICENSE).