# Agent Handoff Specification

The `handoff` command parses repository context to build a token-compressed summary document designed to transfer codebase state to a new agent or model session.

---

## 1. CLI Commands

### Build Handoff Spec
Generates the summary document at `.ai/intelligence/handoff.md`:
```bash
npx multimodel-dev-os handoff build
```

### Show Handoff Spec
Prints the handoff content directly to the console (building it first if missing):
```bash
npx multimodel-dev-os handoff show
```

---

## 2. Handoff Structure

The compiled `.ai/intelligence/handoff.md` file contains the following key sections:

1.  **Project Context**: Package name, version, detected frameworks, and package dependencies.
2.  **Intelligence Core State**: Tells the incoming agent if the memory is `CURRENT` or `STALE`, feedback loop counts, rules status, proposals status, and last applied proposal run ID.
3.  **Core Learning Summaries**: Provides a snippet of active learning rules from `learning-rules.md`.
4.  **Safety Constraints**: Outlines session boundaries, indicating that workflows are read-only and modifications require explicit user approval.
5.  **Recommended Next Steps**: Provides 2-3 logical starting points for the incoming agent.

---

## 3. Safety Controls

*   **No Source Dumps**: Full source code is never appended.
*   **No Secrets**: Scans target folders and excludes sensitive files, `.env` configs, credentials, or private keys.
*   **Excluded in VCS**: `.ai/intelligence/handoff.md` is ignored by Git, ensuring local state doesn't pollute repository history.
