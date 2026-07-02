# Project Memory

> Persistent context that AI agents carry across sessions.
> Update this file as the project evolves. Keep it under 200 lines.

## Architecture Decisions

<!-- Record key decisions so agents don't re-debate them -->

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-19 | Modular src/ layout (v3.1.0) | Maintainability + testability over single-file monolith |
| 2026-06-19 | esbuild for single-file dist (v3.1.0) | Zero-runtime-dep bundle, deterministic builds |
| 2026-06-19 | HMAC-SHA256 for registry signing (v3.5.0-prep) | No external PKI/GPG; Node built-in crypto only; project-scoped key |
| 2026-06-19 | Lockfile separate from sources.yaml (v3.5.0-prep) | Clear separation: sources.yaml = config, registry-lock.json = provenance |
| 2026-06-19 | timingSafeEqual for signature compare (v3.5.0-prep) | Prevents timing-based side-channel attacks |
| 2026-06-20 | Ed25519 Asymmetric Signatures (v3.5.0-prep Sprint 2) | Provides public-key trust boundary, avoiding private key disclosures. |
| 2026-06-20 | Trust Store Configuration (v3.5.0-prep Sprint 2) | Local key-based mapping of trusted keys and publishers with scope filters. |
| 2026-06-20 | Canonical payload via recursive sorting (v3.5.0-prep) | Guarantees stable JSON representations independent of property order. |
| 2026-06-20 | Structured Verdict Reporting (v3.5.0-prep Sprint 3) | Standardizes verification status output across CLI, lockfile, and audit logs. |
| 2026-06-20 | Offline E2E Signed Fixtures (v3.5.0-prep Sprint 3) | Validates edge cases without hitting live remote servers. |
| 2026-07-02 | GPG signature verification (v3.5.0-prep Sprint 4) | Extends policy engine to verify GPG signatures in isolated temp directories |
| 2026-07-02 | Remote Key Sync subcommand (v3.5.0-prep Sprint 4) | Enables CLI-driven automatic synchronization of remote-sourced trusted public keys |

## Key Patterns

<!-- Patterns agents should follow consistently -->

- All signing/verification uses Node.js built-in `crypto` — zero runtime deps
- Registry signing key lives in `.ai/registry-signing-key` (gitignored, 0o600 permissions)
- Lockfile `.ai/registry-lock.json` is committed to VCS (tamper evidence)
- CLI handlers follow the pattern: validate → check policy → check --approved → execute
- `src/` modules are pure ES modules bundled by `scripts/build-cli.js` into `bin/`
- `scripts/verify.js` must be expanded with assertions for every new module/test file added

## Known Issues

<!-- Gotchas, workarounds, and technical debt -->

- Signing key rotation invalidates all lockfile signatures — users must re-sync after keygen --force
- `.gitignore` patterns for `.ai/registry-signing-key` use exact path (not wildcard)
- On Windows, `chmodSync` to `0o600` is a no-op — key security relies on gitignore there

## Environment Notes

<!-- Environment-specific context (OS quirks, CI setup, etc.) -->

- OS: Windows (development), Ubuntu + macOS (CI matrix)
- CI: GitHub Actions, Node 20.x and 22.x
- Hosting: npm registry (manual publish only — no CI auto-publish)

## Session Notes

<!-- Recent session summaries — newest first, keep last 5 -->

### Session: Sprint E — Handler Unit Test Coverage (v4.0 Hardening)
**Date:** 2026-07-02
**Agent:** Antigravity
**Summary:** Implemented comprehensive unit test coverage for the core analysis module and all 9 decomposed command handlers (registry, inspection, workflow, improve, memory, feedback, handoff, plugin, catalog) under tests/unit/ and tests/unit/handlers/. Mocked file system configurations, process.exit triggers, console log outputs, and argv arguments. Verified fresh builds, ran the expanded test suite (206/206 unit tests passed), and executed the strict verification pipeline (305/305 checks passed). Staged and committed changes locally.
**Files changed:** tests/unit/analysis.test.js, tests/unit/handlers/catalog.test.js, tests/unit/handlers/feedback.test.js, tests/unit/handlers/handoff.test.js, tests/unit/handlers/improve.test.js, tests/unit/handlers/inspection.test.js, tests/unit/handlers/memory.test.js, tests/unit/handlers/plugin.test.js, tests/unit/handlers/registry.test.js, tests/unit/handlers/workflow.test.js

### Session: Sprint B Phase 6 — final CLI Decomposition & Architecture Hardening (Sprint C & D)
**Date:** 2026-07-02
**Agent:** Antigravity
**Summary:** Decomposed the remaining large handler monoliths: registry.js (1,336 LOC) and inspection.js (998 LOC). Extracted their commands into modular handlers (registry/crud.js, registry/sync.js, registry/signing.js, registry/trust.js, inspection/verify.js, inspection/doctor.js, inspection/validate.js, inspection/scan.js). Refactored original handlers into clean re-export barrel files to maintain 100% backward compatibility. Verified build freshness and ran full test/verification suites (141 tests, 305 checks passed).
**Files changed:** src/cli/handlers/registry.js, src/cli/handlers/inspection.js, src/cli/handlers/registry/crud.js, src/cli/handlers/registry/sync.js, src/cli/handlers/registry/signing.js, src/cli/handlers/registry/trust.js, src/cli/handlers/inspection/verify.js, src/cli/handlers/inspection/doctor.js, src/cli/handlers/inspection/validate.js, src/cli/handlers/inspection/scan.js

### Session: v3.5.0-prep Sprint 4 — Trust Store Remote Key Sync & GPG Signatures
**Date:** 2026-07-02
**Agent:** Antigravity
**Summary:** Implemented remote key synchronization (`registry trust sync` CLI subcommand) and integrated GPG signature verification into the policy and signing engine. Added GPG parsing and system execution wrapper with isolated local homedirs and environment test mocking. Resolved ESM static named import mocking collision in Vitest by introducing global `vi.mock('https')` setup and mocked request/response stubs. Updated build safety verification script to support esbuild variable/named-import renaming (e.g. `execFileSync` to `execFileSync3`). Verified that all 141 tests and 305 verification audit checks pass cleanly.
**Files changed:** src/registry/signing.js, src/registry/trust-store.js, src/cli/handlers/registry.js, src/cli/main.js, src/cli/help.js, scripts/verify.js, tests/unit/registry-policy.test.js, tests/unit/build-output.test.js, tests/unit/registry-signing.test.js, tests/unit/registry-trust-store.test.js

### Session: v3.5.0-prep Sprint 3 — Signed Registry E2E Fixtures + Release Readiness
**Date:** 2026-06-20
**Agent:** Antigravity
**Summary:** Implemented `src/registry/verdict.js` module for structured trust verdicts. Created offline E2E signed registry fixtures covering valid, tampered, wrong key, revoked key, unsigned remote, and unsupported algorithm states. Deployed comprehensive E2E tests in `tests/unit/registry-e2e-signature-fixtures.test.js` validating signature blocks, trust store loading, policies, and CLI subprocess outputs. Added threat model `docs/security-threat-model.md` and release readiness checklist `docs/v3.5.0-readiness.md`. Fully updated all verification scripts and sitemaps. All 113 unit tests and 305 verification audit checks pass cleanly.
**Files changed:** src/registry/verdict.js (new), tests/fixtures/signed-registries/* (new), tests/unit/registry-e2e-signature-fixtures.test.js (new), docs/security-threat-model.md (new), docs/v3.5.0-readiness.md (new), src/cli/main.js, scripts/verify.js, docs/.vitepress/config.js, docs/public/sitemap.xml, docs/public/llms.txt, docs/public/llms-full.txt, docs/registry-security.md, docs/registry-signing.md, CHANGELOG.md

### Session: v3.5.0-prep Sprint 2 — Public-Key Registry Signatures + Trust Store
**Date:** 2026-06-20
**Agent:** Antigravity
**Summary:** Implemented Ed25519 signing support, trusted-keys schema, trust store validator/loader, policy configuration updates, lockfile entries with detailed trust/signature verdicts, `registry trust list/show` subcommands, 3 new unit test suites (public-signing, trust-store, signature-policy), and release audit assertions. Verified that all 98 unit tests and 297 release verification checks pass cleanly.
**Files changed:** src/registry/signing.js, src/registry/trust-store.js (new), .ai/registries/trusted-keys.yaml (new), .ai/schema/trusted-keys.schema.json (new), .ai/schema/registry-manifest.schema.json, src/core/policy.js, .ai/policies/registry-policy.yaml, .ai/schema/registry-policy.schema.json, src/registry/provenance.js, src/cli/main.js, src/cli/help.js, scripts/verify.js, tests/unit/registry-public-signing.test.js (new), tests/unit/registry-trust-store.test.js (new), tests/unit/registry-signature-policy.test.js (new), docs/registry-signing.md (new), docs/registry-trust-store.md (new), docs/registry-security.md, docs/trusted-registries.md, docs/registry-policy.md, docs/architecture.md, docs/registry-sync.md, docs/package-safety.md, docs/v3-roadmap.md, docs/testing.md, CHANGELOG.md

