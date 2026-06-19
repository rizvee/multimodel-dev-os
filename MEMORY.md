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

### Session: v3.5.0-prep — Registry Signing + Provenance
**Date:** 2026-06-19
**Agent:** Antigravity
**Summary:** Implemented HMAC-SHA256 registry signing foundation. Added provenance.js + signing.js modules, registry keygen + lock subcommands, lockfile writes in sync, provenance checks in verify, 33 new unit tests, 15+ new verify.js assertions, docs/registry-security.md signing section. 287 verify assertions pass, 78 unit tests pass.
**Files changed:** src/registry/provenance.js (new), src/registry/signing.js (new), src/cli/main.js, src/core/policy.js, .ai/policies/registry-policy.yaml, .gitignore, scripts/verify.js, docs/registry-security.md, CHANGELOG.md, tests/unit/registry-provenance.test.js (new), tests/unit/registry-signing.test.js (new)
