# v1.0.0 Readiness Checklist

A strict quality playbook defining the core milestones and checks that must be satisfied before freezing the public MultiModel Dev OS protocol at `v1.0.0`.

---

## 1. Core API & Protocol Freeze
- [x] **Protocol Specification Freeze:** officially release the specification (`protocol.md`), locking the four root contracts (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`).
- [x] **JSON Schema Validation:** Complete standard JSON schema files under `.ai/schema/` to enforce config and template layouts.
- [x] **Command API Freeze:** Lock the core subcommands (`init`, `verify`, `validate`, `doctor`, `templates`) with consistent signatures, preventing breaking options in future minor versions.

---

## 2. Documentation & Visual Assets
- [x] **Navigation Menu Parity:** Assure that all nested guidelines, compatibility playbooks, and migration maps are integrated into the hosted VitePress documentation navigation.
- [x] **High-Fidelity SVGs:** Confirm lightweight, responsive vector assets exist in both root folders and docs public caches.
- [x] **Before/After Case Studies:** Complete 5 generic but realistic studies demonstrating context sync gains.

---

## 3. CLI Hardening & Error Handling
- [x] **Descriptive Warning Pathways:** Ensure the CLI logs descriptive error prompts when scaffolding directories, catching template mismatch errors and conflicts cleanly.
- [x] **Zero Dependency Limits:** Protect the CLI's pure-Node setup, assuring that zero runtime external packages are added.

---

## 4. Package Hygiene & Security
- [x] **Tarball audit:** Ensure `npm pack --dry-run` reports unpacked sizes under `~260kB` and compressed releases under `~76kB`.
- [x] **Ignored Cache verification:** Assert that local compiler caches (`docs/.vitepress/dist` and `docs/.vitepress/cache`) and `node_modules/` are strictly excluded from the packaging files whitelist.
