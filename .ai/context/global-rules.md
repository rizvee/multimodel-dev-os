# Global Rules

> Cross-project constraints that every agent must follow regardless of adapter.

## Execution Safety

1. **Never run `npm publish`** — publishing is a maintainer-controlled action.
2. **Never modify** `.env`, `.env.local`, signing keys, or credentials without explicit approval.
3. **Never force-push** or rewrite git history.
4. **Never edit `bin/`** — it's auto-generated. Edit `src/` instead.
5. **Never edit `package-lock.json`** manually.

## Context Discipline

1. Load `.ai/context/current-state.md` first to avoid stale assumptions.
2. Do not repeat persistent project context in every prompt.
3. Load skills on demand, not preemptively.
4. Max active files in context: 15–20.
5. Never pass `node_modules/`, `dist/`, `.next/`, or build artifacts to context.
6. Switch to `caveman` mode (abbreviated instructions) when nearing token budget.

## Code Change Protocol

1. Read the target file before editing.
2. Change only what the task requires.
3. Preserve unrelated code and comments.
4. Follow existing patterns (2-space indent, ES modules, JSDoc typing).
5. Run verification after changes: `npm test && node scripts/verify.js`

## Destructive Operations — Confirmation Required

Before running any of these, state what will happen and wait for approval:
- `DROP`, `TRUNCATE`, `DELETE` without `WHERE`
- `rm -rf`, `del /s`, `Remove-Item -Recurse` on non-temp paths
- Overwriting files outside the current project
- Publishing, deploying, or releasing artifacts
- `git push --force` or history rewrite

## Session Lifecycle

### On Start
1. Read bootstrap files: `AGENTS.md`, `MEMORY.md`, `TASKS.md`
2. Load `.ai/context/current-state.md`
3. Check `TASKS.md` for assigned or in-progress work

### On Complete
1. Run validators
2. Update `TASKS.md` with completion status
3. Update `MEMORY.md` if architecture decision was made
4. Update `.ai/context/current-state.md` with new state
5. Write session log to `.ai/session-logs/`

### On Handoff
1. Write session log with: agent_name, timestamp, action_summary, files_changed, next_steps
2. Update `TASKS.md` with remaining work
3. Do not assume the next agent reads your adapter file
