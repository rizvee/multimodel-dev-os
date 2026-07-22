# CLAUDE.md

> Execution adapter for Claude Code. Source of truth: `/AGENTS.md`.
> Do not embed the full skill library here. Reference it.

## Bootstrap — Read First

1. `/AGENTS.md` — build commands, conventions, boundaries
2. `/MEMORY.md` — architecture decisions, session history
3. `/TASKS.md` — current work queue
4. `.ai/context/current-state.md` — live project state (if exists)
5. `.ai/context/global-rules.md` — cross-project constraints (if exists)

Read these files at session start. Do not proceed until you understand the
project's build system, naming conventions, and no-touch boundaries.

## Skill Library

Skills live at `~/.agents/skills/<name>/SKILL.md` (canonical) and
`.ai/skills/` (project-local). **Do not paste skill content into this file.**

To invoke a skill, use the matching slash command:

```
/skill <name>        — load and execute a canonical skill
/review              — shortcut for code-review skill
/debug               — shortcut for systematic-debugging skill
/verify              — shortcut for verification-before-completion skill
```

Load only the skill relevant to the current phase. If no skill matches,
work from first principles using the project conventions above.

## Execution Rules

### Planning
- For multi-file changes, create a plan first. List files and diffs.
- Get user approval before executing the plan.
- Prefer edits reviewable as diffs (search-replace, not full rewrites).

### Code Changes
- Read the target file before editing.
- Change only what the task requires. Preserve unrelated code and comments.
- Follow existing patterns in the repo (indentation, naming, module style).
- Run the project's verification commands after changes:
  ```
  npm test
  node scripts/verify.js
  ```

### Destructive Operations — Confirmation Required
Before running any of these, state what will happen and wait for approval:
- `DROP`, `TRUNCATE`, `DELETE` without `WHERE` (SQL)
- `rm -rf`, `del /s`, `Remove-Item -Recurse` on non-temp paths
- Overwriting files outside the current project
- Publishing, deploying, or releasing artifacts
- Modifying `.env`, secrets, keys, or credentials
- Any `git push --force` or history rewrite

### Subagents
- Use subagents for isolated research, testing, or review tasks.
- Each subagent gets its own context; pass only the files it needs.
- Subagent results feed back into the main session as evidence.

### MCP
- MCP servers are configured in `.claude/settings.json` or globally.
- Use MCP for external system access (databases, APIs, monitoring).
- Do not configure new MCP connections without user approval.

## Session Lifecycle

### On Start
1. Read bootstrap files (above).
2. Check `/TASKS.md` for assigned or in-progress work.
3. Load relevant skill for the current task phase.

### On Complete
1. Run validators: `npm test && node scripts/verify.js`
2. Update `/TASKS.md` with completion status.
3. Update `/MEMORY.md` if an architecture decision was made.
4. Write a session log to `.ai/session-logs/` for cross-agent handoff.

### On Handoff
When handing off to another agent (Antigravity, Cursor, Codex):
1. Write session log with: agent_name, timestamp, action_summary,
   files_changed, next_steps.
2. Update `/TASKS.md` with remaining work.
3. Do not assume the next agent reads `CLAUDE.md`.

## Context Budget

- Target: under 1,000 tokens for instructions loaded per turn.
- Max active files in context: 15–20.
- Never pass `node_modules/`, `dist/`, `.next/`, or build artifacts.
- For large codebases, use `.ai/config.yaml` mode: `"caveman"`.
