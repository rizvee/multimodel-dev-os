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
- Switching between agents (like Cursor, Claude Code, Gemini, Codex, Antigravity) requires maintaining duplicate instruction files (`.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, etc.).
- Modifying guidelines in one place results in immediate **Instruction Drift**, where one agent operates on outdated conventions, causing compile crashes.
- Duplicate instructions bloat prompts, wasting **1,500+ tokens** of model context budget on every single turn.

### After: Standardized Zero-Drift Sync
- Rules are defined once in a central root document (`AGENTS.md` and `.ai/`).
- MultiModel Dev OS dynamically routes the root contract directly to Cursor, Claude Code, Gemini, and VS Code. All agents operate on matching build specifications instantly.
- Toggling **Caveman Mode** dynamically strips descriptions and examples, saving **~79% of token context** per chat turn.

---

## Cost & Context Optimization

Minimize prompt overhead and API billing by mapping key context-reduction techniques to MultiModel Dev OS features:

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/assets/cost-optimization.svg" alt="Cost Optimization Funnel" width="100%">
</p>

- 🧠 **Choose Right Model:** Configured in `model-map.md`.
- ⚡ **Caveman Mode:** Cuts rule context sizes down by **~79%**.
- 📦 **RAG Scoping:** Modular context files in `.ai/context/` prevent token waste.

For a full deep dive, see our [Cost Optimization Playbook](https://rizvee.github.io/multimodel-dev-os/cost-optimization).

---

## 5-Day Adoption Roadmap

Deploying MultiModel Dev OS across your team is straightforward and tool-neutral:

<p align="center">
  <img src="https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/assets/ai-dev-os-roadmap.svg" alt="5-Day Adoption Roadmap" width="100%">
</p>

See our step-by-step timeline: [5-Day Adoption Roadmap Playbook](https://rizvee.github.io/multimodel-dev-os/5-day-roadmap).

---

## Protocol Stability & v1.0.0 Readiness

As we prepare for the `v1.0.0` freeze, MultiModel Dev OS enforces:
- **Strict Backward-Compatibility:** The core CLI commands and root folder directory schemas are officially frozen.
- **Robust JSON Schemas:** Native verification schemas guard your `.ai/config.yaml` against broken configurations.

Explore our stabilization playbooks directly:
- 🛡️ [Official Protocol Specification](https://rizvee.github.io/multimodel-dev-os/protocol)
- 🔌 [Multi-Agent Compatibility Guides](https://rizvee.github.io/multimodel-dev-os/compatibility)
- 📈 [Templates Quality Assurance Playbook](https://rizvee.github.io/multimodel-dev-os/template-qa)
- 💡 [Upgrade & Migration Guide](https://rizvee.github.io/multimodel-dev-os/migration-guide)
- 🏁 [v1.0.0 Readiness Roadmap](https://rizvee.github.io/multimodel-dev-os/v1-readiness)

---

## Real-World Case Studies

Discover how engineering teams deploy MultiModel Dev OS:
- 📦 [Full-Stack Next.js SaaS: Database Schema Synchronization](https://rizvee.github.io/multimodel-dev-os/case-studies/nextjs-saas)
- 🔌 [WordPress Theme Scaffolding: Folder Boundary Protections](https://rizvee.github.io/multimodel-dev-os/case-studies/wordpress-site)
- 🛒 [E-Commerce Webhooks: State Verification Alignment](https://rizvee.github.io/multimodel-dev-os/case-studies/ecommerce-store)
- 📈 [SEO Landing Pages: Core Web Vitals Linter Budgets](https://rizvee.github.io/multimodel-dev-os/case-studies/seo-landing-page)
- 🚀 [Multi-Model Handoff: Sequential Session Logging](https://rizvee.github.io/multimodel-dev-os/case-studies/multimodel-handoff)

---

## Core Navigation Guides

Explore our detailed manuals directly:
- 📖 [CLI Terminal Demo Guide](https://rizvee.github.io/multimodel-dev-os/demo)
- 💡 [Before/After Workflow Case Studies](https://rizvee.github.io/multimodel-dev-os/workflow-examples)
- 🛡️ [Public Release & Staging Checklist](https://rizvee.github.io/multimodel-dev-os/launch-checklist)

---

## License

MIT License.