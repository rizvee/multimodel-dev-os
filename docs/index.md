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
      text: Protocol Specs
      link: /protocol
    - theme: alt
      text: v1.0 Readiness
      link: /v1-readiness
    - theme: alt
      text: View Case Studies
      link: /case-studies/
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
    details: Built-in zero-dependency validate and doctor checkups ensure pristine workspace rules layout.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #6366f1 0%, #10b981 100%);
}
</style>

## Cost & Context Optimization

Minimize prompt overhead and API billing by mapping key context-reduction techniques to MultiModel Dev OS features:

<p align="center">
  <img src="/assets/cost-optimization.svg" alt="Cost Optimization Funnel" width="100%">
</p>

---

## 5-Day Adoption Roadmap

Deploying MultiModel Dev OS across your team is straightforward and tool-neutral:

<p align="center">
  <img src="/assets/ai-dev-os-roadmap.svg" alt="5-Day Adoption Roadmap" width="100%">
</p>

---

## Why MultiModel Dev OS?

AI coding tools are incredibly fast, but switching between them introduces context fragmentation:
1. **Context Loss:** You use **Cursor** for quick code completions, **Claude Code** for command-line implementations, and **Gemini/Antigravity** for auditing large code volumes. Every context switch drops your operational parameters.
2. **Instruction Drift:** Different tools look for different files (`.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, `.gemini/settings.json`). If you modify build scripts or styling rules in one place, they quickly drift across others, causing confusing compile failures.

`multimodel-dev-os` establishes a single source of truth inside your repository using a standardized root structure (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) and a `.ai/` context configuration directory.
