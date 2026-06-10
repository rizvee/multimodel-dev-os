---
id: proposal-20260611-000004
created_at: 2026-06-11T00:00:04Z
title: Existing Create File No Overwrite Proposal
problem: Test existing file without overwrite flag.
evidence: N/A
risk_level: low
affected_files:
  - tests/fixtures/custom-template-example/existing.md
suggested_change: Create file without overwrite flag.
verify_command: npm run verify
rollback_plan: N/A
approval_status: approved
---

# Existing Create File No Overwrite Proposal

```json
{
  "operations": [
    {
      "type": "create_file",
      "path": "tests/fixtures/custom-template-example/existing.md",
      "content": "new content\n",
      "overwrite": false
    }
  ]
}
```
