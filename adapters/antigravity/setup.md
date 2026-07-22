# Antigravity Setup Guide

## Overview

Google Antigravity automatically reads `AGENTS.md` from the repo root. The `.gemini/settings.json` file provides optional IDE-level overrides.

## Setup Steps

1. **Ensure `AGENTS.md` exists** at your project root
2. **Copy the `.gemini/` directory** to your project root:
   ```bash
   cp -r adapters/antigravity/.gemini/ .gemini/
   ```
3. **Edit `.gemini/settings.json`** if you need IDE-level overrides

## Mapping to Antigravity Features

| multimodel-dev-os | Antigravity Feature |
|-------------------|-------------------|
| `AGENTS.md` | Automatically read as agent instructions |
| `MEMORY.md` | Use as Knowledge Item source |
| `.ai/skills/` | Map to Antigravity skills |
| `.ai/config.yaml` | Reference in settings.json |

## Tips

- Antigravity supports planning mode — align with `TASKS.md` for task tracking
- Use `MEMORY.md` to persist context across Antigravity sessions
- Antigravity reads the full repo tree — keep `.gitignore` clean

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Settings not applied | Ensure `.gemini/` is at project root |
| Context missing | Add files to `contextFiles` in settings.json |
