# MultiModel Dev OS — Roadmap: v2.x → v3.0

This document outlines the development path, completed milestones, and future plans for MultiModel Dev OS.

---

## 1. Current Status

> [!IMPORTANT]
> **v2.6.0 is the active stable release** on the public npm registry. All features below marked ✅ are shipped and production-ready.

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

---

## 3. Publishing Workflow

All releases follow this strict publishing checklist:

1. Bump version in `package.json`
2. Run `npm run verify` (214+ assertions must pass)
3. Run `npm run docs:build` to verify documentation
4. Run `npm publish --dry-run` to review package hygiene
5. Set `MMDO_ALLOW_PUBLISH=true` and publish:
   ```bash
   MMDO_ALLOW_PUBLISH=true npm publish --access public
   ```

---

## 4. Upcoming: v2.7.0 — Interactive Dashboard & Plugin Hooks

*   **Interactive TUI Status Dashboard**: Rich terminal UI for `status` and `workflow` commands
*   **Plugin Hook System**: Pre/post hooks for `init`, `scan`, `memory`, and `workflow` commands
*   **Custom Workflow Authoring**: User-defined workflow definitions beyond bundled registries
*   **Adapter Auto-Detection**: Detect installed tools and automatically recommend adapter setup

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
