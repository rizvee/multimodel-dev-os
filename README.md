# MultiModel Dev OS

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/docs/assets/readme/readme-hero.svg" alt="MultiModel Dev OS - governed workspace standard for AI coding tools" width="100%">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/multimodel-dev-os"><img src="https://img.shields.io/npm/v/multimodel-dev-os.svg?color=0f766e&style=flat-square" alt="npm version"></a>
  <a href="https://github.com/rizvee/multimodel-dev-os/releases/latest"><img src="https://img.shields.io/github/v/release/rizvee/multimodel-dev-os?color=1d4ed8&style=flat-square" alt="latest GitHub release"></a>
  <a href="https://github.com/rizvee/multimodel-dev-os/actions/workflows/verify.yml"><img src="https://img.shields.io/github/actions/workflow/status/rizvee/multimodel-dev-os/verify.yml?branch=main&style=flat-square&label=verification" alt="verification status"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 20 or newer"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-334155?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <strong>A zero-runtime-dependency workspace standard for governed AI development.</strong><br>
  <sub>Centralize instructions, skills, registries, workflows, adapters, and local gateway metadata in one auditable repository.</sub>
</p>

<p align="center">
  <a href="https://rizvee.github.io/multimodel-dev-os/">Documentation</a> |
  <a href="https://rizvee.github.io/multimodel-dev-os/quickstart">Quickstart</a> |
  <a href="docs/documentation-map.md">Documentation Map</a> |
  <a href="docs/gateway-architecture.md">Gateway Architecture</a> |
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

## Fast Start

Requirements:

- Node.js 20 or newer
- Windows, macOS, or Linux

```bash
npm install -g multimodel-dev-os
multimodel-dev-os init
multimodel-dev-os status
multimodel-dev-os verify
```

Prefer one-off usage:

```bash
npx multimodel-dev-os@latest init
npx multimodel-dev-os@latest verify
```

MultiModel Dev OS is published as `multimodel-dev-os` on npm. The package has no third-party runtime dependencies.

## Why It Exists

AI-assisted development gets messy when every tool has its own rules, prompts, memory, templates, and workflow assumptions. MultiModel Dev OS gives a repository one public source of truth so teams can keep that operating layer structured, portable, and verifiable.

It is designed for projects that need:

- consistent workspace instructions across AI coding tools and editor integrations
- governed prompt, skill, workflow, and permission metadata
- deterministic validation before changes are trusted
- local-first gateway foundations without activating external providers by default
- a clean public repository surface that stays package-safe

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/docs/assets/readme/readme-flow.svg" alt="How MultiModel Dev OS connects repository standards, governance, validation, adapters, and gateway foundations" width="100%">
</p>

## What You Get

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/docs/assets/readme/readme-feature-cards.svg" alt="MultiModel Dev OS feature highlights: workspace standardization, Skill OS, registry trust, validation-first safety, gateway foundation, local observability" width="100%">
</p>

### Workspace Standardization

- Repository-level operating instructions in `AGENTS.md`
- Adapter assets for common AI coding tool surfaces
- Templates, examples, onboarding helpers, and consistency checks
- Deterministic build output for the standalone CLI

### Skill OS Governance

- Skill, prompt, workflow, permission, guardrail, and agent-cluster registries
- RACE+ prompt templates and public business operator templates
- Read-only Skill OS inspection commands
- Validation-only safety model for declarative governance metadata

### Gateway Foundation

- Localhost mock gateway runtime with `GET /health`, `GET /v1/models`, and `POST /v1/chat/completions`
- Deterministic mock non-streaming and SSE streaming responses
- Runtime-readable provider, model, local-model, and routing-preset registries
- Dry-run route planning, fallback-chain planning, and resilience simulation
- Preview-only client configuration plans for local OpenAI-compatible testing
- Local, bounded, redacted, in-memory observability and usage accounting

## Safety Model

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/docs/assets/readme/readme-safety.svg" alt="Safety model: zero runtime dependencies, validation-first, approval-gated writes, mock-only gateway, local observability" width="100%">
</p>

MultiModel Dev OS is intentionally conservative:

- **No runtime dependencies:** the published CLI uses Node.js built-ins only.
- **Validation before trust:** strict verification checks cover package hygiene, schemas, registries, docs, gateway contracts, and repository cleanliness.
- **Manual publication:** npm publication is maintainer-controlled and guarded by `scripts/prepublish-guard.js`.
- **Approval-gated writes:** generated plans and adapters are designed to avoid silent global changes.
- **Mock-only execution boundary:** the v4.2 gateway executes only bundled mock models.
- **No hidden provider activation:** external providers are metadata-only until a future explicit implementation enables them.
- **Private-by-default observability:** traces, metrics, usage, and audit events stay local, bounded, redacted, and in memory.

## Current Capability vs Direction

| Area | Current state |
|:---|:---|
| Workspace standard | Shipped. Repository instructions, adapters, templates, and verification are available. |
| Project templates | Shipped. Bundled templates cover web, commerce, SEO, mobile, and general app starting points. |
| Skill OS | Shipped. Registries, prompt templates, workflows, permissions, guardrails, read-only CLI inspection, and validation are available. |
| Registry trust model | Shipped. Signing, trust metadata, and verification checks are part of the package. |
| Gateway runtime | Shipped as a localhost mock runtime only. No external provider calls are made. |
| Client integrations | Shipped as preview-only configuration generation and local protocol fixtures. No third-party client is installed or executed. |
| Routing and resilience | Shipped as deterministic planning and simulation. Live fallback and retry execution are not enabled. |
| External provider execution | Planned for future work. Provider metadata exists, but credentials are not loaded and provider APIs are not called. |
| Production hosted gateway | Not shipped. v4.2 is a local gateway foundation, not a hosted SaaS gateway. |

## Essential Commands

```bash
# Inspect the workspace
multimodel-dev-os status
multimodel-dev-os verify

# Start or onboard a project
multimodel-dev-os init
multimodel-dev-os init --template nextjs-saas
multimodel-dev-os onboard analyze

# Inspect Skill OS metadata
multimodel-dev-os skill-os status
multimodel-dev-os skill-os validate
multimodel-dev-os skill-os list skills
multimodel-dev-os skill-os list prompts

# Synchronize adapter files when explicitly approved
multimodel-dev-os adapter sync all --approved
```

Onboarding analysis and planning are read-only. Applying generated files requires explicit approval.

## Documentation

| Topic | Start here |
|:---|:---|
| Product overview | [Documentation index](docs/index.md) |
| Release state | [Release state](docs/release-state.md) |
| Skill OS | [Skill registry](docs/skill-registry.md), [Skill OS CLI](docs/skill-os-cli.md), [Authoring reference](docs/skill-os-authoring-reference.md) |
| Workflows | [Workflow orchestration](docs/workflow-orchestration.md), [Workflow examples](docs/workflow-examples.md) |
| Gateway architecture | [Gateway architecture](docs/gateway-architecture.md), [Gateway runtime](docs/gateway-runtime.md), [Gateway protocol](docs/gateway-protocol.md) |
| Gateway safety | [Gateway security model](docs/gateway-security-model.md), [Known limitations](docs/v4.2-known-limitations.md), [OpenAI compatibility](docs/gateway-openai-compatibility.md) |
| Clients | [Client integrations](docs/gateway-client-integrations.md), [Compatibility matrix](docs/gateway-client-compatibility-matrix.md), [Client configuration](docs/gateway-client-configuration.md) |
| Observability | [Gateway observability](docs/gateway-observability.md), [Usage accounting](docs/gateway-usage-accounting.md), [Cost estimation](docs/gateway-cost-estimation.md) |
| Release readiness | [v4.2 release readiness](docs/v4.2-release-readiness.md) |

## Package and Release Status

- Latest npm package: `multimodel-dev-os@4.2.0`
- License: MIT
- Runtime dependencies: none
- Required Node.js version: 20 or newer
- Optional GitHub Packages mirror: `@rizvee/multimodel-dev-os`, controlled by GitHub Packages visibility settings

See [docs/release-state.md](docs/release-state.md) for the current release matrix and historical notes.

## Repository Shape

```text
src/        CLI, Skill OS, gateway contracts, runtime, routing, clients, observability
bin/        Generated standalone CLI entrypoint
.ai/        Product schemas, registries, skills, prompts, workflows, and examples
adapters/   Tool-specific adapter assets generated from the shared project standard
docs/       Public manuals, architecture notes, security docs, and release references
tests/      Unit, integration, fixture, and compatibility coverage
scripts/    Build, verification, package, and release-safety checks
```

## Contributing

Contributions are welcome when they preserve the project boundaries:

- keep runtime dependencies at zero unless a future major design decision changes that posture
- keep gateway provider execution explicit, tested, and documented
- avoid hidden writes, global configuration changes, telemetry, and credential loading
- keep public docs factual, polished, and free of private workflow artifacts
- run `npm run build`, `npm test`, and `npm run verify` before proposing changes

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) before opening larger changes.

## License

MIT. See [LICENSE](LICENSE).
