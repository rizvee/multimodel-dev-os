# Structured Prompts

v4.1 Sprint A introduces the first Skill OS structured prompting foundation for MultiModel Dev OS.

This sprint adds schemas and examples only. It does not execute prompt templates, enforce output styles, or change CLI behavior.

## RACE+

RACE+ is the proposed reusable prompt contract:

- Role
- Action
- Context
- Expectation
- Constraints
- Output format
- Verification
- Next action

The base markdown template lives at:

```text
.ai/prompts/race-plus.md
```

Example prompt template metadata lives at:

```text
.ai/registries/prompt-templates.yaml
```

The schema reference lives at:

```text
.ai/schema/prompt-template.schema.json
```

## Sprint F Status

Prompt templates remain declarative. Sprint C added read-only CLI inspection for bundled and local registries, and Sprint F adds generic operator prompts for draft-only business workflows:

- No automation execution.
- No runtime behavior change.
- No permission enforcement.
- Existing markdown prompts remain valid.
- Validation checks IDs, versions, complete RACE+ fields, safe referenced files, constraints, and verification arrays.
- `multimodel-dev-os skill-os list prompts` prints known prompt template IDs.
- `multimodel-dev-os skill-os show prompt <id>` prints selected RACE+ fields.
- Operator prompt files live under `.ai/prompts/operator-*.md` and remain generic public templates.

Future sprints may add richer listing before any execution workflow is considered.

## Template Shape

```yaml
id: release-audit
name: Release Audit
version: 1.0.0
description: Audit whether a prepared release is safe to finalize.
race_plus:
  role: Release engineer
  action: Audit release state and package metadata.
  context:
    required_files:
      - package.json
      - CHANGELOG.md
  expectation: Produce a blocker-first release report.
  constraints:
    - Do not publish npm unless explicitly approved.
  output_format: markdown-report
  verification:
    - npm run verify
  next_action: Wait for maintainer approval.
```

## Design Rules

- Keep templates portable across agents and IDEs.
- Keep examples generic and public-facing.
- Separate instructions from tool execution.
- Do not claim unreleased runtime support.
- Prefer small focused templates over broad prompt bundles.
- Use `skill-os` commands for read-only local inspection.

## Business Operator Prompts

Sprint F adds RACE+ prompt templates for inbox triage, meeting recap, KPI snapshot, weekly review, SOP builder, project pulse, content brief, and creative intelligence.

These prompts structure provided information only. They do not fetch connector data, send messages, update systems, publish content, or spend money.
