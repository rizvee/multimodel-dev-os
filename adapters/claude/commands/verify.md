---
description: Verify implementation claims before declaring work complete
allowed-tools: ["read_file", "list_directory", "search_files", "run_command"]
---

# /verify — Verification Before Completion

Load and execute the `verification-before-completion` skill from `~/.agents/skills/verification-before-completion/SKILL.md`.

## Steps

1. Restate the task's acceptance criteria as observable checks
2. Run the project's verification suite:
   ```
   npm test
   node scripts/verify.js
   ```
3. Inspect actual outputs, exit codes, and state changes
4. Map every completion claim to evidence
5. Report unverified limits

Never infer success from command execution alone.
