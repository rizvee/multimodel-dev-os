# MultiModel Dev OS — Roadmap: v2.x → v3.0

This document outlines the development path, completed milestones, and future plans for MultiModel Dev OS.

---

## 1. Current Status

> [!IMPORTANT]
> **v2.8.1 is the active stable release** on the public npm registry. All features below marked ✅ are shipped and production-ready.

---

## 2. Completed Milestones

### v2.0.0 — Template Galaxy & Model Registry ✅
- Standardized model registries under `.ai/models/` (registry, providers, routing presets, local models)
- Adapter registry expansion under `.ai/adapters/registry.yaml`
- Android Expo mobile template (`examples/expo-react-native-android/`)
- CLI registry subcommands: `models`, `show-model`, `providers`, `route-model`, `adapters`, `show-adapter`, `skills`, `show-skill`
- Stable npm publication resumed

### v2.2.0 — Codebase Scanner & Memory Engine ✅
- `scan` command to inspect frameworks, package managers, and AI Dev OS files
- `memory build`, `memory refresh`, and `memory diff` commands
- Hash-compressed memory indexing to `.ai/intelligence/memory.hash.json`
- Secret-safety exclusions for `.env`, `.npmrc`, `.keystore` files

### v2.3.0 — Feedback Learning & Proposal Engine ✅
- `feedback add`, `feedback list`, `feedback summarize` commands
- `improve propose`, `improve review`, `improve status` commands
- Read-only proposal drafting with safety gates
- Feedback logs and learning rules compilation

### v2.4.0 — Approved Proposal Application Engine ✅
- `improve validate`, `improve diff`, `improve apply` subcommands
- 12 strict safety gates including path boundary, protected paths, idempotency
- Applied Proposals Audit Log (`apply-log.jsonl`) with SHA-256 hashing
- Deterministic operations: `create_file`, `append_line`, `replace_text`

### v2.5.0 — Repository Intelligence Command Center ✅
- `status` command — compact operational dashboard
- `workflow list`, `show`, `plan`, `run` — multi-agent workflow orchestration
- `handoff build`, `handoff show` — token-compressed session context
- Safe execution boundaries — no destructive operations from workflows

### v2.6.0 — Real-Repo Onboarding & Adapter Sync ✅
- `onboard analyze`, `recommend`, `plan`, `apply`, `status` — existing repo onboarding
- `adapter status`, `diff`, `sync` — IDE adapter rule file synchronization
- Template recommendation heuristics with confidence scores
- Safety overwrites with automatic `.bak` backups
- `doctor --onboarding` diagnostics

### v2.7.0 — Website, Demo & Distribution System ✅
- Restructured homepage as a product conversion funnel
- Created 5 structured, copy-paste interactive demo workflow pages
- Documented comprehensive distribution and release workflows
- Added new SVG visual assets for onboarding and adapter sync flows
- Created docs-first examples for key developer workflows
- Updated sitemaps, model registries, and search indices

### v2.8.0 / v2.8.1 — Interactive TUI Dashboard & Plugin Hooks ✅
- **Interactive TUI Dashboard**: Added `dashboard`/`ui` command launching a zero-dependency keyboard-interactive command center built with Node's native `readline` module.
- **Declarative Plugin Hooks**: Added `plugin` command suite (`list`, `show`, `validate`, `install`, `status`) and JSON schema to securely extend workspace templates, workflows, and skills.
- **Secure Plugin Installer**: Supports `--approved` execution gate, path whitelisting to `.ai/` and `adapters/` directories, and automatic conflict `.bak` backups.
- **Headless Fallback & CI Polish**: Polish dry-run outputs and added `--list-actions` parameter to prevent TUI hangs in CI.
- **Path Traversal Hardening**: Enforce alphanumeric slug checks (`/^[a-z0-9-_]+$/i`) and pattern validation bounds to block traversal vectors.

---

## 3. Publishing Workflow

All releases follow this strict publishing checklist:

1. Bump version in `package.json`
2. Run `npm run verify` (220+ assertions must pass)
3. Run `npm run docs:build` to verify documentation
4. Run `npm publish --dry-run` to review package hygiene
5. Set `MMDO_ALLOW_PUBLISH=true` and publish:
   ```bash
   MMDO_ALLOW_PUBLISH=true npm publish --access public
   ```

---

## 4. Upcoming: v2.9.0 — Auto-Detection & Custom Adaptors

*   **Adapter Auto-Detection**: Detect installed tools and automatically recommend adapter setup.
*   **Custom Adapter Hookups**: Programmatic hooks allowing plugins to register physical adapter configurations dynamically.

---

## 5. Future: v3.0.0 — Unified Autonomous Co-Pilot Ecosystem

*   **Full Multi-Agent Orchestration**: Dynamic task handoffs between specialized agents
*   **Distributed Registry Syncing**: Team-wide configuration synchronization
*   **Cryptographic Proposal Signing**: Tamper-proof improvement proposals
*   **Real-Time Collaboration**: Live workspace state sharing between agents and developers
*   **Cloud-Native Intelligence**: Optional cloud-backed memory and feedback aggregation

---

## 6. Migration Notes

* **From any v2.x**: Run `npx multimodel-dev-os@latest init --force` to pull latest configuration files. Existing files are backed up automatically.
* **From v1.x**: See the [Migration Guide](/migration-guide) for the upgrade path.
* **Fresh install**: Simply run `npx multimodel-dev-os@latest init` — no prior setup required.
