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

## Sprint B Status

Agent clusters remain declarative, but Sprint B adds validation for the bundled cluster registry:

- No autonomous execution.
- No agent spawning.
- No CLI command change.
- No permission enforcement.
- No runtime behavior change.
- Validation checks cluster IDs, referenced skill IDs, allowed tool classes, required context paths, outputs, and validation expectations.

Future sprints may add read-only inspection and validation before any workflow integration.

## Design Rules

- Keep clusters broad enough to route work, not so broad that they load excessive context.
- Keep allowed tool classes explicit.
- Default non-technical operator workflows to `read-only` or `draft-only`.
- Keep public examples generic.
- Treat restricted-admin operations as opt-in and confirmation-gated in future guardrails.
