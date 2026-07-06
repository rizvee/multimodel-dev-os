# Guardrail Check: Post-Change Validation

## Objective
Run verification scripts, checks, and test suites after making code modifications.

## Rules
- Execute test commands (`npm test`).
- Execute strict audit commands (`npm run verify`).
- Ensure no compilation or linter errors exist.
