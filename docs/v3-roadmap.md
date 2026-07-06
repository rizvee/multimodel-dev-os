# MultiModel Dev OS — Roadmap: v3.x

This document outlines the development path, completed milestones, and future plans for MultiModel Dev OS.

---

## 1. Current Status

> [!IMPORTANT]
> **v4.0.0 is released on npmjs.** The public release completes the modular CLI, verification engine, registry trust, and documentation hardening work.

---

## 2. Completed Milestones

### v4.0.0 — Modular CLI + Verification Engine Production Hardening ✅
- **CLI Handler Decomposition**: Main routing, registry handlers, and inspection handlers are split into focused internal modules while preserving public commands and outputs.
- **Verification Engine Decomposition**: The strict release audit is organized under `scripts/verify/` with a thin wrapper at `scripts/verify.js`.
- **Registry Trust Hardening**: Trust store, remote key workflows, signing, and provenance safety checks are production-hardened.
- **Handler-Level Tests**: 206 tests across 24 test files protect the decomposed handlers and registry safety behavior.
- **Published Package**: `multimodel-dev-os@4.0.0` is available on npmjs. The optional GitHub Packages mirror is supported through a manual workflow.

### v3.5.0 — Trusted Registry Signing + Provenance ✅
- **Asymmetric Ed25519 Signatures**: Cryptographic verification of remote registry manifests using publisher public keys to secure remote sync.
- **Trusted Key Store**: Manages active public keys, publishers, and scopes via `.ai/registries/trusted-keys.yaml` configuration.
- **Registry Provenance Lockfile**: Keeps a committed `.ai/registry-lock.json` containing synced hashes, timestamps, and verdicts to detect local cache tampering.
- **Structured Verdicts**: Deployed `createTrustVerdict` to generate uniform verification reporting for CLI audits, lockfiles, and diagnostics.
- **Signed Registry E2E Fixtures**: Comprehensive offline test suite validating valid, tampered, wrong key, revoked key, unsigned, and unsupported algorithm states.

### v3.2.0 — Stable Modular Build + Package Governance ✅
- **Build Freshness Auditing**: Integrated `check-build-fresh.js` to ensure the generated single-file CLI binary matches standard ES modules under `src/` dynamically.
- **Hardened Package Governance**: Configured the NPM manifest (`package.json`) to include the modular source folder (`src/`) and unit test suites (`tests/unit/`) for developer auditability, while verifying the strict exclusion of sensitive and temporary files.
- **Cross-Platform CI Pipeline**: Configured a complete multi-platform CI verification matrix on GitHub Actions covering Windows, Linux, and macOS across Node.js versions `20.x` and `22.x`.
- **Harden Build & Verification Gates**: Applied post-build validations asserting shebang count uniqueness, warning headers, and URL shell-injection safety, while expanding integration audits to 269 assertions.

### v3.1.0 — Modular Source Layout + Formal Unit Tests ✅
- **Modular Source Layout**: Refactored the monolithic CLI structure into isolated, clean modules under `src/` (core, registry, catalog, plugin, cli).
- **Programmatic Compiler**: Programmed `scripts/build-cli.js` using `esbuild` to compile modules into a single zero-dependency executable (`bin/multimodel-dev-os.js`) with shebang preservation.
- **Formal Unit Testing**: Integrated `vitest` unit test suites covering isolated YAML parsing, registry URL validation, policy checks, path safety boundaries, plugin manifest validations, and prepublish guard checks.
- **Improved Integration Verification**: Hooked the unit test runner and build step directly into the release audit `npm run verify` verification gate.

### v3.0.2 — Registry Sync Security Hotfix ✅
- **Registry Sync Command Injection Remediation**: Replaced shell-based URL interpolation in fetch helper with safe process arguments passed via `execFileSync`.
- **Strict URL Validation**: Implemented strict syntax checks using `new URL()` and HTTPS-only transport requirements.
- **Diagnostics Security**: Hardened URL validations on diagnostics commands (`registry show` and `registry verify`).
- **HTTP localhost Exception**: Added the `allow_http_localhost` policy flag to optionally support local HTTP development testing.

### v3.0.1 — Registry UX & Policy Safety Patch ✅
- **Registry Command UX**: Improved formatting and next-step actions for `registry status`, `registry list`, `registry show`, `registry verify`, and `registry sync`.
- **Policy Safety Messaging**: Clarified sandboxing, offline verification capabilities, checksum verification, and approval gates.
- **Safety Hardening**: Explicitly documented remote registry sync boundaries (offline verify, no automated installs, path sandboxing, zero shell/code execution from catalogs).
- **Cleanup**: Purged local build artifacts, logs, and unused stubs.

### v3.0.0 — Trusted Remote Catalog & Registry Governance ✅
- **Trusted Remote Registry Sync**: Introduced the `registry` CLI command suite allowing users to optionally sync remote catalogs (`list`, `add`, `remove`, `sync`, `status`, `verify`, `show`, `cache clear`).
- **Declarative Security Policy Engine**: Implemented `.ai/policies/registry-policy.yaml` governing remote registries, with opt-in defaults, permitted write directories, blocked file paths, size limits, allowed extensions, and registry trust levels.
- **SHA256 Integrity Verification**: Standardized SHA256 integrity verification inside registry manifest files, verified on sync and installation, using Node's native `crypto` module.
- **Source-Aware Catalog Loading**: Extended `loadCatalog` and existing `catalog` commands with `--source` and `--all-sources` flags, ensuring seamless prioritization across bundled, local, and synced remote registries.
- **TUI Dashboard Integration**: Added a read-only "Registry Sources & Cache" submenu to the dashboard.
- **Zero-Dependency Core**: Deployed the remote integration layer natively using Node's built-in modules (`https`, `crypto`, `fs`, `path`).

### v2.9.0 — Local Workflow Marketplace & Plugin Catalog ✅
- **Workflow Marketplace**: Curated index catalog packaging 6 first-party plugins for Git, SEO, WordPress, Next.js, E-commerce, and releases.
- **Catalog CLI Commands**: Added `catalog list`, `catalog search`, `catalog show`, `catalog categories`, `catalog recommend`, `catalog install`, and `catalog status` to the zero-dependency CLI.
- **Recommendation Engine**: Automatically ranks and recommends marketplace plugins using package scripts, frameworks, languages, and repo type heuristics.
- **TUI Dashboard Integration**: Integrated read-only catalog actions (list, search, recommend, status) directly into the interactive command center.

### v2.8.0 / v2.8.1 — Interactive TUI Dashboard & Plugin Hooks ✅
- **Interactive TUI Dashboard**: Added `dashboard`/`ui` command launching a zero-dependency keyboard-interactive command center built with Node's native `readline` module.
- **Declarative Plugin Hooks**: Added `plugin` command suite (`list`, `show`, `validate`, `install`, `status`) and JSON schema to securely extend workspace templates, workflows, and skills.
- **Secure Plugin Installer**: Supports `--approved` execution gate, path whitelisting to `.ai/` and `adapters/` directories, and automatic conflict `.bak` backups.
- **Path Traversal Hardening**: Enforce alphanumeric slug checks (`/^[a-z0-9-_]+$/i`) and pattern validation bounds to block traversal vectors.

### v2.0.0 → v2.7.0 — Core Foundation ✅
- Unified autonomous co-pilot adapters and root contracts.
- Codebase scanner (`scan`) and hash-compressed memory engine (`memory build`).
- Feedback learning (`feedback add`) and proposal engine (`improve propose` / `apply`).
- Interactive demo workflow pages and website distribution system.

---

## 3. Publishing Workflow

All releases follow this strict publishing checklist:

1. Bump version in `package.json`
2. Run `npm run verify` (current verification checks must pass)
3. Run `npm run docs:build` to verify documentation
4. Run `npm pack --dry-run` to review package hygiene
5. Set `MMDO_ALLOW_PUBLISH=true` and publish manually:
   ```bash
   MMDO_ALLOW_PUBLISH=true npm publish --access public
   ```

---

## 4. Next Planning Target: v4.1+
- **Post-release polish**: Continue package footprint review, contributor docs refinement, and optional registry workflow ergonomics after v4.0.0 is published.

---

## 5. Future Plan: v4.1+ — Unified Autonomous Co-Pilot Ecosystem

*   **Full Multi-Agent Orchestration**: Dynamic task handoffs between specialized agents.
*   **Real-Time Collaboration**: Live workspace state sharing between agents and developers.
*   **Cloud-Native Intelligence**: Optional cloud-backed memory and feedback aggregation.

---

## 6. Migration Notes

* **From any v3.x or v2.x**: Run `npx multimodel-dev-os@latest init --force` to pull the latest configuration files. Existing files are backed up automatically as `.bak`.
* **From v1.x**: See the [Migration Guide](/migration-guide) for the upgrade path.
* **Fresh install**: Simply run `npx multimodel-dev-os@latest init` — no prior setup required.
