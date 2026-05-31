# Public Launch & Social Sharing Kit

A curated collection of promotional templates and copy outlines to successfully announce `multimodel-dev-os` to global developer communities.

---

## 1. Product Hunt Style Launch Info
- **Tagline:** Portable, vendor-neutral project context for all your AI coding tools.
- **Elevator Pitch:** Stop manually copy-pasting system instructions when switching between Cursor, Claude Code, Antigravity, and VS Code. Run a single lightweight command to scaffold, sync, and optimize your repository's AI guidelines.

---

## 2. GitHub Repository Metadata
- **Short Description:** Portable, vendor-neutral project configuration and CLI tool for AI coding agents. Think `.editorconfig` but optimized for LLMs, Cursor, Claude Code, and VS Code.
- **Topics/Keywords:** `ai-dev-os`, `multi-agent`, `ai-coding`, `developer-tools`, `cursorrules`, `claude-code`, `antigravity`, `gemini`

---

## 3. X / Twitter Post (The Hook)

```text
Pair programming with AI is fast, until you switch tools. 💸

You design architecture in Claude Code, implement locally in Cursor, and audit with Gemini. Every switch drops context, and rules start to drift.

Stop copy-pasting. Say hello to MultiModel Dev OS! 🧠

npx multimodel-dev-os@latest init

👉 Single source of truth for all tools (Cursor, Claude, VS Code, Gemini, Codex)
👉 Slashing token consumption by up to ~79% with Caveman Mode
👉 Strict CLI validation commands to protect context health
👉 Fully vendor-neutral and zero-dependency

Check it out: https://github.com/rizvee/multimodel-dev-os
#AIDev #OpenSource #SoftwareEngineering #AItools
```

---

## 4. LinkedIn Post (The Deep Dive)

```text
The hidden developer tax when coding with AI: Context Drift. 💸

When pair programming with AI agents, we often switch between platforms to leverage their unique strengths:
- Claude Code for terminal actions and system layouts
- Cursor for local autocomplete and quick edits
- Gemini / Antigravity for large-scale security and performance audits

But there's a problem: every tool has its own custom settings, systems, and instructions files. You modify a build command in one place, forget to update it in another, and the agent breaks on compile. 

To solve this, we are launching multimodel-dev-os — a portable, vendor-neutral operating configuration layer for AI coding tools.

Think .editorconfig but designed for LLMs. 

How it works:
1. Initialize in seconds: npx multimodel-dev-os@latest init
2. Configure your instructions in one root directory (AGENTS.md, MEMORY.md, TASKS.md)
3. Zero-duplication adapters dynamically present these instructions to Cursor (.cursorrules), Claude (CLAUDE.md), VS Code, and Gemini.
4. Slash token bills by up to ~79% using Caveman Mode for small-context turns.

Fully open-source, zero-dependency, and built to keep your context aligned across every coding tool.

GitHub: https://github.com/rizvee/multimodel-dev-os
Let me know what you think in the comments! 👇
```

---

## 5. Reddit-Style Post (/r/webdev, /r/LocalLLaMA)

- **Title:** Show HN / Show Reddit: MultiModel Dev OS — A vendor-neutral context management layer for Cursor, Claude Code, and VS Code.
- **Content:**
  Hey everyone,
  
  If you pair program with multiple AI tools, you've probably noticed how fast rules drift. You edit a command in your system prompts, but forget to update Cursor's `.cursorrules`, causing the model to continuously fail.
  
  I built **multimodel-dev-os** to solve this. It's a simple, zero-dependency CLI that scaffolds a unified context layout and uses lightweight adapters to route a single source of truth to all your tools.
  
  ### Key Features:
  * **Primary Init:** Run `npx multimodel-dev-os@latest init` to bootstrap in 2 seconds.
  * **Vendor-Neutral:** One config routes to Cursor (`.cursorrules`), Claude Code (`CLAUDE.md`), VS Code (`settings.json`), and Gemini/Antigravity (`settings.json`).
  * **Caveman Mode:** Strips out examples and descriptions to save **~79% of tokens** when context budgets are tight.
  * **Linter Guard:** Run `npx multimodel-dev-os@latest verify` to confirm structure health before pushing commits.
  
  Open-source and MIT licensed. I'd love to hear your feedback on the layout structure!
  
  GitHub: https://github.com/rizvee/multimodel-dev-os
