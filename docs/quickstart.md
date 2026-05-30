# Quickstart

Get multimodel-dev-os into your project in under 2 minutes.

## Option A: One-Line Install

**macOS / Linux / WSL:**
```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1 | iex
```

## Option B: Manual Copy

```bash
git clone https://github.com/rizvee/multimodel-dev-os.git /tmp/mmdos
cp /tmp/mmdos/AGENTS.md    your-project/
cp /tmp/mmdos/MEMORY.md    your-project/
cp /tmp/mmdos/TASKS.md     your-project/
cp /tmp/mmdos/RUNBOOK.md   your-project/
cp -r /tmp/mmdos/.ai       your-project/
```

## Option C: Caveman Mode (Minimal Tokens)

```bash
curl -fsSL .../scripts/install.sh | bash -s -- --caveman
```

## After Install

1. **Edit `AGENTS.md`** — fill in your project name, stack, and build commands
2. **Edit `.ai/config.yaml`** — enable adapters for your tools
3. **Copy adapter files** to your project root:
   - Cursor: `cp adapters/cursor/.cursorrules .cursorrules`
   - Claude: `cp adapters/claude/CLAUDE.md CLAUDE.md`
   - VS Code: `cp -r adapters/vscode/.vscode/ .vscode/`
4. **Start coding** — your AI tools will read the shared config

## Verify

```bash
bash scripts/verify.sh
```

## Next Steps

- [Architecture overview](architecture.md)
- [Adapter setup](adapters.md)
- [Multi-agent workflows](multimodel-workflow.md)
- [Caveman Mode](caveman-mode.md)
