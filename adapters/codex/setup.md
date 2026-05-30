# Codex Setup Guide

## Overview

OpenAI Codex reads `AGENTS.md` from the repo root automatically. No special configuration is needed.

## Setup Steps

1. **Ensure `AGENTS.md` exists** at your project root with build commands filled in
2. **Ensure `RUNBOOK.md`** contains environment setup commands (Codex runs in a sandbox)
3. **No adapter copy needed** — Codex reads root `AGENTS.md` directly

## Tips

- Codex works best with explicit, non-interactive build commands
- Include dependency install commands in `RUNBOOK.md` → Environment Setup
- Test your build commands in a clean environment before using with Codex

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Codex ignores AGENTS.md | Ensure file is in repo root, not a subdirectory |
| Build fails in sandbox | Add all setup steps to RUNBOOK.md Environment Setup |
| Missing dependencies | List everything in your package manifest |
