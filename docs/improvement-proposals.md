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

## 3. Proposal Execution

Once a proposal is reviewed, you can execute it in one of two ways:

### A. Automated Application (Recommended)
Starting in v2.4.1, approved proposals with machine-applicable operation blocks can be executed automatically:
1. Edit the frontmatter metadata block to set `approval_status` to `approved`.
2. Validate the proposal and its safety boundaries:
   ```bash
   npx multimodel-dev-os improve validate .ai/proposals/proposal-xxxx.md
   ```
3. Preview planned changes using the dry-run diff command:
   ```bash
   npx multimodel-dev-os improve diff .ai/proposals/proposal-xxxx.md
   ```
4. Deterministically apply changes to the repository:
   ```bash
   npx multimodel-dev-os improve apply .ai/proposals/proposal-xxxx.md --approved
   ```

For detailed specifications on safety gates, allowed operations, and audit logs, see the [Approved Proposal Application Guide](/approved-proposal-apply).

### B. Manual Implementation
For proposals containing vague instructions or complex edits without structured operation blocks:
1. Manually implement and verify the code edits within your workspace.
2. Edit the frontmatter metadata block to set `approval_status` to `approved` to archive.
