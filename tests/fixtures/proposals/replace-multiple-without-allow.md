---
id: proposal-20260611-000005
created_at: 2026-06-11T00:00:05Z
title: Replace Multiple Without Allow Proposal
problem: Test replace text matching multiple times without allow_multiple.
evidence: N/A
risk_level: low
affected_files:
  - tests/fixtures/custom-template-example/multiple.md
suggested_change: Replace multiple occurrences without allow_multiple flag.
verify_command: npm run verify
rollback_plan: N/A
approval_status: approved
---

# Replace Multiple Without Allow Proposal

```json
{
  "operations": [
    {
      "type": "replace_text",
      "path": "tests/fixtures/custom-template-example/multiple.md",
      "find": "target",
      "replace": "replaced",
      "allow_multiple": false
    }
  ]
}
```
