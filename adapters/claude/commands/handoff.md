---
description: Write session handoff log for cross-agent continuity
allowed-tools: ["read_file", "write_file"]
---

# /handoff — Session Handoff

Write a session log to `.ai/session-logs/` for the next agent.

## Required Fields

```markdown
# Session Log — Claude Code

- **Agent:** Claude Code
- **Timestamp:** <current datetime>
- **Session ID:** <session identifier>

## Action Summary
<what was accomplished>

## Files Changed
<list of modified files with one-line descriptions>

## Decisions Made
<architecture or design decisions, with rationale>

## Remaining Work
<what the next agent should pick up>

## Next Steps
<specific first action for the next session>
```

## Rules

- Also update `/TASKS.md` with completion status
- Update `/MEMORY.md` if decisions were made
- Do not assume the next agent reads `CLAUDE.md`
