# Quickstart Guide

Get MultiModel Dev OS integrated into your codebase in **under 30 seconds** to synchronize your multi-agent developer workflows.

> **Use when**: Setting up a new repository or aligning multiple AI tools (Cursor, Claude Code, Gemini, Codex, Antigravity, VS Code) to prevent instruction drift and prompt token bloat.

---

## Option A: NPX Scaffolding (Recommended)

Initialize any project instantly using the public npm registry:

```bash
# Standard initialization in the current directory
npx multimodel-dev-os@latest init

# Pick a stack template and inject specific adapters
npx multimodel-dev-os@latest init --template nextjs-saas --adapter cursor --adapter claude

# Run a dry-run preview before writing any files
npx multimodel-dev-os@latest init --dry-run
```

**Available templates:** `nextjs-saas` · `wordpress-site` · `ecommerce-store` · `seo-landing-page` · `expo-react-native-android` · `general-app`

---

## Option B: Fallback One-Line Scripts

If you prefer installation scripts:

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

Cut prompt token overhead by **~79%** with compressed shorthand declarations. Best for tight API budgets or smaller models:

```bash
npx multimodel-dev-os@latest init --caveman
```

---

## Option D: Target a Specific Directory

Initialize a target project path directly:

```bash
npx multimodel-dev-os@latest init --target /path/to/your-project --template nextjs-saas --adapter cursor
```

---

## Option E: Onboard an Existing Repository

Already have a project with code in it? Use the onboarding system to safely analyze your repo and bootstrap configs without breaking anything:

```bash
# Step 1: Analyze your project structure
npx multimodel-dev-os@latest onboard analyze

# Step 2: Get template and adapter recommendations
npx multimodel-dev-os@latest onboard recommend

# Step 3: Generate an onboarding plan
npx multimodel-dev-os@latest onboard plan

# Step 4: Apply the plan (creates backups automatically)
npx multimodel-dev-os@latest onboard apply --approved

# Step 5: Check onboarding status
npx multimodel-dev-os@latest onboard status
```

---

## Option F: Launch the Interactive Dashboard

Launch the TUI command center to manage onboarding, adapter sync, memory building, feedback collection, proposals, and quality checks in an interactive menu:

```bash
npx multimodel-dev-os@latest dashboard
```

---

## After Install

1. **Edit `AGENTS.md`** — fill in your project name, stack, and build commands.
2. **Edit `.ai/config.yaml`** — enable adapters for your tools.
3. **Sync adapter rule files** to your project root automatically:
   ```bash
   npx multimodel-dev-os@latest adapter sync all --approved
   ```
   Or copy manually if you prefer:
   - Cursor: `cp adapters/cursor/.cursorrules .cursorrules`
   - Claude: `cp adapters/claude/CLAUDE.md CLAUDE.md`
   - VS Code: `cp -r adapters/vscode/.vscode/ .vscode/`
4. **Build your codebase memory index:**
   ```bash
   npx multimodel-dev-os@latest memory build
   ```
5. **Start coding** — your AI coding agents will read the shared configuration instantly.

---

## Try the Demo Workflows

To see MultiModel Dev OS in action in under 2 minutes, try one of our guided, copy-paste demo workflows:
- 🚀 **[Safe Repo Onboarding](/demos/existing-repo-onboarding)** — Safely onboard an existing project without breaking changes.
- 🔄 **[Universal Adapter Sync](/demos/adapter-sync)** — Write rules once in `AGENTS.md` and sync Cursor, Claude, and Gemini.
- 🤝 **[Multi-Agent Handoff](/demos/multi-agent-handoff)** — Smoothly hand off session context between terminal and editor agents.
- 🔁 **[Safe Improvement Loop](/demos/safe-improvement-loop)** — Capture user feedback and run safe, audited codebase upgrades.
- 🩺 **[Release Verification](/demos/release-check)** — Run the final pre-flight checks before releasing a package.

Or browse them all on the [Demos Hub](/demos/).

---

## Verify & Diagnose

```bash
# Strict directory schema validation
npx multimodel-dev-os@latest validate

# Advisory workspace compatibility audit
npx multimodel-dev-os@latest doctor

# Codebase structure scanner
npx multimodel-dev-os@latest scan

# Compact status dashboard
npx multimodel-dev-os@latest status
```

Explore the full **[CLI Command Reference](/CLI)**, **[Stable Protocol Specification](/stable-protocol)**, or **[Upgrade & Migration Guide](/migration-guide)** for details.
