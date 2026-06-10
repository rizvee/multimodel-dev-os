---
id: proposal-20260611-111111
created_at: 2026-06-11T11:11:11Z
title: Pending Proposal
problem: Test pending proposal.
evidence: N/A
risk_level: low
affected_files:
  - tests/fixtures/custom-template-example/pending.md
suggested_change: Create pending file.
verify_command: npm run verify
rollback_plan: rm tests/fixtures/custom-template-example/pending.md
approval_status: pending
---

# Pending Proposal

```json
{
  "operations": [
    {
      "type": "create_file",
      "path": "tests/fixtures/custom-template-example/pending.md",
      "content": "pending\n",
      "overwrite": true
    }
  ]
}
```
