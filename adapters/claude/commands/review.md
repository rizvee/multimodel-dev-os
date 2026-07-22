---
description: Review code changes for correctness, regressions, security, and tests
allowed-tools: ["read_file", "list_directory", "search_files"]
---

# /review — Code Review

Load and execute the `code-review` skill from `~/.agents/skills/code-review/SKILL.md`.

Apply the review to:
- The current diff (`git diff` or `git diff --staged`)
- Or the files/changes specified in `$ARGUMENTS`

After review, output findings ordered by severity with evidence and fix direction.
Do not make changes — only report.
