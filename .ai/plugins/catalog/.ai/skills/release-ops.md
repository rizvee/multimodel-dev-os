# Release Preparation & Package Audit Skill

This skill guides the AI agent when verifying workspace state for a package release.

## Guidelines

1. **Version Auditing:**
   - Double-check that target tags match version fields in `package.json`, install scripts, and changelogs.
   - Refuse tag generation if uncommitted files are present in the working tree.
2. **Hygiene Checks:**
   - Verify that `.npmrc` file is ignored or properly configured before running pack dry-runs.
   - Confirm lockfiles are updated and represent the exact active package versions.
