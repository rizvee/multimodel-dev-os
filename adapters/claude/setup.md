# Claude Code Adapter — Setup Guide

## What This Adapter Provides

| Component | File | Purpose |
|-----------|------|---------|
| Project instructions | `CLAUDE.md` | Thin adapter that reads `/AGENTS.md` + canonical skills |
| Hooks | `settings.json` | Auto-verify after writes, session logging |
| `/skill <name>` | `commands/skill.md` | Load any canonical skill on demand |
| `/review` | `commands/review.md` | Code review shortcut |
| `/debug` | `commands/debug.md` | Systematic debugging shortcut |
| `/verify` | `commands/verify.md` | Pre-completion verification shortcut |
| `/plan` | `commands/plan.md` | Multi-file diff-based planning |
| `/handoff` | `commands/handoff.md` | Cross-agent session handoff |

## Prerequisites

1. **Claude Code** installed and authenticated
2. **Canonical skill library** at `~/.agents/skills/` (128 skills)
3. **Project** with `/AGENTS.md` at the root

## Installation

### Step 1 — Copy CLAUDE.md to project root

```bash
cp adapters/claude/CLAUDE.md ./CLAUDE.md
```

### Step 2 — Copy hooks to .claude/

```bash
mkdir -p .claude
cp adapters/claude/settings.json .claude/settings.json
```

### Step 3 — Copy slash commands to .claude/commands/

```bash
mkdir -p .claude/commands
cp adapters/claude/commands/*.md .claude/commands/
```

### Step 4 — Verify

```bash
# Check CLAUDE.md is detected
claude --print-system-prompt 2>/dev/null | head -20

# Check commands are available
ls .claude/commands/

# Check hooks
cat .claude/settings.json
```

## How It Works

### Context Flow

```
Session Start
    │
    ├─▶ Claude reads CLAUDE.md
    │       │
    │       ├─▶ Reads /AGENTS.md (conventions, build, boundaries)
    │       ├─▶ Reads /MEMORY.md (decisions)
    │       ├─▶ Reads /TASKS.md (work queue)
    │       └─▶ Reads .ai/context/* (if present)
    │
    ├─▶ User invokes /skill <name> or /review, /debug, etc.
    │       │
    │       └─▶ Claude reads ~/.agents/skills/<name>/SKILL.md
    │           (loads on demand, not embedded in CLAUDE.md)
    │
    ├─▶ Claude makes edits
    │       │
    │       └─▶ [Hook] PostToolUse → runs verify.js
    │
    └─▶ Session ends
            │
            ├─▶ /verify → evidence-based completion check
            ├─▶ /handoff → writes session log
            └─▶ [Hook] SessionStart log entry
```

### Key Design Decisions

1. **Thin CLAUDE.md** — No skill content embedded. Skills are loaded by
   reference via slash commands. This keeps the context budget under 1,000
   tokens for instructions.

2. **Canonical skill library** — `~/.agents/skills/` is the single source of
   truth. The same library serves Claude Code, Antigravity, Cursor, and Codex.

3. **Hooks for quality gates** — `PostToolUse` runs `verify.js` after every
   file write. No need to remember to run validators.

4. **Confirmation-gated destructive ops** — CLAUDE.md explicitly lists
   destructive operations that require user approval before execution.

5. **Cross-agent handoff** — `/handoff` writes structured session logs that
   any agent can pick up, regardless of which tool reads them.

## Customization

### Adding Project-Specific Commands

Create `.claude/commands/<name>.md`:

```markdown
---
description: What this command does
allowed-tools: ["read_file", "run_command"]
---

# /<name>

Instructions for the command.
```

### Adding Project-Specific Skills

Create `.ai/skills/<name>.md` in your project. The `/skill` command falls back
to this directory if the canonical library doesn't have a match.

### MCP Integration

Add MCP servers to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "@my-org/mcp-server"]
    }
  }
}
```

### Subagent Configuration

Subagents are spawned during `/skill` or `/debug` execution when isolated
context is needed. No pre-configuration required — Claude handles subagent
lifecycle automatically.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Claude doesn't see CLAUDE.md | Ensure it's at the repo root, not in `adapters/` |
| Slash commands missing | Copy `commands/*.md` to `.claude/commands/` |
| Hooks not firing | Copy `settings.json` to `.claude/settings.json` |
| Skill not found | Check `~/.agents/skills/` exists with SKILL.md files |
| Context too large | Set `mode: "caveman"` in `.ai/config.yaml` |
| verify.js fails | Run `npm install` then `node scripts/verify.js` manually |

## File Map

```
adapters/claude/
├── CLAUDE.md              # → copy to project root
├── settings.json          # → copy to .claude/settings.json
├── commands/
│   ├── skill.md           # → copy to .claude/commands/
│   ├── review.md
│   ├── debug.md
│   ├── verify.md
│   ├── plan.md
│   └── handoff.md
└── setup.md               # this file
```
