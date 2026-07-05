# Prompt: RACE+ Template

## When to Use

Use this template when a task needs a reusable, reviewable prompt contract that can be shared across coding agents, workflow packs, or operator-style tasks.

## Template

```markdown
# {prompt_name}

## Role
{role}

## Action
{action}

## Context
{context}

## Expectation
{expectation}

## Constraints
{constraints}

## Output Format
{output_format}

## Verification
{verification}

## Next Action
{next_action}
```

## Variables

| Variable | Description |
|:---|:---|
| `{prompt_name}` | Human-readable prompt template name. |
| `{role}` | The operating role the agent should assume. |
| `{action}` | The concrete task the agent should perform. |
| `{context}` | Files, state, constraints, and background needed for the task. |
| `{expectation}` | Definition of successful task completion. |
| `{constraints}` | Hard boundaries, safety rules, and exclusions. |
| `{output_format}` | Required response or artifact format. |
| `{verification}` | Checks the agent should run or recommend. |
| `{next_action}` | The next safest action after the output is produced. |

## Notes

RACE+ templates are declarative in v4.1 Sprint A. They do not execute tools, enforce permissions, or change runtime behavior.
