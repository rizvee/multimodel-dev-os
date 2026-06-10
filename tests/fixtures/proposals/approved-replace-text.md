---
id: proposal-20260611-000002
created_at: 2026-06-11T00:00:02Z
title: Approved Replace Text Proposal
problem: Test replace text behavior.
evidence: N/A
risk_level: low
affected_files:
  - tests/fixtures/custom-template-example/replace-target.md
suggested_change: Replace placeholder in the target.
verify_command: npm run verify
rollback_plan: git checkout -- tests/fixtures/custom-template-example/replace-target.md
approval_status: approved
---

# Approved Replace Text Proposal

```json
{
  "operations": [
    {
      "type": "replace_text",
      "path": "tests/fixtures/custom-template-example/replace-target.md",
      "find": "placeholder",
      "replace": "replaced content",
      "allow_multiple": false
    }
  ]
}
```
