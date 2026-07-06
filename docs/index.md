---
layout: home

hero:
  name: "MultiModel Dev OS"
  text: "One config. Every AI tool. Zero lock-in."
  tagline: "Stop copy-pasting rules between Cursor, Claude, Gemini, Codex, and VS Code. Standardize your AI pair-programmers with a single portable workspace."
  image:
    src: /logo.png
    alt: MultiModel Dev OS Logo
  actions:
    - theme: brand
      text: Get Started in 30 Seconds
      link: /quickstart
    - theme: alt
      text: See It in Action
      link: /demos/
    - theme: alt
      text: vs Alternatives
      link: /comparison
    - theme: alt
      text: View on GitHub
      link: https://github.com/rizvee/multimodel-dev-os

features:
  - icon: 📁
    title: Instant Repo Onboarding
    details: Analyze existing projects, get template recommendations, and bootstrap AI Dev OS configs without breaking anything.
  - icon: 🔄
    title: Universal Adapter Sync
    details: Write rules once in AGENTS.md — auto-syncs to .cursorrules, CLAUDE.md, .vscode/, .gemini/, and 10+ more tools.
  - icon: 🧠
    title: Self-Improving Intelligence
    details: Hash-compressed memory, developer feedback loops, and structured improvement proposals with human-in-the-loop safety gates.
  - icon: ⚡
    title: Caveman Mode (−79% Tokens)
    details: Slash model context footprint by ~79% with compressed shorthand declarations. Save massively on API bills.
  - icon: 🛡️
    title: 300+ Quality Gates
    details: Built-in validate, doctor, verify, and Skill OS checks inspect workspace health with strict structural assertions.
  - icon: 🔧
    title: Zero Dependencies
    details: Pure Node.js CLI — no runtime, no build step, no package manager lock-in. Works on Windows, macOS, and Linux.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #6366f1 0%, #10b981 100%);
}
.section-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}
.section-sub {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  margin-bottom: 1.5rem;
}
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}
.card-item {
  border: 1px solid var(--vp-c-bg-mute);
  background-color: var(--vp-c-bg-soft);
  border-radius: 10px;
  padding: 1.5rem;
  transition: border-color 0.25s, transform 0.25s;
  text-decoration: none !important;
  color: inherit !important;
}
.card-item:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-3px);
}
.card-title {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
}
.card-desc {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
.card-time {
  font-size: 0.8rem;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  margin-top: 0.4rem;
}
.works-with-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
  margin-bottom: 2rem;
}
.works-with-item {
  border: 1px solid var(--vp-c-bg-mute);
  background-color: var(--vp-c-bg-soft);
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
  font-weight: 500;
  font-size: 0.9rem;
}
.highlight-box {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08));
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 1.5rem 2rem;
  margin: 2rem 0;
}
.highlight-box h3 { margin-top: 0; }
.safety-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}
.safety-item {
  text-align: center;
  padding: 1rem;
}
.safety-icon { font-size: 2rem; margin-bottom: 0.3rem; }
.safety-label { font-weight: 700; font-size: 1.1rem; }
.safety-desc { font-size: 0.85rem; color: var(--vp-c-text-2); }
</style>

## Install in 30 Seconds

```bash
npx multimodel-dev-os@latest init
```

Already have a project? Onboard it safely:

```bash
npx multimodel-dev-os@latest onboard analyze
npx multimodel-dev-os@latest onboard recommend
npx multimodel-dev-os@latest onboard apply --approved
```

---

## Why Not Just `.cursorrules` or `CLAUDE.md`?

You use **Cursor** for autocomplete, **Claude Code** for terminal ops, **Gemini** for audits. Every tool switch:

1. **Drops context** — the next tool doesn't know what the previous one decided
2. **Drifts rules** — you update `.cursorrules` but forget `CLAUDE.md`, causing confusing failures
3. **Wastes tokens** — every prompt resends your full ruleset, and API bills spike

**MultiModel Dev OS** gives you a **single source of truth** (`AGENTS.md`) that auto-syncs to every tool. Change once, every tool updates.

---

## Works With

<div class="works-with-grid">
  <div class="works-with-item">🤖 Codex</div>
  <div class="works-with-item">🪐 Antigravity</div>
  <div class="works-with-item">🎯 Cursor</div>
  <div class="works-with-item">⚡ Claude Code</div>
  <div class="works-with-item">🧠 Gemini</div>
  <div class="works-with-item">💻 VS Code</div>
  <div class="works-with-item">🔌 Cline / Roo</div>
  <div class="works-with-item">🔌 Aider</div>
</div>

---

## See It in Action

<div class="grid-container">
  <a href="/demos/existing-repo-onboarding" class="card-item">
    <div class="card-title">📁 Repo Onboarding</div>
    <div class="card-desc">Analyze your project, get recommendations, and bootstrap configs safely.</div>
    <div class="card-time">~2 min</div>
  </a>
  <a href="/demos/adapter-sync" class="card-item">
    <div class="card-title">🔄 Adapter Sync</div>
    <div class="card-desc">Mirror rules across Cursor, Claude, VS Code, and Gemini automatically.</div>
    <div class="card-time">~1 min</div>
  </a>
  <a href="/demos/safe-improvement-loop" class="card-item">
    <div class="card-title">🧠 Improvement Loop</div>
    <div class="card-desc">Feedback → proposals → validate → apply with audit trails.</div>
    <div class="card-time">~2 min</div>
  </a>
  <a href="/demos/multi-agent-handoff" class="card-item">
    <div class="card-title">🤝 Agent Handoff</div>
    <div class="card-desc">Compile session context and hand off between models.</div>
    <div class="card-time">~1 min</div>
  </a>
  <a href="/demos/release-check" class="card-item">
    <div class="card-title">🚀 Release Check</div>
    <div class="card-desc">Run 300+ verification checks and package hygiene checks.</div>
    <div class="card-time">~1 min</div>
  </a>
  <a href="/comparison" class="card-item">
    <div class="card-title">⚔️ vs Alternatives</div>
    <div class="card-desc">See how MMDO compares to manual rules, prompt packs, and tool-specific configs.</div>
    <div class="card-time"></div>
  </a>
</div>

---

<div class="highlight-box">

### What's New in v4.1 Development

- **Skill OS foundation** adds RACE+ prompts, skill registries, permission metadata, advisory guardrails, workflow `skill_os` references, and draft-only business operator templates.
- **Read-only inspection** is available through `skill-os status`, `skill-os validate`, and list/show commands.
- **Validation-only safety model** means metadata is checked locally without executing automation, enforcing permissions at runtime, or calling external tools.

</div>

---

## Safety & Trust

<div class="safety-grid">
  <div class="safety-item">
    <div class="safety-icon">🛡️</div>
    <div class="safety-label">300+ Quality Gates</div>
    <div class="safety-desc">Strict structural verification on every release</div>
  </div>
  <div class="safety-item">
    <div class="safety-icon">👤</div>
    <div class="safety-label">Human-in-the-Loop</div>
    <div class="safety-desc">All writes require explicit --approved flag</div>
  </div>
  <div class="safety-item">
    <div class="safety-icon">🔒</div>
    <div class="safety-label">12 Safety Gates</div>
    <div class="safety-desc">Proposal validation with path boundary checks</div>
  </div>
  <div class="safety-item">
    <div class="safety-icon">📝</div>
    <div class="safety-label">Full Audit Trail</div>
    <div class="safety-desc">SHA-256 hashed apply log for every change</div>
  </div>
</div>

---

## Explore

<div class="grid-container">
  <a href="/quickstart" class="card-item">
    <div class="card-title">🚀 Quickstart Guide</div>
    <div class="card-desc">Deploy adapters and root contracts in under 30 seconds.</div>
  </a>
  <a href="/CLI" class="card-item">
    <div class="card-title">⌨️ CLI Reference</div>
    <div class="card-desc">Full command reference for init, scan, status, memory, workflow, and more.</div>
  </a>
  <a href="/templates/" class="card-item">
    <div class="card-title">📦 Template Gallery</div>
    <div class="card-desc">6 production-ready stack configurations for Next.js, WordPress, e-commerce, and more.</div>
  </a>
  <a href="/architecture" class="card-item">
    <div class="card-title">🏗️ Architecture</div>
    <div class="card-desc">4-layer protocol from root contracts through intelligence engine.</div>
  </a>
  <a href="/skill-os-migration-guide" class="card-item">
    <div class="card-title">Skill OS Migration</div>
    <div class="card-desc">Move from markdown skills and raw prompts to validated Skill OS metadata safely.</div>
  </a>
  <a href="/skill-os-authoring-reference" class="card-item">
    <div class="card-title">Skill OS Authoring</div>
    <div class="card-desc">Concise field reference for skills, prompts, permissions, guardrails, and workflow metadata.</div>
  </a>
  <a href="/cost-optimization" class="card-item">
    <div class="card-title">⚡ Cost Optimization</div>
    <div class="card-desc">Cut your prompting token bills by up to 79% using Caveman shortcuts.</div>
  </a>
  <a href="/distribution" class="card-item">
    <div class="card-title">📦 Distribution Guide</div>
    <div class="card-desc">Release checklists, npm publishing, and package hygiene.</div>
  </a>
</div>

---

## For AI Assistants and Coding Agents

To support modern AI search, GEO discovery, and developer agents:
- We provide [llms.txt](/llms.txt) and [llms-full.txt](/llms-full.txt) at the root of the hosted documentation to allow Large Language Models and AEO utilities to read full workspace specs in single, token-optimized files.
- The officially frozen protocol guarantees that agents can read and write workspace rules without manual supervision or instruction drift.

---

## Contributing & Community

⭐ **[Star us on GitHub](https://github.com/rizvee/multimodel-dev-os)** — it helps developers discover this project

- 📖 **[Contributing Guidelines](https://github.com/rizvee/multimodel-dev-os/blob/main/CONTRIBUTING.md)**
- 🐛 **[Report a Bug](https://github.com/rizvee/multimodel-dev-os/issues/new)**
- 💡 **[Request a Feature](https://github.com/rizvee/multimodel-dev-os/issues/new)**
- 📦 **[NPM Package](https://www.npmjs.com/package/multimodel-dev-os)**
