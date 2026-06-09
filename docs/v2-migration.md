# MultiModel Dev OS v2 Migration Guide

This guide describes how to migrate your developer configurations and workspace setup to the new Layered Architecture of MultiModel Dev OS v2.

## What is Changing

* **Version 1.1.0 and prior:** Handled flat configurations directly at the project root with individual configurations manually copied across.
* **Version 2.0.0 (and source milestones 1.2–1.5):** Establishes a clean, three-layered architecture where root contracts (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`) are automatically routed to adapters via the `.ai/` directory.

## Migration Steps

### 1. Upgrade the CLI
Run the latest v2 setup utility via npx:
```bash
npx multimodel-dev-os@latest init --template general-app
```

### 2. Move Legacy Configuration Files
If you have custom system instructions or rules:
* Move `.cursorrules` custom rules to `.ai/skills/` as custom markdown skills.
* Re-generate adapter links:
  ```bash
  npx multimodel-dev-os@latest init --adapter cursor --adapter claude
  ```

### 3. Verify Migration Integrity
Run diagnostics to verify that ignored folders, boundaries, and files are clean:
```bash
npx multimodel-dev-os@latest doctor
npx multimodel-dev-os@latest validate
```
