# Business Operator Layer

v4.1 Sprint F adds generic business operator templates to the Skill OS foundation.

This sprint is templates and metadata only. It does not call external tools, send messages, update systems, publish content, spend money, or enforce permissions.

## Purpose

The business operator layer demonstrates how Skill OS can support non-code workflows while staying safe by default. Templates turn provided notes into reviewable drafts for routine operational work.

## Supported Template Families

- Inbox triage
- Meeting recap
- KPI snapshot
- Weekly review
- SOP builder
- Project pulse
- Content brief
- Creative intelligence

Each family has:

- A markdown skill file under `.ai/skills/`
- A RACE+ prompt file under `.ai/prompts/`
- Skill metadata in `.ai/registries/skills.yaml`
- Prompt metadata in `.ai/registries/prompt-templates.yaml`

## Draft-Only Default

Business operator templates use `draft-only` permissions by default. They are intended to structure information supplied by a maintainer, not to fetch private data or perform external actions.

The shared boundary is:

```text
This skill drafts, summarizes, or structures information only.
It does not send messages, update systems, publish content, spend money, or perform external writes.
```

## Skills, Prompts, and Workflows

Skill files describe when a template should be used, required input, safe output, constraints, verification, and next action.

Prompt files follow the RACE+ structure:

- Role
- Action
- Context
- Expectation
- Constraints
- Output format
- Verification
- Next action

Workflow examples such as `operator-weekly-review`, `operator-content-brief`, and `operator-project-pulse` reference the templates through `skill_os` metadata only. The references are validation targets, not execution hooks.

## What Is Not Automated

Sprint F intentionally does not automate:

- Live Gmail, Calendar, Drive, Slack, CRM, or analytics actions
- Inbox reads, sends, labels, archives, forwards, or deletes
- Calendar event creation or meeting updates
- Dashboard writes or analytics queries
- Project management updates
- Document publishing
- Ad spend or campaign changes
- External notifications

## Future Connector Integrations

Future connector or MCP integrations should require explicit permission classes and confirmation before any external write is possible.

Recommended future boundaries:

- Use `read-only` for inspection-only connectors.
- Use `draft-only` for generated drafts that stay in chat or local review.
- Use `write-with-confirmation` for reversible external writes.
- Use `restricted-admin` for publish, deploy, DNS, billing, credential, or ad-spend operations.

Permission enforcement is not active in Sprint F.

## Safe Usage Examples

```bash
multimodel-dev-os skill-os show skill operator-weekly-review
multimodel-dev-os skill-os show prompt operator-content-brief
multimodel-dev-os workflow show operator-project-pulse
```

These commands inspect metadata only. They do not run connector actions or write to external systems.
