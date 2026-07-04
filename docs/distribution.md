# Distribution & Release Guide

How to distribute, verify, and publish MultiModel Dev OS releases.

---

## Installation Methods

### NPX (Recommended)

```bash
# Initialize a new workspace
npx multimodel-dev-os@latest init

# Onboard an existing project
npx multimodel-dev-os@latest onboard analyze
```

### Global Install

```bash
npm install -g multimodel-dev-os
multimodel-dev-os init
```

### GitHub Packages Mirror

The primary package identity is `multimodel-dev-os` on npmjs. A scoped GitHub Packages mirror can be published manually as `@rizvee/multimodel-dev-os`:

```bash
npm install -g @rizvee/multimodel-dev-os --registry=https://npm.pkg.github.com
```

See [GitHub Packages Mirror](./github-packages.md) for staging and publication details.

### Fallback Scripts

**macOS / Linux / WSL:**
```bash
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1 | iex
```

---

## Pre-Release Checklist

Before every release, run this complete verification sequence:

### 1. Version Bump

Update version strings in all 7 locations:

| File | Field |
|------|-------|
| `package.json` | `version` |
| `package-lock.json` | `version` (2 occurrences) |
| `scripts/install.sh` | `VERSION` |
| `scripts/install.ps1` | `$Version` |
| `docs/.vitepress/config.js` | `softwareVersion` in JSON-LD |
| `docs/public/llms.txt` | Title version |
| `docs/public/llms-full.txt` | Title version |

### 2. Changelog Entry

Add a new section to `CHANGELOG.md` following the Keep a Changelog format.

### 3. Verification Suite

```bash
# Run 289 structural checks
npm run verify

# Build docs to catch broken links
npm run docs:build

# Dry-run the npm package
npm pack --dry-run

# Verify CLI version
node bin/multimodel-dev-os.js --help

# Release doctor
node bin/multimodel-dev-os.js doctor --release
```

**Expected results:**
- `verify`: 289 pass, 0 fail
- `docs:build`: builds without errors
- `pack --dry-run`: reports correct version in tarball name
- CLI `--help`: shows correct version
- `doctor --release`: version alignment passes

### 4. Commit

```bash
git add .
git diff --cached --stat
git commit -m "docs: release vX.Y.Z [description]"
```

---

## Publishing to npm

> [!WARNING]
> **Manual publish only.** The `prepublish-guard.js` script blocks accidental publishes. You must explicitly set the environment variable.

```bash
# Set the publish guard
export MMDO_ALLOW_PUBLISH=true   # bash
$env:MMDO_ALLOW_PUBLISH = "true" # PowerShell

# Publish to npm
npm publish --provenance --access public
```

### Post-Publish Smoke Test

After publishing, verify the package works correctly:

```bash
# Create a temp directory
mkdir /tmp/mmdo-smoke && cd /tmp/mmdo-smoke

# Test npx execution
npx multimodel-dev-os@latest --help
npx multimodel-dev-os@latest init --dry-run

# Verify version matches
npx multimodel-dev-os@latest doctor --release

# Cleanup
cd .. && rm -rf /tmp/mmdo-smoke
```

---

## Package Hygiene

### What's Included in the Tarball

The `files` field in `package.json` controls what ships:

```
AGENTS.md, MEMORY.md, TASKS.md, RUNBOOK.md
.ai/          → Configuration, schemas, registries, templates
adapters/     → IDE/tool adapter files
scripts/      → Install scripts, verify scripts
docs/         → Documentation source (excluding .vitepress/dist/ and cache/)
examples/     → Template examples
bin/          → CLI executable
assets/       → Visual assets
```

### What's Excluded

- `node_modules/` — dev dependencies only
- `docs/.vitepress/dist/` — built docs (deployed separately via GitHub Pages)
- `docs/.vitepress/cache/` — build cache
- `.ai/intelligence/` runtime files — memory, feedback, proposals
- `.npmrc` — local registry/auth configuration must not be committed or packaged

---

## GitHub Releases

After publishing to npm:

1. Tag the commit: `git tag vX.Y.Z`
2. Push tags: `git push origin main --tags`
3. Create a GitHub Release from the tag
4. Copy the changelog entry as the release body
5. Verify the GitHub Pages deployment triggered

---

## Prepublish Guard

The [prepublish-guard.js](../scripts/prepublish-guard.js) script runs automatically before `npm publish`. It:

1. Checks for `MMDO_ALLOW_PUBLISH=true` environment variable
2. If not set, prints a warning and exits with code 1
3. Prevents accidental publishes from CI or local dev environments

This guard ensures every publish is an intentional, reviewed action.

---

## Version Alignment

The `doctor --release` command verifies version parity across:
- `package.json`
- `scripts/install.sh`
- `scripts/install.ps1`

Any mismatch is reported as a warning. Fix alignment before publishing.
