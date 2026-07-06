# Guardrail Check: Pre-Write Safety

## Objective
Validate local file write operations before writing to disk.

## Rules
- Verify target paths do not touch protected configuration or sensitive boundaries.
- Ensure files comply with standard syntax and encoding guidelines.
