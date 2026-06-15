# Demo Workflows

Hands-on, copy-paste workflows that show MultiModel Dev OS in action. Each demo takes **under 2 minutes** and requires only `npx` — no global install, no dependencies.

---

## Choose a Demo

<div class="demo-grid">
  <a href="/demos/existing-repo-onboarding" class="demo-card">
    <div class="demo-icon">📁</div>
    <div class="demo-title">Existing Repo Onboarding</div>
    <div class="demo-desc">Analyze a real project, get template recommendations, and safely bootstrap AI Dev OS configs.</div>
    <div class="demo-time">~2 min</div>
  </a>
  <a href="/demos/adapter-sync" class="demo-card">
    <div class="demo-icon">🔄</div>
    <div class="demo-title">Adapter Sync</div>
    <div class="demo-desc">Mirror rule files across Cursor, Claude, VS Code, and Gemini automatically.</div>
    <div class="demo-time">~1 min</div>
  </a>
  <a href="/demos/safe-improvement-loop" class="demo-card">
    <div class="demo-icon">🧠</div>
    <div class="demo-title">Safe Improvement Loop</div>
    <div class="demo-desc">Capture feedback, propose improvements, validate safety, and apply changes with audit trails.</div>
    <div class="demo-time">~2 min</div>
  </a>
  <a href="/demos/multi-agent-handoff" class="demo-card">
    <div class="demo-icon">🤝</div>
    <div class="demo-title">Multi-Agent Handoff</div>
    <div class="demo-desc">Compile token-compressed session context and hand off state between agents or models.</div>
    <div class="demo-time">~1 min</div>
  </a>
  <a href="/demos/release-check" class="demo-card">
    <div class="demo-icon">🚀</div>
    <div class="demo-title">Release Check</div>
    <div class="demo-desc">Run the full pre-flight verification suite, doctor audit, and package hygiene check.</div>
    <div class="demo-time">~1 min</div>
  </a>
</div>

---

## Prerequisites

All demos require:
- **Node.js 18+** installed
- A terminal (bash, zsh, PowerShell, or cmd)
- An existing project directory (or create a temp one)

No global install needed — every command uses `npx multimodel-dev-os@latest`.

---

## Demo Philosophy

Every demo follows the same structure:

1. **Starting State** — what you need before running
2. **Workflow** — step-by-step commands with expected output
3. **What Gets Created** — files and directories produced
4. **Safety Notes** — what is read-only vs. what writes
5. **Cleanup** — how to undo
6. **Next Steps** — where to go after

<style>
.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
  margin: 2rem 0;
}
.demo-card {
  border: 1px solid var(--vp-c-bg-mute);
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
  padding: 1.5rem;
  text-decoration: none !important;
  color: inherit !important;
  transition: border-color 0.25s, transform 0.25s;
  display: block;
}
.demo-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-3px);
}
.demo-icon { font-size: 2rem; margin-bottom: 0.5rem; }
.demo-title { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.4rem; }
.demo-desc { font-size: 0.9rem; color: var(--vp-c-text-2); margin-bottom: 0.5rem; }
.demo-time { font-size: 0.8rem; color: var(--vp-c-brand-1); font-weight: 600; }
</style>
