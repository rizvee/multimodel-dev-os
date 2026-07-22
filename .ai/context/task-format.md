# Task Format

> Standard format for task prompts across all agents.

## Compact Task Prompt

```md
Task: [specific task description]

Read first:
- .ai/context/current-state.md
- .ai/context/global-rules.md
- [relevant .ai/skills/*]
- [relevant .ai/checks/*]

Rules:
- Keep changes minimal and safe.
- Follow existing architecture.
- Update docs/state if behavior changes.
- Run verification.

Report:
- Files changed
- Commands run
- Validation result
- Blockers
- Next action

Acceptance Criteria:
- [clear measurable criteria]
```

## Report Format

After each verified work unit:

```md
## Summary
What changed.

## Files Changed
| File | Action | Purpose |
|------|--------|---------|

## Commands Run
| Command | Result |
|---------|--------|

## Validation
- Tests: pass/fail
- Verify: pass/fail

## Blockers
- None / [description]

## Next Action
Specific next step.
```

## Session Log Format

For `.ai/session-logs/`:

```md
# Session Log

- **Agent:** [agent name]
- **Timestamp:** [ISO 8601]
- **Task:** [task description]

## Action Summary
What was accomplished.

## Files Changed
- [file list]

## Decisions Made
- [any architecture or design decisions]

## Next Steps
- [remaining work for next agent]
```
