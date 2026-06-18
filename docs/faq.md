# FAQ

Frequently asked questions about MultiModel Dev OS, AI coding agents compatibility, and prompt context optimization.

---

## General

**What is MultiModel Dev OS?**
A set of markdown templates and directory structures that allow multiple AI coding tools (Codex, Cursor, Claude Code, Gemini, Antigravity, VS Code) to share a single portable AI project context. Think of it as `.editorconfig` but for AI assistants.

**Is this a runtime operating system?**
No. It is a workspace configuration standard — standard files (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) and a `.ai/` directory that coordinate multiple tools. There is no background process, no daemon, and no runtime overhead.

**What does "multimodel" mean?**
Multiple distinct AI coding models/agents (like Codex, Cursor, Claude Code, and Gemini) operating on the **same workspace** without context loss or instruction drift.

**How is this different from just writing my own `.cursorrules` or `CLAUDE.md`?**
Those are tool-specific instruction files. If you use multiple tools, you end up maintaining duplicated rules that quickly drift out of sync. MultiModel Dev OS gives you a **single source of truth** (`AGENTS.md`) and automatically adapts it for each tool. You write rules once, every tool reads them.

---

## Demo Workflows

**How do I run the demo workflows?**
Our demos are fully self-contained markdown walkthroughs. You can copy the commands directly from the demo pages, run them in your terminal, and observe the output. See the **[Demos Hub](/demos/)** for all available workflows.

**Do the demos make any changes to my system?**
The demos are designed to run in a safe, isolated, or dry-run configuration. For example, `onboard analyze` is entirely read-only, and onboarding plans and adapter syncs require developer approval before writing files. We also provide clear **Cleanup** sections on every demo page to undo any files created.

---

## Setup & Installation

**Do I need Node.js?**
It depends on your installation path:
* **Yes:** If you use the primary `npx multimodel-dev-os@latest init` workflow (recommended).
* **No:** If you run the fallback bash (`install.sh`) or PowerShell (`install.ps1`) one-liners.

**Can I use this with an existing project?**
Yes! The `onboard` command suite is designed specifically for this. It analyzes your project structure, recommends the best template, generates a plan, and applies configs safely with automatic backups:
```bash
npx multimodel-dev-os@latest onboard analyze
npx multimodel-dev-os@latest onboard apply --approved
```

**Does this overwrite my existing files?**
Never by default. The CLI audits for conflicts before writing anything. To overwrite existing files, you must explicitly pass `--force`, and the system automatically creates `.bak` backups.

---

## Adapters & Tools

**Do I copy adapter files to my project root?**
You can do it automatically with the `adapter sync` command:
```bash
npx multimodel-dev-os@latest adapter sync all --approved
```
Or manually:
- Cursor → `cp adapters/cursor/.cursorrules .cursorrules`
- Claude Code → `cp adapters/claude/CLAUDE.md CLAUDE.md`
- VS Code → `cp -r adapters/vscode/.vscode/ .vscode/`

**Does this work with MCP tools?**
Yes. MultiModel Dev OS includes a `.ai/registries/tools.yaml` that defines MCP tool integrations (like gcloud, Chrome DevTools). The tool registry maps capabilities dynamically rather than hardcoding tool names.

**What AI models does this support?**
All of them. The `.ai/models/` directory contains a model registry with capability scores, routing presets, and provider configurations. It supports cloud models (GPT-4, Claude, Gemini), local models (Llama, Ollama), and everything in between. No model is hardcoded — the registry routes tasks based on capability scores.

---

## Caveman Mode

**When should I use Caveman Mode?**
Use Caveman Mode when you want to minimize prompt token overhead — ideal for tight API budgets, smaller context windows, or when you want to save money on API calls. It compresses the workspace rules by **~79%** using shorthand declarations.

---

## Intelligence & Safety

**Is this safe? Can it modify my code?**
MultiModel Dev OS is primarily a **read-only** workspace configuration layer. The only write operations are:
- `init` / `onboard apply` — creates configuration files (with conflict detection)
- `memory build` — creates memory index files under `.ai/intelligence/` (gitignored)
- `improve apply` — applies approved proposals (requires explicit `--approved` flag and passes 12 safety gates)

No command can execute arbitrary shell commands, and destructive operations always require explicit developer approval.

**What are the safety gates?**
The improvement proposal system enforces 12 strict safety checks including path boundary containment, protected path blocks (`.git/`, `.env`, `node_modules/`), idempotency verification, and mandatory human approval. Every apply action is logged in an append-only audit trail.

---

## TUI & Plugins

**What is the Interactive TUI Dashboard?**
It is a terminal-based operational menu (`npx multimodel-dev-os dashboard` or `ui`) that allows developers to run diagnostics, sync rules, build memory indexes, and check proposal status in a guided interface. It uses Node.js's native `readline` module for raw-keypress navigation, keeping execution zero-dependency and fast.

**Will the TUI Dashboard hang in CI/CD pipelines?**
No. The dashboard detects when stdin or stdout is non-interactive. In non-TTY environments, or when `--dry-run` or `--list-actions` is passed, it prints a grouped preview of all options with their equivalent CLI commands and exits immediately, preventing pipelines from stalling.

**How secure is the Declarative Plugin system?**
Extremely secure. Plugins are strictly configuration-based (YAML manifest files). They cannot run arbitrary bash commands, execute node scripts, download npm packages, or make network calls. File copies are restricted to whitelisted `.ai/` and `adapters/` directories, and blacklists protect files like `.env`, `.git/`, `package.json`, and source code folders. Overwriting existing files requires `--force` and automatically generates backups.

**How does the local Workflow Marketplace / Plugin Catalog work?**
It is a bundled registry catalog (`catalog.yaml`) containing safe first-party declarative plugins. You can discover them using `catalog list`, search via `catalog search`, and get recommendations via `catalog recommend`. Installing them copies their declarative manifests and assets (like skills and checks) into target directories, reusing all security validation and copy gates of local plugin installations.

---

## Trusted Registries & Governance

**Are remote registries enabled by default?**
No. Remote registries are completely disabled out-of-the-box. You must explicitly configure `.ai/policies/registry-policy.yaml` (set `allow_remote_registries: true`) before you can add, sync, or install plugins from any remote registry.

**Does `registry sync` download or run arbitrary code?**
Never. Remote sync only downloads declarative YAML and JSON files (catalogs, manifests, and plugin assets). These are written to a strictly segregated, gitignored directory (`.ai/registry-cache/`). The sync process never runs npm package scripts, invokes compilers, or executes binary code.

**How does checksum verification work?**
The publisher of a remote registry includes a signed manifest (`manifest.json`) listing all registry files and their SHA256 hashes. When synchronizing, the client computes local SHA256 hashes of all downloaded assets and verifies them against the manifest. If a hash mismatch is detected, the synchronization fails immediately.

**Can I restrict which paths a remote plugin can write to?**
Yes. The registry policy file (`registry-policy.yaml`) Whitelists allowed directories (`allowed_write_roots`) and blacklists sensitive targets (`blocked_paths`). Any plugin that attempts to write outside the whitelist or overwrite a blacklisted file (such as `.env` or `package.json`) will be blocked by the installer.

---

## Diagnostics & Validation

**What is the difference between `validate` and `doctor`?**
* **`validate`** — Strict compliance gate. Checks if required files exist and adapter configs are structurally correct. Exits with code 1 on failures. Use in CI/CD.
* **`doctor`** — Advisory audit. Warns about large unignored directories, missing `.gitignore` entries, stale memory indexes, and potential token waste. Non-blocking.

---

## Contributing

**How do I contribute a new adapter?**
1. Create a directory under `adapters/{tool-name}/`
2. Add the tool-native instruction files referencing `/AGENTS.md` and `/MEMORY.md`
3. Add a clear `setup.md` installation guide
4. Update the adapter registry in `.ai/adapters/registry.yaml`
5. Submit a PR — see our [Contributing Guidelines](/contributing)

---

## Protocol & Migration

**Is the MultiModel Dev OS protocol stable?**
Yes. The core Layer 1 specifications (root contracts and `.ai/` directory structure) are officially frozen and backward-compatible. Codebases prepared using any `v1.x` or `v2.x` release operate seamlessly with the latest version.

**How do I upgrade from an older version?**
Run `npx multimodel-dev-os@latest init --force` to pull the latest configuration files. Existing files will be backed up automatically. See the [Migration Guide](/migration-guide) for details.

Explore our [Stable Protocol Specification](/stable-protocol) or [CLI Command Reference](/CLI) for more details.
