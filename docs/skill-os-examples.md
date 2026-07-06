# Skill OS Examples

These small examples show the v4.1 metadata shape. They are generic and public-facing.

Skill OS examples are declarative. They do not execute prompts, enforce permissions, call external tools, or write to external systems.

## Registered Skill

```yaml
skills:
  project-pulse:
    id: project-pulse
    name: Project Pulse
    version: 1.0.0
    description: Draft a compact project status summary from provided notes.
    category: business-operator
    risk_level: low
    permissions:
      - draft-only
    skill_file: .ai/skills/project-pulse.md
    checks:
      - .ai/checks/context-budget.md
```

## RACE+ Prompt

```yaml
prompt_templates:
  project-pulse:
    id: project-pulse
    name: Project Pulse
    version: 1.0.0
    description: Structure provided project notes into a draft update.
    race_plus:
      role: Project status assistant
      action: Summarize provided notes into status, risks, decisions, and next actions.
      context:
        required_files:
          - .ai/prompts/project-pulse.md
      expectation: Produce a review-ready draft.
      constraints:
        - Do not update external project systems.
        - Do not notify stakeholders.
      output_format: project-pulse-draft
      verification:
        - Confirm all claims come from provided notes.
      next_action: Ask for review before sharing externally.
```

## Permission Entry

```yaml
tool_permissions:
  operator-draft:
    tool_id: operator-draft
    display_name: Operator Draft
    class: draft-only
    allowed_operations:
      - Draft summaries from provided notes
    blocked_operations:
      - Send messages
      - Update external systems
      - Publish content
    requires_confirmation: false
    requires_clean_worktree: false
    requires_validation: true
    audit_log: false
```

## Guardrail Entry

```yaml
guardrails:
  - id: post-change-validation
    name: Post-change validation reminder
    version: 1.0.0
    type: post_change
    severity: medium
    check_file: .ai/checks/post-change-validation.md
    requires_confirmation: false
    requires_clean_worktree: false
    validation:
      deterministic: true
      advisory_only: true
```

## Workflow with `skill_os`

```yaml
workflows:
  operator-project-pulse:
    name: Operator Project Pulse
    description: Drafts a compact project pulse from provided notes.
    risk_level: low
    allowed_to_write_memory: false
    allowed_to_modify_source: false
    skill_os:
      skills:
        - operator-project-pulse
      prompts:
        - operator-project-pulse
      permissions:
        - operator-draft
      guardrails:
        - post-change-validation
      required_context:
        - .ai/prompts/operator-project-pulse.md
```

Validation checks that the referenced IDs and paths exist. It does not execute the workflow metadata.
