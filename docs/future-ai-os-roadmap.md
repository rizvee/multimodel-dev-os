# Future AI OS Roadmap

This roadmap outlines neutral, product-facing tracks for scaling MultiModel Dev OS into a broader AI operating layer for technical, operational, and document-heavy workflows. These tracks are directional and do not imply committed release scope.

v4.1 shipped the Skill OS foundation: schemas, examples, validation, read-only CLI inspection, declarative guardrails, workflow metadata, business operator templates, and migration/adoption documentation. These features do not execute automation or enforce permissions.

v4.2 is the Gateway Foundation development lane. It realigns the roadmap toward a local-first, governed, multi-provider AI gateway while keeping v4.1 Skill OS as the control plane. The current `main` package version is `4.2.0-dev.0`; v4.2 is not released. See [v4.2 Gateway Foundation Planning](./v4.2-planning.md).

Sprint A adds gateway contracts, schemas, fixtures, and docs only. No gateway runtime, provider execution, live routing, live fallback, or runtime permission enforcement exists yet.

Sprint B adds deterministic runtime-readable provider/model registry snapshots. These snapshots validate metadata for future routing but still do not execute providers, read credential values, probe local engines, or run routing/fallback logic.

Sprint C adds deterministic route planning and dry-run explanations over those snapshots. It still does not contact providers, execute model requests, execute fallback attempts, read credentials, tokenize prompts, or perform live pricing/latency lookups.

Sprint D adds deterministic resilience planning and simulation for provider failure classification, retry budgets, backoff schedules, timeout budgets, fallback transitions, circuit-breaker state, rate-limit/quota responses, and failure-chain explanations. It still does not contact providers, perform retries, perform provider failover, wait on timeouts, persist circuit state, or read credentials.

## Structured Prompting Layer

Implement reusable RACE+ templates for consistent, inspectable prompts:

- Role
- Action
- Context
- Expectation
- Constraints
- Output format
- Verification
- Next action

Sprint A foundation files:

- `.ai/prompts/race-plus.md`
- `.ai/registries/prompt-templates.yaml`
- `.ai/schema/prompt-template.schema.json`

Sprint B validation:

- JSON schema files parse.
- RACE+ registry files parse.
- Required RACE+ fields are present.
- Referenced files stay inside the workspace.

Sprint C inspection:

- `skill-os status`
- `skill-os validate`
- `skill-os list prompts`
- `skill-os show prompt <id>`

## Skill-First Workflow System

Convert repeated workflows into reusable skills that can be versioned, reviewed, and validated:

- SEO audit
- Competitor intelligence
- Release governance
- Security audit
- Tracking audit
- Content brief
- Customer reply generation
- SOP drafting
- KPI snapshot
- Document production

Sprint E workflow metadata:

- Workflows can reference skill IDs.
- Workflows can reference prompt template IDs.
- Workflows can reference permission and guardrail IDs.
- Required context files are validated as safe relative paths.
- Existing workflows without Skill OS metadata remain valid.

## MCP Permission Model

Define tool permission classes so connected tools can be routed through predictable safety boundaries:

- Read-only
- Draft-only
- Write-with-confirmation
- Restricted-admin

Sprint A foundation files:

- `.ai/registries/tool-permissions.yaml`
- `.ai/schema/tool-permission.schema.json`

Sprint B validation:

- Permission classes are known.
- Restricted and write-capable tools require confirmation.
- Dangerous operations cannot be classified as read-only.

Sprint C inspection:

- `skill-os list permissions`
- `skill-os show permission <id>`

## Hooks and Guardrails

Define minimum guardrails for higher-trust automation:

- Pre-tool destructive command blocking
- Secret and environment dump blocking
- Publish, deploy, DNS, and ad-spend confirmation
- Post-change validation reminders
- Session summary capture

Sprint D foundation files:

- `.ai/registries/guardrails.yaml`
- `.ai/schema/guardrail.schema.json`
- `.ai/checks/pre-tool.md`
- `.ai/checks/pre-write.md`
- `.ai/checks/pre-external-write.md`
- `.ai/checks/post-change-validation.md`
- `.ai/checks/session-summary.md`
- `.ai/checks/ops-write-safety.md`
- `docs/hooks-and-guardrails.md`

Sprint D validation:

- JSON schema files parse.
- Guardrail registry files parse.
- Required fields are present.
- Confirmation flags verified for restricted/admin/external operations.
- Advisory-only mode is declared.

Sprint E integration:

- Workflow `skill_os.guardrails` references are validated.
- Guardrails remain advisory and are not triggered by workflow execution.

## Agent Clusters

Define future clusters around recurring work modes:

- Core technical
- Growth marketing
- Business ops
- DevOps security
- Document production
- Academic execution

## Context Discipline

Keep strengthening context loading and retrieval so work stays focused:

- Current-state files
- Compressed summaries
- Skill-triggered context loading
- Route-based retrieval
- Small focused prompts

## Business Operator Layer

Future operational skills can extend the same safe workflow model beyond code:

- Inbox triage
- Meeting recap
- Weekly review
- KPI snapshot
- Template builder
- Project pulse
- Creative swipe intelligence
- Content brief system

Sprint F template foundation:

- Adds generic operator skills and RACE+ prompts under `.ai/skills/` and `.ai/prompts/`.
- Registers operator templates as `business-operator` skills with `draft-only` permissions.
- Adds validation-only workflow metadata for weekly review, content brief, and project pulse examples.
- Keeps all templates public-facing and free of private business data.
- Does not call connectors, send messages, publish content, or update external systems.

See [Business Operator Layer](./business-operator-layer.md) for the current template boundary.

Sprint G documentation hardening:

- Adds a migration guide for markdown skills, raw prompts, and workflow-only YAML.
- Adds an adoption checklist for prompt, skill, permission, guardrail, workflow, and operator template hygiene.
- Adds an authoring reference for field-level registry metadata.
- Keeps the v4.1 foundation framed as declarative, validation-only, and read-only for inspection.

## v4.2 Gateway Foundation Direction

Recommended v4.2 tracks:

- Define a local OpenAI-compatible gateway contract before adding runtime behavior.
- Turn existing model, provider, local model, and routing preset metadata into runtime-ready registry inputs.
- Add deterministic routing design for explicit model selection, capability matching, cost, latency, context window, privacy/local-first policy, and fallback planning.
- Add deterministic resilience simulation for retry, timeout, rate-limit, quota, circuit-breaker, and fallback transition planning.
- Plan provider adapter contracts for request normalization, response normalization, streaming, errors, usage, and health.
- Keep Skill OS, workflows, permissions, guardrails, memory, adapters, and validation as the governance/control plane around the future gateway runtime.
- Design security boundaries for credentials, redacted logs, localhost binding, provider URL validation, request limits, timeouts, and audit records.
- Keep v4.2 foundation scope small: one generic OpenAI-compatible provider adapter, one mock provider, deterministic routing, fallback simulation, and a local-only gateway.

The v4.2 plan does not claim that a gateway runtime, live provider execution, runtime permission enforcement, or live multi-provider fallback already exists.
