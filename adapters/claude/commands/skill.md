---
description: Load and execute a skill from the canonical library
allowed-tools: ["read_file", "list_directory", "search_files", "run_command", "write_file", "edit_file"]
---

# /skill — Canonical Skill Loader

Load a skill by name from the canonical library at `~/.agents/skills/`.

## Steps

1. Resolve the skill name from the argument: `$ARGUMENTS`
2. Read `~/.agents/skills/$ARGUMENTS/SKILL.md`
3. If the skill has subdirectories (`agents/`, `scripts/`, `examples/`), scan them for additional context
4. Execute the skill's workflow against the current project
5. After execution, run the project's verification commands

## Fallback

If the skill is not found in `~/.agents/skills/`, check `.ai/skills/` in the project root.
If still not found, report the available skills:

```
ls ~/.agents/skills/
```

## Rules

- Load only one skill at a time
- Do not paste the skill content into CLAUDE.md
- Follow the skill's guardrails and success criteria
- Run validators before reporting completion
