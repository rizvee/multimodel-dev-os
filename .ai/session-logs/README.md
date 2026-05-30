# Session Logs

> Agent session logs for tracking work across multi-agent workflows.

## Purpose

When an AI agent completes a session, it can log:
- What was done
- What files changed
- What to do next
- Any blockers or decisions made

## Format

```markdown
# Session: {agent_name}
**Timestamp:** {ISO 8601}
**Tool:** {tool_name}
**Role:** {role from .ai/agents/orchestrator.md}

## Summary
{What was done in 2-3 sentences}

## Files Changed
- {path} ({created|modified|deleted})

## Next Steps
1. {Concrete next action}

## Blockers
- {Any blockers, or "None"}
```

## Naming Convention

```
{YYYY-MM-DD}-{agent}-{summary}.md
```

Example: `2026-05-30-claude-auth-design.md`

## Git Policy

Session logs are **gitignored by default** (session-specific data).
To commit them, remove the session-logs ignore rule from `.gitignore`.

## Retention

Keep the last 10 session logs. Archive or delete older ones.
