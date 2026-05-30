# Gemini Setup Guide

## Overview

Google Gemini (via AI Studio or API) can be directed to read `AGENTS.md` or a custom `GEMINI.md` instruction file.

## Setup Steps

1. **Copy `GEMINI.md` to your project root:**
   ```bash
   cp adapters/gemini/GEMINI.md GEMINI.md
   ```
2. **Ensure `AGENTS.md` exists** at your project root
3. **When starting a Gemini session**, reference `GEMINI.md` or `AGENTS.md` as system context

## How It Works

Unlike Cursor or Claude, Gemini does not auto-detect instruction files. You need to:
- Include `GEMINI.md` or `AGENTS.md` content in your system prompt
- Or reference these files when using Gemini in an IDE that supports file context

## Tips

- Keep `GEMINI.md` concise — Gemini has generous context but benefits from focused instructions
- Use Caveman Mode for API-heavy workflows where tokens cost money
- Gemini works well with structured YAML — reference `.ai/config.yaml` for project settings

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Gemini doesn't follow rules | Include GEMINI.md content in system prompt |
| Token costs too high | Switch to Caveman Mode templates |
| Context not persisting | Use MEMORY.md and include it each session |
