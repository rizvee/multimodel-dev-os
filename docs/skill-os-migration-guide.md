# Skill OS Migration Guide

This guide is for teams that already use markdown skills, loose prompts, workflow YAML, or generic tool notes and want to adopt the v4.1 Skill OS foundation gradually.

v4.1 Skill OS metadata is declarative. Validation checks structure and references; it does not execute automation. Permissions are not runtime-enforced yet. Guardrails are advisory-only in v4.1. Any future external write path must require explicit implementation and maintainer confirmation.

## Before and After

| Before | After |
|:---|:---|
| Markdown-only skill files | Markdown skills plus optional `skills.yaml` metadata |
| Raw prompts copied into chat | RACE+ prompt templates with clear output and verification contracts |
| Workflow-only YAML | Workflow YAML plus optional `skill_os` metadata |
| Generic tool notes | Declarative tool permission classes and advisory guardrails |
| Informal operator prompts | Draft-only business operator templates |

## Markdown Skill to Registered Skill

1. Keep the existing markdown skill file.
2. Add an entry to `.ai/registries/skills.yaml`.
3. Use a lowercase slug for `id`.
4. Point `skill_file` at the existing markdown file.
5. Choose a conservative `risk_level`.
6. Add `permissions` using existing permission classes.
7. Add `checks` only when the referenced check files exist.
8. Run `multimodel-dev-os skill-os validate`.

Minimal example:

```yaml
skills:
  release-governance:
    id: release-governance
    name: Release Governance
    version: 1.0.0
    description: Audit release state without publishing automatically.
    category: release-governance
    risk_level: high
    permissions:
      - read-only
      - draft-only
    skill_file: .ai/skills/release-governance.md
    checks:
      - .ai/checks/post-change-validation.md
```

## Raw Prompt to RACE+ Prompt Template

1. Split the prompt into Role, Action, Context, Expectation, Constraints, Output format, Verification, and Next action.
2. Store the reusable prompt text in `.ai/prompts/`.
3. Add metadata to `.ai/registries/prompt-templates.yaml`.
4. Keep examples generic and public-facing.
5. Run local validation.

RACE+ helps keep prompts inspectable. It does not execute the prompt or call tools.

## Workflow YAML to Workflow plus Skill OS Metadata

Existing workflows remain valid without Skill OS metadata. To add metadata:

```yaml
skill_os:
  skills:
    - release-governance
  prompts:
    - release-audit
  permissions:
    - git-push
  guardrails:
    - confirm-external-write
  required_context:
    - docs/release-state.md
```

Validation checks that referenced IDs and paths exist. Workflow execution behavior does not change because of `skill_os`.

## Classify Permissions

Use the safest class that describes the intended boundary:

| Class | Use When |
|:---|:---|
| `read-only` | The work inspects, lists, searches, or reports. |
| `draft-only` | The work prepares text, plans, briefs, recaps, or patches for review. |
| `write-with-confirmation` | A future implementation may write after explicit confirmation. |
| `restricted-admin` | The action involves publish, deploy, DNS, credentials, billing, or ad spend. |

Do not classify dangerous operations as `read-only`.

## Attach Guardrails

Add guardrails when a workflow or skill may later approach a sensitive action. In v4.1, guardrails are advisory metadata validated by `skill-os validate`; they do not block real commands.

Use guardrails to document:

- destructive command boundaries
- secret and environment dump boundaries
- publish, deploy, DNS, and ad-spend confirmation boundaries
- post-change validation reminders
- session summary capture expectations

## Keep Workflows Read-Only or Draft-Only

For adoption work, prefer workflows that:

- set `allowed_to_write_memory: false`
- set `allowed_to_modify_source: false`
- use `read-only` or `draft-only` permission metadata
- describe manual review as the next action
- avoid connector-specific private workflows

Business operator templates should remain draft-only unless a future connector integration is explicitly designed and approved.

## Validate Locally

```bash
multimodel-dev-os skill-os status
multimodel-dev-os skill-os validate
multimodel-dev-os skill-os list skills
multimodel-dev-os workflow show <workflow-id>
npm run verify
```

## Common Mistakes

- Treating validation as automation execution.
- Assuming permissions are runtime-enforced in v4.1.
- Referencing files that do not exist.
- Using absolute paths or path traversal.
- Adding private business data to public templates.
- Marking publish, deploy, DNS, credential, or ad-spend actions as low-risk read-only work.
- Adding workflow `skill_os` metadata and expecting workflow commands to execute prompts or skills.

## Safe Release Checklist

- New docs avoid claims of runtime permission enforcement.
- New templates are generic and public-facing.
- `skill-os validate` passes.
- `npm run verify` passes.
- `npm run docs:build` passes.
- Package version and release tags are unchanged unless the release task explicitly approves them.
- External writes remain manual and confirmation-gated for future implementation.
