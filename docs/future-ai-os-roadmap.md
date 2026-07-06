# Future AI OS Roadmap

This roadmap outlines neutral, product-facing tracks for scaling MultiModel Dev OS into a broader AI operating layer for technical, operational, and document-heavy workflows. These tracks are directional and do not imply committed release scope.

v4.1 Sprint A added schema and example foundations. v4.1 Sprint B adds validation for those bundled registries only; it does not execute automation or enforce permissions.

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

## Hooks and Guardrails

Define minimum guardrails for higher-trust automation:

- Pre-tool destructive command blocking
- Secret and environment dump blocking
- Publish, deploy, DNS, and ad-spend confirmation
- Post-change validation reminders
- Session summary capture

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
