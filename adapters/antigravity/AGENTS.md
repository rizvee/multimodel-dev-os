<!-- Antigravity Execution Adapter for multimodel-dev-os -->
<!-- Source of truth: /AGENTS.md — do not duplicate full project context here -->

# Antigravity Agent Instructions

This project uses [multimodel-dev-os](https://github.com/rizvee/multimodel-dev-os).

## Bootstrap — Dynamic Context Loading

Load in this order, stop early if the task is clear:

1. `.ai/context/current-state.md` — live project snapshot
2. `.ai/context/global-rules.md` — cross-agent safety rules
3. `.ai/context/task-format.md` — standard report format
4. The smallest relevant `.ai/skills/*` for the current phase
5. The relevant `.ai/checks/*` as guardrails

**Do not repeat persistent project context in every prompt.** Read state from
files. Update state after verified work.

## Skill Library

Skills live at two locations:

| Source | Path | Count |
|--------|------|-------|
| Canonical (global) | `~/.agents/skills/<name>/SKILL.md` | 128 |
| Project-local | `.ai/skills/` | 22 |

Load only the skill relevant to the current phase. Do not preload all skills.

## Antigravity-Specific Integration

| Feature | multimodel-dev-os File | Antigravity Equivalent |
|---------|----------------------|----------------------|
| Agent instructions | `AGENTS.md` | Auto-detected at repo root |
| Project memory | `MEMORY.md` | Knowledge Items (KI) |
| Task tracking | `TASKS.md` | Task artifacts (`task.md`) |
| Skills | `.ai/skills/` | Skills directory + `~/.agents/skills/` |
| Context files | `.ai/context/` | Read via `view_file` tool |
| Session logs | `.ai/session-logs/` | Conversation transcripts |
| Checks | `.ai/checks/` | Pre/post execution guardrails |

## Execution Rules

### Planning
- For multi-file changes, create `implementation_plan.md` first.
- Get user approval before executing.
- Prefer targeted edits over full rewrites.

### Code Changes
- Read the target file before editing.
- Change only what the task requires. Preserve unrelated code and comments.
- Follow existing patterns (2-space indent, ES modules, JSDoc typing).
- Run verification after changes.

### Verification — Auto-Execute

Run these automatically after code changes (safe, read-only):

```
npm test
node scripts/verify.js
```

### Destructive Operations — Confirmation Required

Before running any of these, state what will happen and wait for approval:
- `DROP`, `TRUNCATE`, `DELETE` without `WHERE`
- `rm -rf`, `del /s`, `Remove-Item -Recurse` on non-temp paths
- Overwriting files outside the current project
- Publishing, deploying, or releasing (`npm publish` is **NEVER** allowed)
- `git push --force` or history rewrite
- Modifying `.env`, secrets, keys, or credentials

### Browser & UI Debugging
- Use Chrome DevTools MCP when available for DOM inspection, network debugging,
  and UI validation.
- Use `browser_subagent` for visual verification of web UIs.

### Google Cloud Work
- Use gcloud MCP when available for GCP resource management.
- Never create or destroy production resources without approval.

## Session Lifecycle

### On Start
1. Read `.ai/context/current-state.md`
2. Check `TASKS.md` for assigned or in-progress work
3. Load relevant skill for the current task phase

### On Complete
1. Run validators: `npm test && node scripts/verify.js`
2. Update `TASKS.md` with completion status
3. Update `MEMORY.md` if an architecture decision was made
4. Update `.ai/context/current-state.md` with new state

### On Handoff (to Claude, Cursor, Codex)
1. Write session log to `.ai/session-logs/` with:
   agent_name, timestamp, action_summary, files_changed, next_steps
2. Update `TASKS.md` with remaining work
3. Do not assume the next agent reads Antigravity's adapter file

## Report Format

After each verified work unit:

```md
## Files Changed
| File | Action |

## Commands Run
| Command | Result |

## Validation
pass/fail

## Blockers
None / [description]

## Next Action
[specific next step]
```

## Context Budget

- Target: under 1,000 tokens for instructions loaded per turn
- Max active files in context: 15–20
- Never pass `node_modules/`, `dist/`, `.next/`, or build artifacts
- For large codebases, switch `.ai/config.yaml` mode to `"caveman"`

## References

- [Root AGENTS.md](/AGENTS.md)
- [MEMORY.md](/MEMORY.md)
- [TASKS.md](/TASKS.md)
- [RUNBOOK.md](/RUNBOOK.md)
- [Context State](/.ai/context/current-state.md)
- [Global Rules](/.ai/context/global-rules.md)
