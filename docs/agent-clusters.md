# Agent Clusters

v4.1 Sprint A adds an optional agent cluster registry for future Skill OS routing.

Agent clusters are routing metadata, not autonomous agents. Sprint A does not execute clusters, spawn agents, or change runtime behavior.

## Files

```text
.ai/registries/agent-clusters.yaml
.ai/schema/agent-cluster.schema.json
```

## Included Clusters

The Sprint A registry defines six generic clusters:

- `core-technical`
- `growth-marketing`
- `business-ops`
- `devops-security`
- `document-production`
- `academic-execution`

Each cluster describes:

- Scope
- Typical skills
- Allowed tool classes
- Required context
- Outputs
- Validation expectations

## Sprint C Status

Agent clusters remain declarative, and Sprint C adds read-only CLI inspection:

- No autonomous execution.
- No agent spawning.
- No permission enforcement.
- No runtime behavior change.
- Validation checks cluster IDs, referenced skill IDs, allowed tool classes, required context paths, outputs, and validation expectations.
- `multimodel-dev-os skill-os list clusters` prints known cluster IDs.
- `multimodel-dev-os skill-os show cluster <id>` prints scope and allowed tool classes.

Future sprints may add read-only inspection and validation before any workflow integration.

## Sprint D - Guardrail Association

Agent clusters define `allowed_tool_classes` which are subject to guardrail validation.
- Agent clusters containing high-risk permissions (e.g. `restricted-admin` class) automatically trigger the associated `restricted-admin-ops` guardrail checks.
- Advisory validation checks verify that clusters respect the guardrail limits defined in `.ai/registries/guardrails.yaml`.

## Design Rules

- Keep clusters broad enough to route work, not so broad that they load excessive context.
- Keep allowed tool classes explicit.
- Default non-technical operator workflows to `read-only` or `draft-only`.
- Keep public examples generic.
- Treat restricted-admin operations as opt-in and confirmation-gated in future guardrails.
