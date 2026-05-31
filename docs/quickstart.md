# Quickstart Guide: AI Dev OS Deployment

Get the MultiModel Dev OS integrated into your codebase in under 2 minutes to synchronize your multi-agent developer workflows.

> **Use when**: Setting up a new repository or aligning multiple AI tools (like Cursor, Claude Code, Gemini, Codex, and Antigravity) to prevent instruction drift and prompt token bloat.

---

## Option A: NPX Scaffolding (Recommended)

Initialize any project immediately without local clones using our public npm registry:

```bash
# Standard interactive initialization in the current directory
npx multimodel-dev-os@latest init

# Target specific stack templates and specific tool adapters
npx multimodel-dev-os@latest init --template nextjs-saas --adapter cursor --adapter claude

# Run a dry-run preview before executing file writes
npx multimodel-dev-os@latest init --dry-run
```

---

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

---

## Option C: Caveman Mode (Minimal Tokens)

**Best for**: Context optimization for AI coding when using tight API budgets or smaller models. Reduces rules footprint by **~79%**.

```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash -s -- --caveman
```

---

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

---

## After Install

1. **Edit `AGENTS.md`** — fill in your project name, stack, and build commands (portable AI project context).
2. **Edit `.ai/config.yaml`** — enable adapters for your tools.
3. **Copy adapter files** to your project root (e.g., Cursor project rules, Claude Code project instructions):
   - Cursor: `cp adapters/cursor/.cursorrules .cursorrules`
   - Claude: `cp adapters/claude/CLAUDE.md CLAUDE.md`
   - VS Code: `cp -r adapters/vscode/.vscode/ .vscode/`
4. **Start coding** — your AI coding agents will read the shared configuration instantly.

---

## Verify & Diagnose

You can run our strict validation check or advisory doctor checkup to validate structural health:

```bash
# Strict directory schema validation
node bin/multimodel-dev-os.js validate

# Advisory doctor workspace compatibility audit
node bin/multimodel-dev-os.js doctor

# Verify repository structure checks
npm run verify
```

Explore our canonical [Stable Protocol Specification](/stable-protocol) or [Upgrade & Migration Guide](/migration-guide) for details.
