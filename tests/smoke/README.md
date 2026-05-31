# Smoke Tests Playbook

Follow these quick manual verification commands to assert the functional integrity of `multimodel-dev-os` before pushing tag releases.

---

## 1. Quick Verification Pipeline

Run the following actions sequentially inside a target sandbox:

```bash
# 1. Inspect version parameters and command menu
node bin/multimodel-dev-os.js --help

# 2. View all built-in configurations
node bin/multimodel-dev-os.js templates

# 3. Inspect a specific template's specifications
node bin/multimodel-dev-os.js show-template nextjs-saas

# 4. Dry-run scaffold inside the current repository
node bin/multimodel-dev-os.js init --template general-app --dry-run

# 5. Execute strict validation lints
node bin/multimodel-dev-os.js validate --target .

# 6. Execute diagnostic doctor checkups
node bin/multimodel-dev-os.js doctor --target .
```

---

## 2. Dry-Run Verification

Assert that no physical files are created when running the `--dry-run` parameter:
- Verify stdout logs indicate `[DRY-RUN] Would create...`
- Confirm `git status` reports zero untracked files or modifications.
