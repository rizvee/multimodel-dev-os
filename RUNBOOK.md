# Runbook

> Public operations template for MultiModel Dev OS workspaces.

Document repeatable setup, validation, packaging, and recovery procedures here.
Keep maintainer-only release tokens, private npm instructions, local paths,
and incident scratch notes in an ignored private workspace.

## Environment Setup

```bash
npm install
npm run build
npm test
```

## Validation

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Build | `npm run build` | CLI bundle is regenerated from source |
| Build freshness | `npm run check:build` | Generated binary matches source |
| Tests | `npm test` | Unit and integration tests pass |
| Verification | `npm run verify` | Repository verification passes |
| Docs | `npm run docs:build` | Documentation builds without errors |

## Packaging

```bash
npm pack --dry-run
```

Confirm the package contains intended product files and excludes private
workspace state such as `.env`, `.npmrc`, local logs, traces, and session
transcripts.

## Release

Release publishing is a maintainer-controlled action. Do not store publish
tokens or one-off approval state in this file.

## Rollback

Document project-specific rollback procedures after they are reviewed and safe
to share publicly.

## Secrets and Local State

- Keep `.env`, `.npmrc`, signing keys, runtime logs, traces, and metrics out of Git.
- Keep private prompts, session logs, and implementation notes in ignored local directories.
