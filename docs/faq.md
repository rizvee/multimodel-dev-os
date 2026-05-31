# FAQ: MultiModel Dev OS Questions & Answers

Frequently asked questions regarding MultiModel Dev OS, AI coding agents compatibility, and prompt context optimization.

> **Use when**: Resolving setup ambiguities, understanding comparative advantages over simple rules files, or auditing CLI validations.

---

## General

**What is MultiModel Dev OS?**
A set of markdown templates and directory structures that allow multiple AI coding tools (Codex, Cursor, Claude Code, Gemini, Antigravity, VS Code) to share a single portable AI project context. It acts like `.editorconfig` but for AI assistants.

**Is this a runtime operating system?**
No. It is a metaphorical "OS" providing standard files (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) to coordinate multiple tools.

**What does "multimodel" mean?**
Multiple distinct AI coding models/agents (such as Codex, Antigravity, Cursor, and Claude Code) operating sequentially on the exact same workspace branch.

---

## Setup

**Do I need Node.js?**
It depends on your installation path:
* **Yes:** If you run the primary, recommended `npx multimodel-dev-os@latest init` workflow.
* **No:** If you run the fallback bash (`install.sh`) or PowerShell (`install.ps1`) one-liners.

**Why not just write a single manual AGENTS.md myself?**
While you can write a raw markdown file, MultiModel Dev OS offers:
1. **Automated Bridging:** Adapters dynamically map your root source to Cursor, Claude, and Gemini native rules.
2. **Context Budgets:** Toggle **Caveman Mode** to slash prompt rules overhead by **~79%**.
3. **Structured Verification:** Built-in CLI commands validate workspace specifications instantly.

---

## Adapters

**Do I copy adapter files to my project root?**
Yes, for tools that auto-detect specific files:
- Cursor → `.cursorrules`
- Claude Code → `CLAUDE.md`
- VS Code → `.vscode/settings.json`

---

## Caveman Mode

**When should I use Caveman Mode?**
**Best for**: Context optimization for AI coding when you are using compact context budget windows, smaller models, or want to save money on API bill parameters.

---

## Diagnostics & Validation

**What is the difference between `validate` and `doctor`?**
* **`validate`** is strict and verifies compliance with the directory schema.
* **`doctor`** is advisory and warns you about large unignored directories or empty placeholders.

---

## Protocol & Migration

**Is the MultiModel Dev OS protocol stable?**
Yes. As of version `v1.1.0`, the core specifications are officially frozen and backward-compatible. This ensures that any codebase prepared using `v1.1.0` will operate seamlessly inside future `1.x` ecosystems.

Explore our [Stable Protocol Specification](/stable-protocol) or [Upgrade & Migration Guide](/migration-guide) for details.
