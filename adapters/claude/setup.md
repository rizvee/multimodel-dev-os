# Claude Code Setup Guide

## Overview

Claude Code reads `CLAUDE.md` from the repo root automatically. This adapter provides a template that references the root `AGENTS.md`.

## Setup Steps

1. **Copy `CLAUDE.md` to your project root:**
   ```bash
   cp adapters/claude/CLAUDE.md CLAUDE.md
   ```
2. **Ensure `AGENTS.md` exists** at your project root with build commands filled in
3. **No further configuration needed** — Claude auto-detects `CLAUDE.md`

## How It Works

Claude Code loads `CLAUDE.md` at session start. The adapter file:
- Points Claude to read `/AGENTS.md` for full instructions
- Includes Claude-specific behavior notes (session logging, memory updates)
- Keeps Claude aligned with the multimodel-dev-os workflow

## Tips

- Claude supports nested `CLAUDE.md` in subdirectories for monorepo setups
- Use `MEMORY.md` to persist context across Claude sessions
- Claude can read any markdown file — point it at `TASKS.md` for task context

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Claude ignores CLAUDE.md | Ensure file is at project root |
| Context too large | Switch to Caveman Mode templates |
| Claude doesn't follow AGENTS.md | Add explicit "Read /AGENTS.md first" to CLAUDE.md |
