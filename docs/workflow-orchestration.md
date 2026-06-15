# Workflow Orchestration

MultiModel Dev OS `v2.5.0` features a built-in **Workflow Runner** designed to orchestrate codebase diagnostic pipelines safely.

---

## 1. CLI Commands

Workflows are registered in [.ai/registries/workflows.yaml](file:///.ai/registries/workflows.yaml) and can be executed via the following subcommands:

### List Registered Workflows
Prints name, risk, and summary of all active workflows:
```bash
npx multimodel-dev-os workflow list
```

### Show Workflow Specifications
Displays details, memory write permissions, code modification permissions, and individual logical steps:
```bash
npx multimodel-dev-os workflow show repo-health
```

### Plan Workflow Execution (Dry-Run)
Prints the execution sequence, command lists, and expected outputs without executing any logic:
```bash
npx multimodel-dev-os workflow plan repo-health
```

### Run Workflow
Executes the workflow steps sequentially:
```bash
npx multimodel-dev-os workflow run repo-health
```

> [!TIP]
> You can also run, plan, and list workflows interactively through the [TUI Dashboard](file:///f:/multimodel-dev-os/docs/dashboard.md) under the **Quality Gates & Diagnostics** or **Memory & Intelligence** menus.

---

## 2. Standard Built-in Workflows

MultiModel Dev OS defines 5 baseline workflows:

1.  **`repo-health`** (Low Risk): Scans framework signals, performs advisory doctor audits, and verifies file structures.
2.  **`memory-refresh`** (Medium Risk): Assesses memory differences and incremental refreshes.
3.  **`feedback-review`** (Low Risk): Lists active developer logs and compiles rules to `learning-rules.md`.
4.  **`proposal-review`** (Low Risk): Inspects codebase proposals, checks status counts, and displays audit apply logs.
5.  **`release-check`** (Low Risk): Verifies codebase structures, executes release doctors, and runs package pack checks.

---

## 3. Strict Safety Gates

The workflow engine enforces strict safety boundaries:

*   **No File Modifications**: Allowed workflows only execute read-only checkups and incremental metadata updates (memory file compilation, feedback summaries).
*   **No Shell Execution**: Shell command execution from `workflows.yaml` is prohibited. Steps map directly to internal Javascript CLI functions.
*   **No Autonomy**: Any step requiring code changes (e.g. applying proposals) stops and outputs manual next-step instructions for the developer.

## 4. Bundled Registry Fallback

If the repository does not have a local `.ai/registries/workflows.yaml` registry file initialized yet, the workflow runner will automatically fall back to the bundled registry package templates and output a notice. This allows running read-only diagnostics prior to full project onboarding.
