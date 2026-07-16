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
| 2026-07-15 | v4.2 development lane | Moves `main` to `4.2.0-dev.0` for Gateway Foundation work while v4.1.0 remains npm latest |
| 2026-07-15 | Gateway runtime registry snapshots | Adds deterministic provider/model/local-model/routing-preset registry snapshots without provider calls, credential reads, live routing, or fallback execution |
| 2026-07-16 | Deterministic gateway routing | Adds dry-run route planning, scoring, fallback planning, and explanations without provider calls, credential reads, model execution, or fallback execution |
| 2026-07-16 | Gateway resilience simulation | Adds deterministic failure classification, retry/backoff/timeout planning, fallback transitions, circuit-breaker simulation, rate-limit/quota planning, and failure-chain explanations without provider calls or real waits |
| 2026-07-16 | Local mock gateway runtime | Adds a localhost-only HTTP runtime for the deterministic mock provider while keeping external providers metadata-only and provider credentials unloaded |
| 2026-07-16 | Gateway client integration planning | Adds preview-only client profiles, endpoint configuration generation, redacted diagnostics, and local mock compatibility tests without installing clients or writing global settings |
| 2026-07-17 | Gateway local observability | Adds bounded in-memory mock-runtime events, traces, usage records, static cost estimates, metrics, and provider health snapshots without telemetry upload, persistent logs, or external provider probes |

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
- v4.2 Gateway Foundation is under development on `main` at `4.2.0-dev.0`; gateway contracts, runtime-readable registry snapshots, deterministic dry-run route planning, resilience simulation, a localhost-only mock gateway runtime, preview-only client integration plans, and bounded local observability exist, but external provider calls, provider credential loading, retry execution, active multi-provider fallback, third-party client execution, telemetry upload, and persistent runtime logging remain disabled.
- npm publishing is manual and guarded by `scripts/prepublish-guard.js`.
- GitHub Packages publishing is optional and manual-only through `publish-github-package.yml`.

## Known Issues

- Signing key rotation invalidates existing lockfile signatures; users must re-sync after `registry keygen --force`.
- On Windows, `chmodSync` to `0o600` does not enforce Unix-style permissions; key safety relies on gitignore and OS access controls.

## Environment Notes

- CI runs on GitHub Actions across Windows, Linux, and macOS.
- Supported Node versions in CI are 20.x and 22.x.
- Documentation is built with VitePress and deployed through GitHub Pages.
