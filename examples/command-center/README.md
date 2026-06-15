# Example: Command Center

Use the repository command center to get a compact operational dashboard and run automated workflows.

## Prerequisites

- Node.js 18+
- A MultiModel Dev OS workspace (`npx multimodel-dev-os@latest init`)

## Commands

```bash
# View compact project dashboard
npx multimodel-dev-os@latest status

# List available workflows
npx multimodel-dev-os@latest workflow list

# Dry-run a workflow to see what would execute
npx multimodel-dev-os@latest workflow plan repo-health

# Run a workflow (read-only, safe execution boundaries)
npx multimodel-dev-os@latest workflow run repo-health

# Build and view session handoff
npx multimodel-dev-os@latest handoff build
npx multimodel-dev-os@latest handoff show
```

## Expected Result

```
📊 Repository Status: my-project
  Version: 1.0.0
  Frameworks: nextjs, typescript
  Memory: fresh (updated 2 min ago)
  Feedback entries: 3
  Proposals: 1 draft, 0 applied
```

## Available Workflows

| Workflow | Purpose |
|----------|---------|
| `repo-health` | Run validate, doctor, and scan checks |
| `memory-refresh` | Update hash-compressed memory index |
| `feedback-review` | Summarize pending feedback entries |
| `proposal-review` | Review and display proposal statuses |
| `release-check` | Pre-flight release verification |

## Safety

- `status`, `workflow list`, and `workflow plan` are read-only
- `workflow run` is restricted to safe, non-destructive CLI functions
- No proposals are applied, no shell commands are executed destructively

## Full Demo

See the [release check walkthrough](/demos/release-check) for the verification workflow.
