# Hooks and Guardrails

## What are Guardrails?
Guardrails are declarative safety checks and governance rules that specify constraints and validation requirements for tools, write operations, and developer sessions. In the MultiModel Dev OS architecture, guardrails operate under the Skill OS verification framework.

## Guardrails in v4.1
In v4.1, all guardrails are **declarative and advisory only**.
- **No live command blocking**: The validation engine validates that guardrail declarations are formatted correctly and meet constraints, but does not intercept or block live command execution.
- **No MCP/tool interception**: There is no runtime interception of MCP tools, local commands, or filesystem operations.
- **No hidden automation**: Guardrails do not trigger hidden scripts, hooks, or backend automation.
- **Validation only**: The `skill-os validate` command audits that the guardrail definitions match the JSON schema and satisfy all metadata rules.

## Future Enforcement
These advisory definitions lay the groundwork for future releases where:
- A sandbox environment can intercept and check tool calls against `pre_tool` guardrails.
- Filesystem writes can run pre-write dry-runs to inspect file content before writing.
- External hooks can verify worktree state before git pushing or npm publishing.

## Relation to Tool Permissions
Tool permissions define the general capability access (e.g. read-only, write-with-confirmation) for a tool class or agent cluster. Guardrails provide more granular, operational rules that apply *within* those permissions (for example, requiring human confirmation for force pushes even if git-push permission is granted).

## Restricted/Admin Operations
Because enforcement is advisory-only in v4.1, restricted and administrative operations still rely on **explicit human approval** in prompts, manual reviews, and human-in-the-loop workflows.

## Generic Examples
The bundled guardrails registry includes generic examples (such as blocking destructive git commands) to demonstrate validation semantics.

## Workflow Metadata

v4.1 Sprint E allows workflows to reference guardrail IDs in optional `skill_os.guardrails` metadata. These references are validated so stale IDs are caught early, but guardrails are not applied during workflow execution.

Example:

```yaml
skill_os:
  guardrails:
    - confirm-external-write
```

This metadata is advisory only. It documents the intended safety context for a workflow and supports local validation.
