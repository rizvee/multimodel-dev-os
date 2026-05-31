# MultiModel Dev OS

Portable, vendor-neutral workspace configuration layer for multi-agent coding loops.

---

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/assets/social-preview.svg" alt="MultiModel Dev OS Banner" width="100%">
</p>

---

## Quickstart

Initialize a unified, tool-neutral AI developer workspace instantly:

```bash
npx multimodel-dev-os@latest init
```

---

## See It in Action

`multimodel-dev-os` runs completely on native Node.js libraries, keeping execution speeds lightning-fast with **zero third-party NPM runtime dependencies**. Here is the clean interactive terminal sequence executing `init`, `validate`, and `doctor` commands:

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/assets/terminal-demo.svg" alt="Terminal Demo Sequence" width="100%">
</p>

---

## Before vs. After

### Before: Chaotic Prompting & Instruction Drift
- Switching between agents (like Cursor, Claude Code, Gemini, Codex) requires maintaining duplicate instruction files (`.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, etc.).
- Modifying guidelines in one place results in immediate **Instruction Drift**, where one agent operates on outdated conventions, causing compile crashes.
- Duplicate instructions bloat prompts, wasting **1,500+ tokens** of model context budget on every single turn.

### After: Standardized Zero-Drift Sync
- Rules are defined once in a central root document (`AGENTS.md` and `.ai/`).
- MultiModel Dev OS dynamically routes the root contract directly to Cursor, Claude Code, Gemini, and VS Code. All agents operate on matching build specifications instantly.
- Toggling **Caveman Mode** dynamically strips descriptions and examples, saving **~79% of token context** per chat turn.

---

## Sync Architecture

`multimodel-dev-os` decouples your instructions from specific IDE extensions and model APIs:

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/assets/architecture-preview.svg" alt="Sync Architecture" width="100%">
</p>

---

## Core Navigation Guides

Explore our detailed manuals directly:
- 📖 [CLI Terminal Demo Guide](https://rizvee.github.io/multimodel-dev-os/demo)
- 💡 [Before/After Workflow Case Studies](https://rizvee.github.io/multimodel-dev-os/workflow-examples)
- 🛡️ [Public Release & Staging Checklist](https://rizvee.github.io/multimodel-dev-os/launch-checklist)
- 📦 [Standard Template Gallery](https://rizvee.github.io/multimodel-dev-os/templates/)

---

## License

MIT License.