# Package Safety and Security Hygiene

This document defines strict safety guidelines for the MultiModel Dev OS workspace.

## Excluded Items List

To prevent security compromises, credential exposure, or prompt bloating, the following files must **never** be included in git pushes or packaged in NPM releases:

1. **Local Credentials & API Keys:**
   * `.npmrc` (specifically containing authentication tokens)
   * `.env` / `.env.local`
   * `.ai/registry-signing-key` (project-scoped HMAC signing key)
2. **Build and Cache Artifacts:**
   * `node_modules/`
   * `dist/` / `build/`
   * `docs/.vitepress/dist/`
   * `docs/.vitepress/cache/`
3. **Mobile & Android Signing Artifacts:**
   * `*.keystore` / `*.jks` files
   * `google-services.json`
   * `GoogleService-Info.plist`
   * Signing configuration credentials

## Enforcement

The project release audit scripts strictly enforce these checks:
```bash
npm run verify
```
Any violation will cause verification and build pipelines to fail immediately.

## Registry Security Update (v3.0.2)

A security hotfix has been applied in `v3.0.2` to secure the registry synchronization and validation channels:
* **Remediation of Command Injection Risk:** Removed shell-based url interpolation. Sub-process fetches now use safe, argument-based `execFileSync` invocations, isolating URL arguments from evaluated code context.
* **Registry URL Sanitization:** Enforces strict validation of remote registry URLs using Node's `URL` parser. URLs must use HTTPS by default. Control characters, credentials, spaces, quotes, and shell metacharacters are strictly rejected.
* **Upgrade Guidance:** Users running `v3.0.0` or `v3.0.1` must upgrade to `v3.0.2` immediately.
* **Safety Boundaries Preserved:** Remote registries remain disabled by default, sync operations are cache-only (never installing or running plugins), and conflict checks on sensitive files (`.env`, `.npmrc`, package configuration files) are strictly enforced.

## Package Governance Policies

1. **Zero Runtime Dependencies:**
   * The runtime package is strictly zero-dependency to ensure minimal installation footprint and maximum security.
   * All compilation, testing, and dev tools (e.g., `esbuild`, `vitest`, `vitepress`) are restricted to `devDependencies` only.

2. **Open-Source Transparency:**
   * The complete modular source files (`src/`) and testing suites (`tests/`) are intentionally included in the published NPM package, allowing for visual auditing, validation, and debugging.

3. **Manual NPM Publishing Only:**
   * Automated publishing via CI is disabled. NPM publish is performed manually by maintainers using verification guards.

4. **Milestone-Based Releases:**
   * Patch-level releases are kept internal by default for stabilization sprints (such as `v3.2.0-prep`).
   * Public updates are batched into stable, fully-audited milestone releases (e.g., `v3.2.0`). Critical security hotfixes are the only exception.
