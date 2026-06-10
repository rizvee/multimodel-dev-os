---
id: proposal-20260611-000003
created_at: 2026-06-11T00:00:03Z
title: Path Traversal Proposal
problem: Test directory traversal boundaries check.
evidence: N/A
risk_level: low
affected_files:
  - ../outside.md
suggested_change: Modify file outside root.
verify_command: npm run verify
rollback_plan: N/A
approval_status: approved
---

# Path Traversal Proposal

```json
{
  "operations": [
    {
      "type": "create_file",
      "path": "../outside-file.md",
      "content": "outside content\n",
      "overwrite": true
    }
  ]
}
```
