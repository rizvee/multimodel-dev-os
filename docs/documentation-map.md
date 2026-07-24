# MultiModel Dev OS — Documentation Map

Welcome to the goal-driven navigation map for MultiModel Dev OS documentation. This page organizes all public documentation by developer objective to help you quickly find the exact guide, reference, or specification you need.

---

## 1. Quickstart & Onboarding

If you are new to MultiModel Dev OS or looking to onboard an existing repository:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| Install & run first health checks | [Quickstart Guide](quickstart.md) | Install `multimodel-dev-os`, run `init`, `status`, and `verify`. |
| Learn command-line flags | [CLI Reference](CLI.md) | Full flag and command matrix for the standalone binary. |
| Onboard an existing codebase | [Real Repo Onboarding](real-repo-onboarding.md) | Analyze project structure, select templates, and safely sync configs. |
| Try an interactive demo | [Interactive CLI Demo](demo.md) | Walkthrough of CLI commands in simulated environments. |
| Get answers to common questions | [Frequently Asked Questions](faq.md) | FAQ covering lock-in, tool compatibility, and zero-dependency design. |

---

## 2. Core Concepts & Architecture

Understand the underlying design philosophy and zero-dependency operating layer:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| High-level architecture overview | [Architecture Specifications](architecture.md) | Structural overview of CLI, adapters, registries, and runtime. |
| Long-term architecture vision | [Future-Proof Architecture](future-proof-architecture.md) | Principles behind vendor-neutral workspace standardization. |
| Core protocol contract | [Protocol Specification](protocol.md) | File formats, directory structure, and schema standards. |
| Backwards compatibility guarantee | [Stable Protocol Spec](stable-protocol.md) | Guarantees on workspace configuration stability across versions. |
| Safety & security posture | [Package Safety Model](package-safety.md) | Zero runtime dependencies, prepublish safety, and approval gates. |

---

## 3. Workflows & Multi-Agent Operations

Orchestrate complex tasks across multiple AI coding agents:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| Multi-agent handoff standards | [Multimodel Workflow](multimodel-workflow.md) | Context preservation guidelines when moving between tools. |
| Workflow orchestration engine | [Workflow Orchestration](workflow-orchestration.md) | Declarative workflow definitions and step-by-step execution. |
| Concrete workflow examples | [Workflow Examples](workflow-examples.md) | Code refactoring, feature implementation, and bug fix playbooks. |
| Token footprint reduction | [Caveman Mode Specifications](caveman-mode.md) | Shorthand context declarations saving up to ~79% on API tokens. |

---

## 4. Skill OS & Declarative Governance

Manage skills, prompt templates, permissions, and guardrails:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| Skill OS CLI commands | [Skill OS CLI Reference](skill-os-cli.md) | `multimodel-dev-os skill-os status`, `validate`, `list`, and `inspect`. |
| Skill registry schema | [Skill Registry](skill-registry.md) | Declarative skill definitions, inputs, outputs, and validation rules. |
| Authoring new skills | [Skill Authoring Guide](skill-authoring.md) & [Authoring Reference](skill-os-authoring-reference.md) | Step-by-step guide to writing valid Skill OS modules. |
| Migrating existing prompts | [Skill OS Migration Guide](skill-os-migration-guide.md) | Convert unstructured markdown prompts into Skill OS format. |
| Skill OS adoption checklist | [Adoption Checklist](skill-os-adoption-checklist.md) | Verification steps for team-wide Skill OS rollout. |
| Structured prompt templates | [Structured Prompts](structured-prompts.md) | RACE+ prompt frameworks and public operator templates. |
| Tool permissions governance | [Tool Permissions](tool-permissions.md) | Granular tool execution policies and path access controls. |

---

## 5. Localhost Gateway Foundation (v4.2.0)

Explore the local OpenAI-compatible mock gateway:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| Gateway architecture overview | [Gateway Architecture](gateway-architecture.md) | Overall design of the localhost mock gateway foundation. |
| REST API endpoints & protocol | [Gateway Protocol](gateway-protocol.md) | `GET /health`, `GET /v1/models`, `POST /v1/chat/completions`. |
| OpenAI API compatibility | [OpenAI Compatibility](gateway-openai-compatibility.md) | Parity details with standard OpenAI SDKs and clients. |
| Runtime provider registry | [Gateway Runtime Registry](gateway-runtime-registry.md) | Inspection of bundled mock provider schemas and models. |
| Routing engine & strategies | [Gateway Routing Engine](gateway-routing-engine.md) & [Routing Strategies](gateway-routing-strategies.md) | Deterministic route planning and scoring rules. |
| Dry-run resilience planning | [Gateway Resilience](gateway-resilience.md) & [Resilience Simulation](gateway-resilience-simulation.md) | Fallback chain planning and failure mode simulation. |
| Local server & mock provider | [Gateway Local Server](gateway-local-server.md) & [Mock Provider](gateway-mock-provider.md) | Running `127.0.0.1` mock runtime and mock responses. |
| SSE streaming support | [Gateway Streaming](gateway-streaming.md) | Server-Sent Events (SSE) streaming format verification. |
| Local observability & tracing | [Gateway Observability](gateway-observability.md) & [Usage Accounting](gateway-usage-accounting.md) | Local, bounded, redacted, in-memory metrics and cost estimation. |
| Execution contracts reference | [Execution Contracts](execution-contracts.md) | Governed outbound request, result, endpoint, credential ref, and error contracts. |
| OpenAI adapter normalization | [OpenAI Adapter Normalization](openai-adapter-normalization.md) | Request/response/error payload normalization & SSE parsing. |
| Credential resolution architecture | [Credential Resolution](credential-resolution.md) | Governed environment credential resolution & secret redaction. |
| Governed opt-in execution gate | [Governed Execution](governed-execution.md) | Governed preflight execution gate & single-attempt executor. |
| Known limits of v4.2 | [v4.2 Known Limitations](v4.2-known-limitations.md) | Explicit boundaries (mock-only provider, preview-only configs). |



---

## 6. Registries, Signing & Trust Model

Inspect trusted registry infrastructure and Ed25519 signature enforcement:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| Trusted registries overview | [Trusted Registries](trusted-registries.md) | Signed registry sources, mirrors, and trust policies. |
| Registry synchronization | [Registry Sync Guide](registry-sync.md) | Pulling, updating, and verifying local registry caches. |
| Policy evaluation engine | [Registry Policy Engine](registry-policy.md) | Enforcing compliance checks against governance rules. |
| Ed25519 digital signatures | [Registry Signing](registry-signing.md) & [Trust Store](registry-trust-store.md) | Cryptographic signature verification and public key storage. |
| Registry security architecture | [Registry Security Model](registry-security.md) | Tamper-resistance and cryptographic chain-of-trust. |

---

## 7. Tool Adapters & Client Integrations

Synchronize instructions across AI coding tools and editor plugins:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| Adapter setup overview | [Adapters Setup Guide](adapters.md) | Overview of supported adapters (Antigravity, Claude Code, Cursor, etc.). |
| Synchronize tool configs | [IDE Adapter Sync](adapter-sync.md) | Running `adapter sync` to propagate `AGENTS.md` rules. |
| Author custom tool adapters | [Custom Adapters Guide](adapter-authoring.md) | Building new adapters for specialized coding environments. |
| Tool feature support matrix | [Agent Compatibility Mappings](agent-compatibility.md) | Comparison of feature support across supported tools. |
| Gateway client configuration | [Gateway Client Integrations](gateway-client-integrations.md) | Local client preview config generation and compatibility matrix. |

---

## 8. v4.3 Development & Release Planning

Track active development and long-term release roadmaps:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| v4.3 Development Plan | [v4.3 Planning](v4.3-planning.md) | Scope lock and architecture for Governed Provider Execution. |
| Release state tracking | [Release State](release-state.md) | Official release statuses across npm, GitHub, and dev lane. |
| Product roadmap | [Future AI OS Roadmap](future-ai-os-roadmap.md) | Long-term product tracks and architectural vision. |
| Threat model | [Security Threat Model](security-threat-model.md) | Security boundaries, credential policies, and SSRF guards. |
| Guardrails & action hooks | [Hooks and Guardrails](hooks-and-guardrails.md) | Intercepting file writes and command executions. |

---

## 9. Releases & Governance

Review version history, release notes, and contribution guidelines:

| Developer Objective | Recommended Document | Description |
|:---|:---|:---|
| Current release notes | [Release v4.2.0](releases/v4.2.0.md) | Delivered capabilities, upgrade steps, and verification summary. |
| Release state matrix | [Release State](release-state.md) | Active vs historical version release matrix. |
| Contribution guidelines | [Contributing Guide](contributing.md) | How to propose improvements while adhering to zero-dependency rules. |
| Security vulnerability reporting | [Security Policy](../SECURITY.md) | Responsible disclosure process and security contact points. |
