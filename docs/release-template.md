# Patch & Release Playbook Template

Use this playbook to prepare, audit, and announce releases. This document contains reusable release notes templates tailored for patch, minor, and major milestones.

---

## 1. Reusable Release Notes Templates

### A. Patch Release Template (e.g., `v0.7.1`)
Use this when releasing hotfixes, structural compliance patches, or minor configuration adjustments.

```markdown
## [vX.Y.Z] - YYYY-MM-DD (Patch Release)

### Fixed
- **[Fix Category]:** Detailed explanation of the bug and how it was resolved.
- **[Adapter Sync]:** Fixed minor pathing issue in [Adapter Name] setup rules.

### Performance
- Optimized local verifier execution times by removing redundant filesystem lookups.

---
**Technical Integrity:** All 100+ release audit compliance checks pass successfully.
```

---

### B. Minor Release Template (e.g., `v0.8.0`)
Use this when introducing backward-compatible new features, stack templates, or command additions.

```markdown
## [vX.Y.0] - YYYY-MM-DD (Minor Feature Release)

### Added
- **[New Feature]:** Introduced [Feature Name] supporting automated [Activity Name].
- **[New Template]:** Added [Template Name] real-world stack template for [Stack Name].
- **[CLI Command]:** Implemented `npx multimodel-dev-os [command-name]` to execute [description].

### Changed
- **[Adapter Refactor]:** Upgraded [Adapter Name] rules mapping to support [New version specs].

### Fixed
- **[Linter Adjustments]:** Adjusted linter guidelines to prevent false-positives under specific workspace boundaries.
```

---

### C. Major Release Template (e.g., `v1.0.0`)
Use this for major milestones, breaking changes, or sweeping architectural overhauls.

```markdown
## [vX.0.0] - YYYY-MM-DD (Major Milestone Release)

### 🚨 Breaking Changes
- **[Abstractions Overhaul]:** Central root contracts have been restructured. [Detail the exact changes and how to migrate].
- **[CLI Commands Deprecation]:** The legacy subcommand `[legacy-command]` has been deprecated in favor of `[new-command]`.

### Added
- **[Core Architecture]:** Implemented the new [Architectural Block Name] mapping protocol.
- **[Universal Adaptability]:** Full integration and native support for [List of new tools].

### Migration Guide
1. Run `npx multimodel-dev-os@latest migrate` inside your target repository.
2. Update your root configuration `AGENTS.md` to reflect the new schemas.
```

---

## 2. Dynamic Release Pipeline Checklist
- [ ] Bump version tag inside `package.json`.
- [ ] Prepend release notes to `CHANGELOG.md` following the Keep a Changelog convention.
- [ ] Execute `npm run verify` to test structural compliance.
- [ ] Execute `npm run docs:build` to confirm website compilation success.
- [ ] Run `npm pack --dry-run` to audit tarball cleanliness.
