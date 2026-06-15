# Demo: Release Check

> **Who**: Maintainers preparing a release or contributors validating their PR.
> **Time**: ~1 minute | **Prerequisites**: Node.js 18+, a MultiModel Dev OS workspace

---

## Starting State

You've made changes to your MultiModel Dev OS workspace and want to verify everything is healthy before committing or publishing.

---

## Workflow

### Step 1: Run the verification suite

```bash
npx multimodel-dev-os@latest verify
```

**What happens**: Runs 214+ structural assertions checking:
- All required files exist (root contracts, adapters, templates, schemas, docs)
- YAML registries parse correctly with expected root keys
- Package.json version matches CLI output
- npm pack dry-run reports correct version
- No runtime files (memory, feedback, proposals) are committed

**Expected output**:
```
  ✓ AGENTS.md
  ✓ MEMORY.md
  ...
  ✓ package.json version is valid: 2.7.0
  ✓ CLI help displays v2.7.0
  ✓ npm pack --dry-run reports version 2.7.0
  ✓ No runtime proposals committed

  Pass: 213  Fail: 0  Warn: 0  Total: 213
```

### Step 2: Run the release doctor

```bash
npx multimodel-dev-os@latest doctor --release
```

**What happens**: Checks version alignment across `package.json`, `install.sh`, and `install.ps1`. Warns about blacklisted files (like `.npmrc`) in the package root.

**Expected output**:
```
🩺 Running release audit doctor
  ✓ package.json version: 2.7.0
  ✓ scripts/install.sh version aligns: 2.7.0
  ✓ scripts/install.ps1 version aligns: 2.7.0
```

### Step 3: Build the docs

```bash
npm run docs:build
```

**What happens**: Compiles the VitePress documentation site. Catches broken links, missing assets, and template errors.

### Step 4: Dry-run the npm package

```bash
npm pack --dry-run
```

**What happens**: Shows exactly what files would be included in the npm tarball without actually creating it. Verify no secrets, caches, or development artifacts are included.

### Step 5: Test CLI commands

```bash
npx multimodel-dev-os@latest --help
npx multimodel-dev-os@latest doctor --onboarding
npx multimodel-dev-os@latest doctor --intelligence
```

---

## What Gets Created

Nothing — all commands in this demo are read-only diagnostic checks.

---

## Safety Notes

- **Every command is read-only** — no files are created, modified, or deleted
- The verification suite has a non-zero exit code on failure, making it CI-compatible
- `npm pack --dry-run` does not create a tarball file
- `docs:build` outputs to `docs/.vitepress/dist/` which is gitignored

---

## Cleanup

No cleanup needed — this demo creates no files.

---

## Next Steps

- **Commit your changes**: `git add . && git commit -m "your message"`
- **Create a release**: Follow the [Distribution Guide](/distribution)
- **Publish to npm**: Follow the [NPM Publishing Runbook](/npm-publishing)
