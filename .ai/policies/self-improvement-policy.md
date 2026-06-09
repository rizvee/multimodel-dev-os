# MultiModel Dev OS Self-Improvement Policy

This document defines the policies, guidelines, and guardrails for automated self-improvement cycles inside workspaces governed by MultiModel Dev OS.

---

## 1. Safety Guardrails & Write-Protection

To prevent runaway self-modifying loops, the following directories and files are officially **write-protected** from automated model refactors:
*   `bin/` — The core CLI executable binaries.
*   `scripts/` — Automated verification, setup, and prepublish-guard scripts.
*   `.ai/policies/` — Approval schemas and policy definitions (including this document).
*   `.github/` — Workflows and issue templates.

Any self-improvement proposal targeting these directories or files must be immediately aborted by the execution client.

---

## 2. Proposal Framework

All code improvement recommendations must be prepared as structured yaml files inside `.ai/proposals/proposal-<id>.yaml`. A proposal must contain:
1.  **`rationale`**: Clear documentation of the technical reasoning, problem description, and expected outcome.
2.  **`affected_files`**: An explicit array of absolute or relative file paths to be modified. No other files may be touched.
3.  **`risk_level`**: Classification (`low`, `medium`, `high`) based on the component's sensitivity (e.g. database, credentials, public APIs).
4.  **`verify_command`**: The CLI validation command to run after files are modified (e.g., `npm run verify` or custom testing commands).
5.  **`rollback_plan`**: Automated step-by-step commands to revert changes if verification fails.

---

## 3. Execution & Validation Cycle

Self-improvement cycles must execute in a isolated sandbox following this sequence:
1.  **Draft**: Compile proposal and write to `.ai/proposals/proposal-<id>.yaml`.
2.  **User Audit**: Display proposed diffs and require developer verification.
3.  **Apply (Staging)**: Apply modifications to the target files.
4.  **Test**: Execute `verify_command` (must return exit code `0`).
5.  **Rollback / Commit**:
    *   If tests **pass**: Commit modifications locally with prefix `chore(improve): <summary>`.
    *   If tests **fail**: Execute `rollback_plan` (e.g. `git checkout -- <files>`) to revert modifications immediately and log the failure.
