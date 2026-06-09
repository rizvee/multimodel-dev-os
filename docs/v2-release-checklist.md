# v2 Release Checklist

Use this checklist to verify compliance before publishing `multimodel-dev-os` to the npm registry.

## Pre-Flight Requirements

- [x] Ensure version string in `package.json` is set to `2.0.1`.
- [x] Verify version strings in documentation and install scripts (`scripts/install.sh`, `scripts/install.ps1`) align with the release.
- [x] Run full release verification:
  ```bash
  npm run verify
  ```
- [x] Run registry checks:
  ```bash
  node bin/multimodel-dev-os.js validate --all-registries
  ```
- [x] Run release doctor:
  ```bash
  node bin/multimodel-dev-os.js doctor --release
  ```

## Packaging Verification

- [x] Execute dry pack run:
  ```bash
  npm pack --dry-run
  ```
- [x] Inspect generated tarball file listing to verify only necessary directories (`.ai/`, `adapters/`, `bin/`, `docs/`, `examples/`, `scripts/`, `assets/`) are included.
- [x] Verify that the prepublish guard is bypassed only for the official production run.
- [x] Confirm no `.env` or sensitive `.npmrc` configurations are packaged.
