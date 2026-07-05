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

## Sprint A Status

Prompt templates are declarative in Sprint A:

- No automation execution.
- No runtime behavior change.
- No permission enforcement.
- No CLI command changes.
- Existing markdown prompts remain valid.

Future sprints are expected to add validation, listing, and inspection before any execution workflow is considered.

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
