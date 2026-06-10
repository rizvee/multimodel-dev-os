# Self-Improving Codebase Operations

MultiModel Dev OS supports automated codebase refactoring, styling, and structural optimizations through a secure, proposal-based self-improvement pipeline.

---

## 1. Safety Principles

To guarantee repository integrity and prevent unintended changes, all self-improvement operations adhere to three core rules:
1.  **Write-Protection**: The CLI binary, security guards, workflows, and core policies are read-only and cannot be modified by model proposals.
2.  **Human-in-the-Loop (HITL)**: Models cannot write code directly to the workspace without explicit user verification.
3.  **Diff-Validated Execution**: Every modification must pass local verification tests, with automatic git rollback if checks fail.

---

## 2. Proposal-Review-Apply Cycle

The execution path follows three stages:

### Stage A: Proposal Generation
Before compiling a proposal, the agent scans the codebase using `mmdo scan` and builds the hash-compressed memory index via `mmdo memory build` to ensure the proposal is context-aware and token-efficient. The agent then identifies an optimization (e.g. refactoring a component, cleaning up dead code) and saves a structured document under `.ai/proposals/proposal-<id>.yaml`. The proposal specifies the rationale, affected files list, risk level, test command, and rollback steps.

### Stage B: Human Review
The developer runs the review CLI command:
```bash
npx multimodel-dev-os improve review
```
This shows the proposed changes, file diffs, risk levels, and verify commands.

### Stage C: Apply & Verification
Once the developer approves:
```bash
npx multimodel-dev-os improve apply --approved
```
1.  The agent applies modifications.
2.  The validator executes the `verify_command` (e.g., `npm run verify`).
3.  If the verify command fails (exit code > 0), the agent runs the `rollback_plan` (e.g. `git checkout`) to restore files instantly.
