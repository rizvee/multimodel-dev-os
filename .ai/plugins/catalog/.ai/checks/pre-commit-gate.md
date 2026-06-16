# Pre-commit Quality Gate

This check enforces repository sanity checks before commits are made.

## Verification Checklist

1. **Syntax & Style:**
   - Run linter checks (e.g. `npm run lint` or `eslint`).
   - Run typecheckers (e.g. `npm run typecheck` or `tsc`).
2. **Schema & Diagnostics:**
   - Run `npx multimodel-dev-os validate` to ensure directory structure compliance.
   - Run `npx multimodel-dev-os doctor` to audit ignored folders and token sizes.
3. **Working Tree Cleanliness:**
   - Run `git diff` to confirm there are no leftover debug statements or scratch files.
