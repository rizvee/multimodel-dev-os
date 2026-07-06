# Guardrail Check: Pre-Tool Safety

## Objective
Prevent the execution of high-risk or destructive tools before verifying state.

## Rules
- Destructive git operations (e.g., reset, clean, force-push) are restricted.
- Advisory validation: ensure state is reviewed.
