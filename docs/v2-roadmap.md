# MultiModel Dev OS — v2.0.0 Roadmap

This document outlines the development path, stabilization targets, and migration roadmap leading to the `v2.0.0` stable release of MultiModel Dev OS.

---

## 1. Release Objective

The primary goal of the **v2.0.0 release** is to promote the experimental features introduced in `v1.2.0` (Template Galaxy, Model Compatibility Layer, and Android Expo template) into officially frozen, production-grade core components, and resume stable package publication to the public npm registry.

> [!IMPORTANT]
> NPM package publication is strictly **paused** during all `v1.2.x` and `v1.3.x` source-only releases. The next official npm registry update will be `v2.0.0`.

---

## 2. Key Stabilization Targets

### A. Template Galaxy Stabilization
* Standardize the schema for template configurations under `.ai/schema/template.schema.json`.
* Harden the built-in templates (`nextjs-saas`, `wordpress-site`, `ecommerce-store`, `seo-landing-page`, `expo-react-native-android`, `general-app`) to ensure they pass validation checks across diverse OS environments.

### B. Model Registry Stabilization
* Freeze the `.ai/models/` structure:
  * `registry.yaml` — Core provider mappings and model metadata.
  * `providers.yaml` — API endpoint declarations.
  * `routing-presets.yaml` — Optimized task routing configurations.
  * `local-models.yaml` — Offline execution definitions.
* Standardize validation rules inside `validate` and `doctor` commands to verify YAML configuration syntax and compatibility.

### C. Adapter Registry Stabilization
* Freeze `.ai/adapters/registry.yaml`.
* Extend support mapping for emerging developer tools (e.g. Continue, Cline, Roo Code, Aider, Windsurf).
* Ensure cross-linking logic maintains strict custom boundaries so that updates in `AGENTS.md` synchronize with adapter targets without wiping user overrides.

### D. Android Expo Template Stabilization
* Hardening the `examples/expo-react-native-android/` foundation.
* Verify clean execution of EAS Build and environment configurations on local developer machines and CI runner platforms.

### E. CLI Compatibility Pass
* Ensure the new subcommands introduced in `v1.2.0` are fully backward-compatible with `v1.0.0` and `v1.1.0` CLI patterns:
  * `models` / `show-model`
  * `providers`
  * `route-model`
  * `adapters` / `show-adapter`
  * `skills` / `show-skill`
  * `doctor --tokens`
  * `validate --template`

---

## 3. Package Publishing Checklist

Before executing the `v2.0.0` release on the npm registry, the following steps must be completed:

1. [ ] Set version to `2.0.0` in `package.json`.
2. [ ] Ensure `scripts/prepublish-guard.js` allows the publish (since version starts with `2.`).
3. [ ] Run all verification suites:
   ```bash
   npm run verify
   ```
4. [ ] Build documentation static bundles cleanly:
   ```bash
   npm run docs:build
   ```
5. [ ] Perform a dry-run publish to review package hygiene:
   ```bash
   npm publish --dry-run
   ```
6. [ ] Set the required publication environment variable:
   * **PowerShell:** `$env:MMDO_ALLOW_PUBLISH="true"`
   * **Bash:** `export MMDO_ALLOW_PUBLISH=true`
7. [ ] Publish the package to the public registry:
   ```bash
   npm publish --access public
   ```

---

## 4. Migration Notes: npm latest to v2.0.0

* **Direct Upgrades**: Projects running the last stable npm package (e.g., `1.1.0` / `1.0.0`) can migrate to `2.0.0` by executing `npx multimodel-dev-os@latest init --force` or installing the package locally.
* **Registry Coexistence**: During the pause, users requiring the new `v1.2.x` source-only features must clone the GitHub repository and execute the commands locally using:
  ```bash
  node bin/multimodel-dev-os.js init
  ```
  Or verify local packages via:
  ```bash
  npm pack
  ```
* **Configuration Upgrades**: Existing `.ai/` folders can be upgraded by copying the central registries (`.ai/models/` and `.ai/adapters/`) directly from the source templates.

---

## 5. Final Release Gate

The `v2.0.0` release requires:
1. 100% pass rate on all automated linter and verifier checks.
2. Complete documentation updates across all guides and discovery indices.
3. Explicit maintainer sign-off on local testing of the Android Expo template.
