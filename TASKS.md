# Tasks

> Lightweight task tracking for AI agents and humans.
> Agents should check this file before starting work. Update status as you go.

## Current Sprint

<!-- Active work items — agents pick from here -->

- [x] Sprint G — Developer Experience + Documentation Hardening
  - [x] Full documentation audit (README, docs/, examples/, MEMORY, TASKS, CHANGELOG)
  - [x] Fix all broken internal doc links
  - [x] Eliminate stale version references in README
  - [x] Add `bugs` and `engines` fields to package.json
  - [x] Create missing `.ai/prompts/compress-context.md`
  - [x] Update CHANGELOG with Sprint F and Sprint G entries
  - [x] Validate: npm run docs:build, npm run verify, npm test

## Backlog

<!-- Upcoming work — not yet started -->

- [ ] Sprint H Planning — Next release roadmap

## In Review

<!-- Completed work awaiting review -->

## Done

<!-- Completed and merged — keep last 10 items, archive the rest -->

- [x] Deployed trust key sync capability from verified remote registries (`registry trust sync` command)
- [x] Supported GPG-compatible signature verification in the policy engine
- [x] Fixed Vitest ESM named imports mocking collision and build-check regex safety rules
- [x] Deployed E2E offline signed registry fixtures and unit test validation suite (`registry-e2e-signature-fixtures.test.js`)
- [x] Implemented verdict module for structured trust verdict reporting (`src/registry/verdict.js`)
- [x] Created Threat Model documentation (`docs/security-threat-model.md`) and v3.5.0 Release Readiness Checklist (`docs/v3.5.0-readiness.md`)
- [x] Deployed Ed25519 public key registry signatures (`src/registry/signing.js`)
- [x] Implemented trusted key store and scope check policies (`src/registry/trust-store.js`)
- [x] Added `registry trust` CLI subcommand suites (`list`, `show <key_id>`, `verify`)
- [x] Configured signature validation rules and policy config schemas (`registry-policy.schema.json`)
- [x] Implemented HMAC-SHA256 registry signing foundation and provenance lockfile (`src/registry/provenance.js`)

