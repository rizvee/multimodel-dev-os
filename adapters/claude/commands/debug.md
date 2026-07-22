---
description: Diagnose software defects using evidence-driven isolation
allowed-tools: ["read_file", "list_directory", "search_files", "run_command"]
---

# /debug — Systematic Debugging

Load and execute the `systematic-debugging` skill from `~/.agents/skills/systematic-debugging/SKILL.md`.

Target: `$ARGUMENTS` (error message, failing test, or symptom description).

Reproduce → hypothesize → bisect → confirm → fix → add regression test.
Do not patch symptoms before explaining causality.
