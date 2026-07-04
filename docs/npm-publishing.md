# npm & npx Publishing Guide

> Operational runbook for packaging, testing, publishing, and maintaining the `multimodel-dev-os` package on the public npm registry.

---

## 1. Local Packaging Integrity Test

Before publishing, always test the built package locally by compiling a compressed tarball:

1. **Build the local tarball archive:**
   ```bash
   npm pack
   ```
   This creates a file named like `multimodel-dev-os-3.5.0.tgz` in your directory root.

2. **Verify bundle contents:**
   Create an empty temporary workspace, extract the tarball, and confirm that only required scaffold folders are included (no `.github/`, test configurations, or local system files):
   ```bash
   mkdir -p /tmp/package-test && cd /tmp/package-test
   tar -xzf /path/to/multimodel-dev-os-3.5.0.tgz
   ls -la package/
   ```

3. **Verify CLI execution from the package:**
   ```bash
   node package/bin/multimodel-dev-os.js --help
   ```

---

## 2. Pre-Flight Publishing Checklist

Execute these validation actions strictly in sequence before triggering a release:

1. **Verify structural health:**
   Ensure all 289 checks in our verification script pass successfully:
   ```bash
   npm run verify
   ```

2. **Login to npm secure registry:**
   ```bash
   npm login
   ```

3. **Dry-run packaging audit:**
   Inspect final bundle metrics and check for unexpected files:
   ```bash
   npm publish --dry-run
   ```

4. **Trigger publication:**
   Once metadata and file exclusions are verified:
   ```bash
   npm publish --access public
   ```

---

## 3. Versioning & Rollback Strategy

* **Semantic Versioning (SemVer) Discipline:**
   * **Patch Release (e.g. 2.0.1):** Backward-compatible bug fixes or documentation updates.
   * **Minor Release (e.g. 2.1.0):** Backward-compatible new features (like new adapter sync mechanisms).
   * **Major Release (e.g. 3.0.0):** Breaking changes to core specification files.

* **Rollback & Deprecation Guidelines:**
   * Since published versions cannot be republished or overwritten, **never unpublish** unless absolutely necessary.
   * If a critical bug is discovered, immediately publish a new patch version (e.g. `v2.0.1`).
   * If a version is broken, flag it as deprecated to inform downstream installers:
     ```bash
     npm deprecate multimodel-dev-os@2.0.0 "Critical bug found, please use v2.0.1 instead."
     ```

---

## 4. Prepublish Safety Guard

> [!IMPORTANT]
> **v3.5.0 is the active stable release.** NPM publishing is live.

### Source vs. Registry Strategy
* **GitHub main branch (Source)**: Contains the current stable `v3.5.0` codebase.
* **npm latest (Registry)**: Pulled and installed globally or via npx.

### Prepublish Safety Guard
To prevent accidental `npm publish` executions on developer environments, a local validation script has been added to package hooks. If you run `npm publish`, it is blocked by default.

To bypass this check during approved release windows:
1. Ensure the version in `package.json` is a valid stable major version >= 2 (e.g., v3.5.0).
2. Run publication with the override env variable:
   ```powershell
   # PowerShell
   $env:MMDO_ALLOW_PUBLISH="true"
   npm publish --access public
   ```
   ```bash
   # Bash
   MMDO_ALLOW_PUBLISH=true npm publish --access public
   ```
