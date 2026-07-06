# Guardrail Check: Pre-External-Write Safety

## Objective
Require confirmation and worktree cleanliness before exposing updates to external environments (e.g. npm publish, push to main).

## Rules
- Must require explicit user confirmation.
- Worktree must be clean of any untracked or uncommitted files.
