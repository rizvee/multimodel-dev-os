# Runbook

> Operational procedures for development setup, testing, packaging, and rollback.
> AI agents reference this before executing critical operations.

## Environment Setup

<!-- Steps to set up a development environment from scratch -->

```bash
# 1. Clone the repo
git clone <repo-url>
cd multimodel-dev-os

# 2. Install dev dependencies
npm install

# 3. Build the CLI binary
npm run build

# 4. Run tests
npm test
```

## Deploy / Release

As this is a local CLI utility distributed via npm, deployment is done by compiling the binary and publishing to npm.

| Step | Command | Notes |
|------|---------|-------|
| 1 | `npm run verify` | Runs unit tests, generated CLI freshness check, and strict code validations |
| 2 | `$env:MMDO_ALLOW_PUBLISH="true"; npm publish` | Set environment variable to bypass prepublish-guard |

## Rollback

To roll back a released npm package or local commit:

```bash
# Deprecate the broken package version on npm
npm deprecate multimodel-dev-os@<version> "Deprecation message detailing reason"

# Revert local repository main branch to last stable tag
git reset --hard v3.5.0
```

**Last known good release tag:** `v3.5.0`

## Health Checks

Run diagnostics to verify CLI health:

| Check | Command | Expected |
|-------|-------------|----------|
| CLI Help / Version | `node bin/multimodel-dev-os.js --help` | Prints help text displaying current version |
| Registry Policy Engine | `node bin/multimodel-dev-os.js registry status` | Shows correct policy state and configuration values |
| Trust Store Integrity | `node bin/multimodel-dev-os.js registry trust verify` | Validates all trusted public key formats in the store |
| Strict Audit Check | `npm run verify` | Completes successfully with 0 failures |

## Secrets & Config

| Secret | Location | Rotation |
|--------|----------|----------|
| Project Registry Sync Key | `.ai/registry-signing-key` | Run `registry keygen --approved --force` |
| npm Publish Token | `~/.npmrc` or user environment | Managed in npmjs.com account settings |

