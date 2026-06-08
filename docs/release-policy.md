# Release Policy

This document defines the versioning guidelines and standard practices for public releases of the MultiModel Dev OS protocol and CLI tool.

---

## 1. Semantic Versioning Commitments

MultiModel Dev OS strictly adheres to **Semantic Versioning 2.0.0 (SemVer)**:
- **Major Releases (X.y.z)**: Incremented when backward-incompatible changes are made to the Layer 1-3 protocol or CLI signatures.
- **Minor Releases (x.Y.z)**: Incremented when new features, optional templates, or backward-compatible adapters are added.
- **Patch Releases (x.y.Z)**: Incremented for backward-compatible bug fixes, docs corrections, or verification improvements.

---

## 2. Breaking Changes Definition

A modification is defined as a **breaking change** if it:
1. Renames or deletes any of the frozen Layer 1 root contracts (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`).
2. Alters standard directory structures (`.ai/context/`, `.ai/skills/`).
3. Breaks existing CLI command signatures or required inputs.

Any such changes are prohibited outside of new major version releases (e.g., `2.0.0`).

---

## 3. Pre-Flight Verification Gates

No package shall be merged or released without:
- Passing all checks inside the `scripts/verify.js` release verification suite.
- Building the documentation site without dead links (`npm run docs:build`).
- Running packaging validation (`npm pack --dry-run`).
- Executing smoke tests on all templates.

---

## 4. NPM Publishing Pause & Roadmap Development

To ensure high stability and thorough testing of the Template Galaxy and Model Compatibility Layers, package publishing to the public npm registry is paused during all `v1.2.x` minor releases:
* **GitHub Repository (Source)**: Serve as the primary, active source branch containing unreleased v1.2+ features (such as template extensions, model registries, and CLI expansions).
* **NPM Registry (Latest)**: Remains on the last approved stable version.
* **v2.0.0 (Next Target)**: Will serve as the next stable release published to the npm registry, packaging the hardened registries and Template Galaxy features.

### Local Source & Verification Procedures

Contributors and developers must verify and test unreleased `v1.2.x` features locally rather than running publication steps:
1. **Execute commands from the source binary:**
   ```bash
   node bin/multimodel-dev-os.js init
   node bin/multimodel-dev-os.js verify
   ```
2. **Compile and test the package bundle locally:**
   ```bash
   npm pack
   ```
   This generates a local `.tgz` archive. Install it in a target test project to run validations.

Never execute `npm publish` in the main workspace unless actively packaging the approved `v2.0.0` release.

