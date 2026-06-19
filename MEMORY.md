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

### Session: v3.5.0-prep Sprint 2 — Public-Key Registry Signatures + Trust Store
**Date:** 2026-06-20
**Agent:** Antigravity
**Summary:** Implemented Ed25519 signing support, trusted-keys schema, trust store validator/loader, policy configuration updates, lockfile entries with detailed trust/signature verdicts, `registry trust list/show` subcommands, 3 new unit test suites (public-signing, trust-store, signature-policy), and release audit assertions. Verified that all 98 unit tests and 297 release verification checks pass cleanly.
**Files changed:** src/registry/signing.js, src/registry/trust-store.js (new), .ai/registries/trusted-keys.yaml (new), .ai/schema/trusted-keys.schema.json (new), .ai/schema/registry-manifest.schema.json, src/core/policy.js, .ai/policies/registry-policy.yaml, .ai/schema/registry-policy.schema.json, src/registry/provenance.js, src/cli/main.js, src/cli/help.js, scripts/verify.js, tests/unit/registry-public-signing.test.js (new), tests/unit/registry-trust-store.test.js (new), tests/unit/registry-signature-policy.test.js (new), docs/registry-signing.md (new), docs/registry-trust-store.md (new), docs/registry-security.md, docs/trusted-registries.md, docs/registry-policy.md, docs/architecture.md, docs/registry-sync.md, docs/package-safety.md, docs/v3-roadmap.md, docs/testing.md, CHANGELOG.md

### Session: v3.5.0-prep — Registry Signing + Provenance
**Date:** 2026-06-19
**Agent:** Antigravity
**Summary:** Implemented HMAC-SHA256 registry signing foundation. Deployed provenance.js + signing.js modules, registry keygen + lock subcommands, lockfile writes in sync, provenance checks in verify, 33 new unit tests, 15+ new verify.js assertions, docs/registry-security.md signing section. 287 verify assertions pass, 78 unit tests pass.
**Files changed:** src/registry/provenance.js (new), src/registry/signing.js (new), src/cli/main.js, src/core/policy.js, .ai/policies/registry-policy.yaml, .gitignore, scripts/verify.js, docs/registry-security.md, CHANGELOG.md, tests/unit/registry-provenance.test.js (new), tests/unit/registry-signing.test.js (new)

