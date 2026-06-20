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

## 4. Release Strategy & Staging Controls

To ensure developer stability and avoid package version fatigue, MultiModel Dev OS enforces the following distribution strategy:
- **Internal Stabilization Sprints**: Patch-level work (e.g. bug fixes, refactoring, test stability, documentation formatting) is treated as internal by default and committed directly to `main` without bumping versions or publishing to npm.
- **Batched Milestone Releases**: Public npm and GitHub releases are batched into stable milestone releases (e.g., `v3.5.0`, `v3.6.0`, `v4.0.0`).
- **Security Hotfix Exceptions**: Critical security hotfixes (e.g., remote execution, command injection remediations) bypass the batching policy and are published immediately as public patch releases.
- **Staging Verification**: To test new configurations prior to publishing, package the bundle locally (`npm pack`) and run CLI checkups in clean test directories (`C:\mmdo-smoke`).
