---
layout: home

hero:
  name: "MultiModel Dev OS"
  text: "Standardize your AI pair-programmers"
  tagline: "Portable, vendor-neutral workspace configurations for multi-agent coding loops."
  image:
    src: /logo.png
    alt: MultiModel Dev OS Logo
  actions:
    - theme: brand
      text: Get Started Quick
      link: /quickstart
    - theme: alt
      text: View Template Gallery
      link: /templates/
    - theme: alt
      text: View on GitHub
      link: https://github.com/rizvee/multimodel-dev-os

features:
  - icon: 🧠
    title: Universal Portability
    details: Supports Codex, Antigravity, Cursor, Claude Code, Gemini, and VS Code with dynamic adapters sync.
  - icon: ⚡
    title: Ultra-Low Token Footprint
    details: Includes Caveman Mode to slash model context footprint by ~79%, saving massive API bill budgets.
  - icon: 🛡️
    title: Local Quality Gates
    details: Build-in zero-dependency validate and doctor checkups ensure pristine workspace rules layout.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #646cff 0%, #42b883 100%);
}
</style>

## 10-Second Quickstart

Bootstrap your project instantly via `npx`:

```bash
npx multimodel-dev-os@latest init
```

## Why MultiModel Dev OS?

AI coding tools are incredibly fast, but switching between them introduces context fragmentation:
1. **Context Loss:** You use **Cursor** for quick code completions, **Claude Code** for command-line implementations, and **Gemini/Antigravity** for auditing large code volumes. Every context switch drops your operational parameters.
2. **Instruction Drift:** Different tools look for different files (`.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, `.gemini/settings.json`). If you modify build scripts or styling rules in one place, they quickly drift across others, causing confusing compile failures.

`multimodel-dev-os` establishes a single source of truth inside your repository using a standardized root structure (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) and a `.ai/` context configuration directory.
