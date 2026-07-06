# Project Memory

> Persistent project context for maintainers and compatible coding agents.

## Architecture Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-19 | Modular `src/` layout | Maintainability and testability over a single-file source monolith |
| 2026-06-19 | esbuild for single-file CLI output | Zero-runtime-dependency bundle with deterministic builds |
| 2026-06-19 | HMAC-SHA256 for local registry signing | Uses Node built-in crypto for project-scoped provenance |
| 2026-06-19 | Registry lockfile separate from `sources.yaml` | Keeps source configuration separate from tamper-evident provenance |
| 2026-06-19 | `timingSafeEqual` for signature comparison | Reduces timing side-channel risk |
| 2026-06-20 | Ed25519 publisher signatures | Allows public-key verification without exposing private keys |
| 2026-06-20 | Trusted key store configuration | Maps trusted keys and publishers with scope filters |
| 2026-06-20 | Canonical payload via recursive sorting | Guarantees stable JSON signing payloads independent of property order |
| 2026-06-20 | Structured verdict reporting | Standardizes trust status across CLI output, lockfiles, and audit logs |
| 2026-06-20 | Offline signed-registry fixtures | Validates signature edge cases without live remote servers |
| 2026-07-02 | GPG-compatible signature verification | Extends policy checks using isolated temporary GPG home directories |
| 2026-07-02 | Remote key sync subcommand | Enables controlled synchronization of remote-sourced trusted public keys |
| 2026-07-05 | Optional GitHub Packages staging | Mirrors the npm payload under a scoped package name without changing npm identity |
| 2026-07-07 | Skill OS foundation | Adds declarative prompt, skill, permission, guardrail, workflow, and operator-template metadata with validation and read-only inspection |

## Key Patterns

- Runtime code uses Node.js built-ins only; package runtime dependencies remain zero.
- Registry signing keys live in `.ai/registry-signing-key` and must stay gitignored.
- `.ai/registry-lock.json` is committed for tamper-evident registry provenance.
- CLI handlers follow the pattern: validate, check policy, require `--approved` for writes, then execute.
- Source modules under `src/` are bundled by `scripts/build-cli.js` into `bin/`.
- `bin/multimodel-dev-os.js` is generated output; edit source files instead.
- Runtime memory, feedback, handoff, proposal, and registry-cache files stay ignored unless explicitly documented as product templates.

## Release Notes

- v4.0.0 prepares the modular CLI architecture, decomposed verification engine, registry signing and provenance hardening, handler-level test coverage, and public documentation cleanup.
- v4.1.0 prepares the Skill OS foundation: RACE+ prompts, skill registries, tool permission metadata, advisory guardrails, workflow `skill_os` metadata, draft-only business operator templates, read-only CLI inspection, and migration docs.
- Skill OS metadata remains declarative; it does not execute automation, enforce permissions at runtime, or make advisory guardrails block live commands.
- npm publishing is manual and guarded by `scripts/prepublish-guard.js`.
- GitHub Packages publishing is optional and manual-only through `publish-github-package.yml`.

## Known Issues

- Signing key rotation invalidates existing lockfile signatures; users must re-sync after `registry keygen --force`.
- On Windows, `chmodSync` to `0o600` does not enforce Unix-style permissions; key safety relies on gitignore and OS access controls.

## Environment Notes

- CI runs on GitHub Actions across Windows, Linux, and macOS.
- Supported Node versions in CI are 20.x and 22.x.
- Documentation is built with VitePress and deployed through GitHub Pages.
