# Self-Improving Codebase Operations

MultiModel Dev OS supports codebase refactoring, styling, and structural optimizations through a secure, proposal-based self-improvement pipeline.

---

## 1. Safety Principles

To guarantee repository integrity and prevent unintended changes, all self-improvement operations adhere to three core rules:
1.  **Write-Protection**: The CLI binary, security guards, workflows, and core policies are read-only and cannot be modified by model proposals.
2.  **Human-in-the-Loop (HITL)**: Models cannot write code directly to the workspace without explicit user verification.
3.  **Diff-Validated Execution**: Every modification must pass local verification tests, with manual commit approval.

---

## 2. Proposal-Review Cycle

The execution path follows two stages:

### Stage A: Proposal Generation
Before compiling a proposal, the agent scans the codebase using `mmdo scan` and builds the hash-compressed memory index via `mmdo memory build` to ensure the proposal is context-aware and token-efficient. The agent then identifies an optimization and saves a structured document under `.ai/proposals/proposal-YYYYMMDD-HHMMSS.md`. The proposal specifies the rationale, affected files list, risk level, test command, and rollback steps.

### Stage B: Human Review
The developer runs the review CLI command:
```bash
npx multimodel-dev-os improve review
```
This shows the proposed changes, affected files, risk levels, and verify commands.

To view status:
```bash
npx multimodel-dev-os improve status
```

*Note: Automated applying is not supported in this version. Code modifications must be applied manually, and the proposal status set to `approved` inside Frontmatter after verification.*
