# Quickstart

Get multimodel-dev-os into your project in under 2 minutes.

## Option A: NPX Scaffolding (Recommended)

Initialize any project immediately without local clones using our public npm registry:

```bash
# Standard interactive initialization in current directory
npx multimodel-dev-os@latest init

# Target specific stack templates and specific tool adapters
npx multimodel-dev-os@latest init --template nextjs-saas --adapter cursor --adapter claude

# Run a dry-run preview before executing file writes
npx multimodel-dev-os@latest init --dry-run
```

## Option B: Fallback One-Line Scripts

If you choose to run installation scripts directly:

**macOS / Linux / WSL (bash):**
```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1 | iex
```

## Option C: Caveman Mode (Minimal Tokens)

Reduce token footprint by **~79%** with our lightweight variants:

```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash -s -- --caveman
```

## Option D: Node.js Local Scaffolding CLI

For offline execution or customized packaging within a cloned workspace:
1. Clone this repository locally:
   ```bash
   git clone https://github.com/rizvee/multimodel-dev-os.git
   ```
2. Run the CLI directly using the absolute target path:
   ```bash
   node bin/multimodel-dev-os.js init --target /path/to/your-project --template nextjs-saas --adapter cursor
   ```

## Option E: Manual Scaffolding

If you prefer absolute manual control over copying files:

```bash
git clone https://github.com/rizvee/multimodel-dev-os.git /tmp/mmdos
cp /tmp/mmdos/AGENTS.md    your-project/
cp /tmp/mmdos/MEMORY.md    your-project/
cp /tmp/mmdos/TASKS.md     your-project/
cp /tmp/mmdos/RUNBOOK.md   your-project/
cp /tmp/mmdos/.gitattributes your-project/
cp -r /tmp/mmdos/.ai       your-project/
```

## After Install

1. **Edit `AGENTS.md`** — fill in your project name, stack, and build commands
2. **Edit `.ai/config.yaml`** — enable adapters for your tools
3. **Copy adapter files** to your project root:
   - Cursor: `cp adapters/cursor/.cursorrules .cursorrules`
   - Claude: `cp adapters/claude/CLAUDE.md CLAUDE.md`
   - VS Code: `cp -r adapters/vscode/.vscode/ .vscode/`
4. **Start coding** — your AI tools will read the shared config

## Verify & Diagnose

You can run our strict validation check or advisory doctor checkup to validate structural health:
```bash
# Strict directory schema validation
node bin/multimodel-dev-os.js validate --target /path/to/your-project

# Advisory doctor workspace compatibility audit
node bin/multimodel-dev-os.js doctor --target /path/to/your-project

# Legacy verification script
node bin/multimodel-dev-os.js verify --target /path/to/your-project
```

## Next Steps

- [Architecture overview](architecture.md)
- [Adapter setup](adapters.md)
- [Multi-agent workflows](multimodel-workflow.md)
- [Caveman Mode](caveman-mode.md)
- [NPM Publishing Runbook](npm-publishing.md)
