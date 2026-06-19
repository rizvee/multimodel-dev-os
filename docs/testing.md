# MultiModel Dev OS — Testing Guide (v3.2.0+)

This document outlines the testing strategy, tools, and execution processes for MultiModel Dev OS.

---

## 1. Testing Architecture

MultiModel Dev OS implements a two-tier testing strategy to ensure safety, correctness, and compatibility:

```
┌──────────────────────────────────────────────────────────┐
│              Tier 1: Unit Tests (Vitest)                 │
│  Validates parser logic, URL rules, path safety, and    │
│  manifest schemas in isolation.                          │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│          Tier 2: Release Verification (Verify.js)        │
│  Executes integration checks, CLI commands, packaging    │
│  pre-flights, and repository structure audits.           │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Tier 1: Unit Testing (Vitest)

Unit tests target pure logic and utility functions to verify behavior under edge cases. The test suite is powered by **Vitest** and located under `tests/unit/`.

### Run Unit Tests
```bash
npm test
```

### Coverage Areas

1. **YAML Parser Flow (`tests/unit/yaml.test.js`)**
   - Stripping comments outside quotes.
   - Flow arrays (`["item1", "item2"]`).
   - Quoted booleans/numbers type preservation.
   - Malformed YAML error handling.

2. **Registry URL Validation (`tests/unit/registry-url-validation.test.js`)**
   - Rejects non-HTTPS protocols (except localhost/127.0.0.1 under policy).
   - Rejects URLs containing quotes, backticks, or shell injection characters.
   - Rejects credential embedding in URLs.

3. **Registry Policy Rules (`tests/unit/registry-policy.test.js`)**
   - Correct default policy initialization.
   - Verification of `allow_remote_registries`, `allowed_write_roots`, and `blocked_paths`.

4. **Path & Sandbox Safety (`tests/unit/path-safety.test.js`)**
   - Rejects path traversal (`../`).
   - Rejects blocked files (`.env`, `package.json`).
   - Ensures writes are restricted to whitelisted boundaries.

5. **Plugin Manifest Validation (`tests/unit/plugin-manifest.test.js`)**
   - Asserts required keys (`name`, `slug`, `version`, `author`, `description`).
   - Validates alphanumeric slugs.
   - Verifies sandboxed path prefixes (`.ai/` and `adapters/`).

6. **Prepublish Guard Logic (`tests/unit/prepublish-guard.test.js`)**
   - Asserts that publishing blocks without `MMDO_ALLOW_PUBLISH=true`.
   - Permits stable major versions >= 2.

---

## 3. Tier 2: Release Verification Audit

The release verification script (`scripts/verify.js`) checks that the codebase matches packaging rules, CLI commands execute cleanly, and no temporary development artifacts are committed.

### Run Verification Audit
```bash
# Deploys build step, executes unit tests, and runs integration verification
npm run verify
```

### Key Audit Gates
- **Structure Check**: Verifies presence of all required configuration, documentation, templates, and adapter files.
- **CLI Help**: Asserts that `node bin/multimodel-dev-os.js --help` outputs the correct version and all available commands.
- **TUI Dashboard Dry-Run**: Validates that `--dry-run` and `--list-actions` flags execute without TTY dependencies.
- **Catalog Integrities**: Scans and validates all bundled catalog plugin manifests.
- **Security Hotfix Verifications**: Bypasses and checks that registry sync url checks prevent shell escapes.

---

## 4. Build System Testing

Since version `v3.1.0` introduces a modular source layout under `src/`, development happens in modules and is compiled into a single executable `bin/multimodel-dev-os.js`.

### Run Build Step
```bash
npm run build
```

The build runner uses `scripts/build-cli.js` (powered by `esbuild` in devDependencies) to bundle source modules programmatically while preserving shebang, execution permissions, and adding a warning header.

---

## 5. Tarball Smoke Testing

To ensure the npm package functions flawlessly after installation, we run a local tarball smoke test:

1. **Pack the release package**:
   ```bash
   npm pack
   ```
2. **Setup a clean test directory**:
   ```bash
   mkdir C:\mmdo-smoke-test
   cd C:\mmdo-smoke-test
   npm init -y
   ```
3. **Install the generated tarball locally**:
   ```bash
   npm install F:\multimodel-dev-os\multimodel-dev-os-3.2.0.tgz --no-audit --no-fund
   ```
4. **Validate npx invocation**:
   ```bash
   npx multimodel-dev-os --help
   npx multimodel-dev-os doctor
   ```

---

## 6. Maintainer Guidelines

For contributors and maintainers modifying the codebase:
1. **Always edit source modules** located under `src/`. Do NOT make manual edits to `bin/multimodel-dev-os.js` directly, as it will be overwritten during compilation.
2. **Execute the build script** via `npm run build` after completing modifications to compile the single-file binary.
3. **Execute Vitest unit tests** (`npm test`) to ensure all core modules pass verification gates in isolation.
4. **Execute release verification** (`npm run verify`) to run the strict verification pipeline (250+ assertions check compiled binary, folder layouts, sitemaps, etc.).
