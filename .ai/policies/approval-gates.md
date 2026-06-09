# MultiModel Dev OS Approval Gates Policy

This document defines the Human-in-the-Loop (HITL) gates, risk levels, and validation protocols required before any changes proposed by MultiModel Dev OS can be applied.

---

## 1. HITL Gate Framework

Automated developer agents must classify code modifications into one of three risk categories, each requiring a specific approval gate:

| Risk Category | Example Changes | Required Approval Gate |
|:---|:---|:---|
| **Low Risk** | Documentation updates, CSS style tweaks, comment insertions, minor typos. | **Gate 1**: Automated `verify` + passive developer sign-off. |
| **Medium Risk** | Refactoring internal functions, adding utility files, updating package dependencies, writing unit tests. | **Gate 2**: Pre-apply diff review + automated verification + manual commit approval. |
| **High Risk** | Database schema changes, security middleware, network config, payment webhooks. | **Gate 3**: Pre-implementation spec review + interactive dry-run + strict maintainer code audit. |

---

## 2. Gate Protocols

### Gate 1 (Low Risk)
*   The agent drafts modifications and executes the validator.
*   The developer is notified of the changes via terminal logs. No blocking input is required unless errors occur.

### Gate 2 (Medium Risk)
*   The agent must compile a diff and present it to the developer.
*   The developer must explicitly approve the proposal (e.g. typing `y` or confirming via IDE dialog).
*   The agent applies modifications and runs automated tests.
*   Developer reviews the post-test state before git staging.

### Gate 3 (High Risk)
*   Before writing any code, the agent must generate a technical design spec.
*   The spec must be reviewed and signed off by the maintainer.
*   The agent executes the changes under dry-run settings first.
*   Once dry-run confirms zero side-effects, the changes are applied in a separate branch, tests are executed, and a manual pull request audit is completed.
