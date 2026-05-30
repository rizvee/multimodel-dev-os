# VS Code Setup Guide

## Overview

VS Code uses `.vscode/settings.json` for workspace settings. This adapter provides settings aligned with multimodel-dev-os conventions.

## Setup Steps

1. **Copy `.vscode/` to your project root:**
   ```bash
   cp -r adapters/vscode/.vscode/ .vscode/
   ```
2. **Edit `.vscode/settings.json`** — set your preferred formatter and tab size
3. **Install recommended extensions** (optional):
   - EditorConfig for VS Code
   - Markdown All in One
   - YAML

## What's Included

The settings file configures:
- Format on save
- Tab size matching `.editorconfig`
- Trailing whitespace trimming
- File exclusions for `node_modules`, build output
- Search exclusions for session logs

## Tips

- VS Code's Copilot extension also reads `AGENTS.md` — no additional setup needed
- Use the integrated terminal to run commands from `RUNBOOK.md`
- Pin `TASKS.md` as a tab for quick reference

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Settings not applied | Ensure `.vscode/` is at project root |
| Formatter conflicts | Set `editor.defaultFormatter` to your preferred formatter |
| Files not excluded | Check `files.exclude` patterns in settings.json |
