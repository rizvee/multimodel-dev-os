---
layout: home

hero:
  name: "MultiModel Dev OS"
  text: "Portable, validation-first workspace & localhost gateway"
  tagline: "Centralize rules, skills, registries, adapters, and local gateway metadata in one auditable zero-dependency foundation for governed multi-agent development."
  actions:
    - theme: brand
      text: Get Started
      link: /quickstart
    - theme: alt
      text: Documentation Map
      link: /documentation-map
    - theme: alt
      text: Gateway Architecture
      link: /gateway-architecture
    - theme: alt
      text: GitHub (v4.2.0)
      link: https://github.com/rizvee/multimodel-dev-os

features:
  - icon: 🛡️
    title: Governed Workspace Standard
    details: Centralize instructions in AGENTS.md with tool-specific adapters for Antigravity, Claude Code, Cursor, Codex, Gemini, and VS Code.
  - icon: 🧩
    title: Declarative Skill OS
    details: Validation-first skill, prompt, workflow, permission, and guardrail registries with Ed25519 signatures and policy checks.
  - icon: ⚡
    title: Localhost Gateway Foundation
    details: Mock OpenAI-compatible provider runtime, client preview configs, route planning, and local in-memory usage accounting.
  - icon: 🔒
    title: Zero-Dependency Safety
    details: Standard library Node.js (20+) architecture with approval-gated writes, bounded local logs, and zero remote tracking.
---

<style>
.section-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
}
.section-sub {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  margin-bottom: 1.5rem;
}
.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
  margin-bottom: 2rem;
}
.persona-card {
  border: 1px solid var(--vp-c-border);
  background-color: var(--vp-c-bg-alt);
  border-radius: 12px;
  padding: 1.5rem;
  transition: border-color 0.25s, transform 0.25s;
  text-decoration: none !important;
  color: inherit !important;
  display: block;
}
.persona-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-3px);
}
.persona-tag {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-brand-1);
  margin-bottom: 0.4rem;
}
.persona-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}
.persona-desc {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
.arch-container {
  background-color: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  margin-bottom: 2.5rem;
}
.safety-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  margin-bottom: 2rem;
}
.safety-badge {
  border: 1px solid var(--vp-c-border);
  background-color: var(--vp-c-bg-elv);
  border-radius: 8px;
  padding: 1rem;
}
.safety-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 0.25rem;
}
.safety-desc {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
</style>

<div class="vp-doc">

## Explore by Developer Goal

Choose the path tailored to your current objective:

<div class="persona-grid">

<a href="/quickstart" class="persona-card">
  <div class="persona-tag">Start Here</div>
  <div class="persona-title">New User Quickstart</div>
  <div class="persona-desc">Install multimodel-dev-os, initialize workspace defaults, and run health verification in under 60 seconds.</div>
</a>

<a href="/real-repo-onboarding" class="persona-card">
  <div class="persona-tag">Existing Projects</div>
  <div class="persona-title">Repository Onboarding</div>
  <div class="persona-desc">Analyze existing codebases, detect patterns, recommend templates, and synchronize tool adapters without risk.</div>
</a>

<a href="/skill-os-cli" class="persona-card">
  <div class="persona-tag">Governance &amp; Prompts</div>
  <div class="persona-title">Skill OS Explorer</div>
  <div class="persona-desc">Inspect declarative skill, prompt, workflow, permission, and guardrail registries with automated policy checks.</div>
</a>

<a href="/gateway-architecture" class="persona-card">
  <div class="persona-tag">Localhost Gateway</div>
  <div class="persona-title">Gateway Foundation</div>
  <div class="persona-desc">Explore local mock provider execution, client preview configurations, dry-run routing, and local observability.</div>
</a>

<a href="/gateway-security-model" class="persona-card">
  <div class="persona-tag">Trust &amp; Safety</div>
  <div class="persona-title">Security &amp; Threat Model</div>
  <div class="persona-desc">Review zero-runtime-dependency isolation, Ed25519 signature enforcement, and local-only log redaction boundaries.</div>
</a>

<a href="/documentation-map" class="persona-card">
  <div class="persona-tag">Full Index</div>
  <div class="persona-title">Documentation Map</div>
  <div class="persona-desc">Browse the complete goal-driven manual index covering all 130+ public documentation pages.</div>
</a>

</div>

## Architecture Overview

MultiModel Dev OS sits between developer intent, AI coding tools, and localhost gateway mock foundations:

<div class="arch-container">

```text
+-----------------------------------------------------------------------------------+
|                            DEVELOPER WORKSPACE                                    |
|   AGENTS.md  *  MEMORY.md  *  TASKS.md  *  RUNBOOK.md  *  .ai/ Governance Rules   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        MULTI-AGENT ADAPTER SYNCHRONIZER                           |
|   Antigravity (.gemini)  *  Claude Code (CLAUDE.md)  *  Cursor (.cursorrules)     |
|   Codex (.codex/)  *  Gemini  *  VS Code (.vscode/settings.json)                  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                     SKILL OS & TRUSTED REGISTRY ENGINE                            |
|   Declarative Skills  *  RACE+ Prompts  *  Ed25519 Signatures  *  Policy Engine    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                       LOCALHOST GATEWAY FOUNDATION (v4.2.0)                       |
|   127.0.0.1 Server  *  Mock OpenAI Provider  *  SSE Streaming  *  Client Previews   |
|   Deterministic Routing  *  Resilience Simulator  *  In-Memory Usage Accounting   |
+-----------------------------------------------------------------------------------+
```

</div>

## Non-Negotiable Safety Boundaries

MultiModel Dev OS is designed for total transparency and local safety:

<div class="safety-grid">

<div class="safety-badge">
  <div class="safety-title">Zero Runtime Dependencies</div>
  <div class="safety-desc">Uses Node.js standard library built-in modules only (crypto, fs, http, path).</div>
</div>

<div class="safety-badge">
  <div class="safety-title">Approval-Gated Writes</div>
  <div class="safety-desc">All file mutations require explicit approval. Onboarding and planning are read-only.</div>
</div>

<div class="safety-badge">
  <div class="safety-title">Mock-Only Provider</div>
  <div class="safety-desc">The v4.2 gateway executes bundled mock models only. No external APIs are called.</div>
</div>

<div class="safety-badge">
  <div class="safety-title">Preview-Only Configs</div>
  <div class="safety-desc">Client configuration plans are preview-only. No third-party tools are modified silently.</div>
</div>

<div class="safety-badge">
  <div class="safety-title">Local Observability</div>
  <div class="safety-desc">Traces, metrics, and usage logs stay local, bounded, redacted, and in-memory. Zero telemetry.</div>
</div>

<div class="safety-badge">
  <div class="safety-title">Maintainer Publication</div>
  <div class="safety-desc">Package publishing is maintainer-controlled with strict pre-publish security checks.</div>
</div>

</div>

## Key Documentation Routes

- **Getting Started**: [Quickstart](/quickstart) | [CLI Reference](/CLI) | [FAQ](/faq) | [Interactive Demo](/demo)
- **Skill OS**: [Skill Registry](/skill-registry) | [Skill OS CLI](/skill-os-cli) | [Structured Prompts](/structured-prompts) | [Migration Guide](/skill-os-migration-guide)
- **Gateway Foundation**: [Gateway Architecture](/gateway-architecture) | [Gateway Protocol](/gateway-protocol) | [Gateway Runtime](/gateway-runtime) | [Mock Provider](/gateway-mock-provider)
- **Security & Trust**: [Gateway Security Model](/gateway-security-model) | [Security Threat Model](/security-threat-model) | [Trusted Registries](/trusted-registries) | [Known Limitations](/v4.2-known-limitations)
- **Releases & Governance**: [Release v4.2.0](/releases/v4.2.0) | [Release State](/release-state) | [Contributing](/contributing) | [License](/package-safety)

</div>
