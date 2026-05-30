# Cursor Setup Guide

## Overview

Cursor reads `.cursorrules` from the project root to configure agent behavior. The adapter provides a template that references the root `AGENTS.md`.

## Setup Steps

1. **Copy `.cursorrules` to your project root:**
   ```bash
   cp adapters/cursor/.cursorrules .cursorrules
   ```
2. **Edit `.cursorrules`** — replace `null` values with your project's actual commands and conventions
3. **Ensure `AGENTS.md` exists** at your project root (Cursor can reference it)

## How It Works

Cursor loads `.cursorrules` at session start. The adapter file:
- Contains project rules in Cursor's native comment format
- References root `AGENTS.md` for full details
- Includes boundary rules (files not to modify)

## Tips

- Keep `.cursorrules` under 100 lines — Cursor has a context budget
- For Caveman Mode, use an even shorter `.cursorrules` with just build commands
- Cursor also supports `@` references to files — point it at `MEMORY.md` for context

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Rules not loading | Ensure `.cursorrules` is at project root (not in adapters/) |
| Context too long | Trim `.cursorrules` or switch to Caveman Mode |
| Cursor ignores boundaries | Reinforce no-touch rules at the top of the file |
