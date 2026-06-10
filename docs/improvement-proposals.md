# Codebase Improvement Proposals

MultiModel Dev OS supports structured codebase optimization and refactoring proposals via a secure, proposal-based self-improvement pipeline.

---

## 1. Safety Principles

To guarantee repository integrity and prevent unintended changes, all self-improvement operations adhere to three core rules:
1.  **Write-Protection**: The CLI binary, security guards, workflows, and core policies are read-only and cannot be modified by model proposals.
2.  **Human-in-the-Loop (HITL)**: Models cannot write code directly to the workspace without explicit user verification.
3.  **Proposal-Only Modifications**: The proposal engine compiles ideas without applying edits directly.

---

## 2. Proposal-Review Cycle

The workflow follows these stages:

### Stage A: Proposal Generation
Run the following command to check codebase context and write a proposal:
```bash
npx multimodel-dev-os improve propose --title "Fix unignored config files"
```
This generates a markdown file under `.ai/proposals/proposal-YYYYMMDD-HHMMSS.md` containing Frontmatter metadata and markdown explanation.

### Stage B: Human Review
The developer runs the review command to inspect active proposals:
```bash
npx multimodel-dev-os improve review
```
This prints a summary table of pending, approved, and rejected proposals.

To see aggregates of proposal statuses:
```bash
npx multimodel-dev-os improve status
```

### Stage C: Manual Implementation
In this version, all edits must be applied manually by the developer. Once a proposal has been resolved and verified, edit the Frontmatter to update the `approval_status` to `approved`.
