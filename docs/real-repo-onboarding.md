# Onboarding Existing Repositories

MultiModel Dev OS provides a safe, step-by-step onboarding protocol to configure coding agents in any existing codebase without modifying application source files.

## Onboarding Commands

To onboard an existing repository, run the following commands:

```bash
# 1. Analyze the project structure, language, framework, and security signals
npx multimodel-dev-os onboard analyze --target .

# 2. Output template recommendations and suggested next steps
npx multimodel-dev-os onboard recommend --target .

# 3. Generate a structured onboarding plan and markdown report
npx multimodel-dev-os onboard plan --target .

# 4. Safely apply the onboarding plan to generate AI Dev OS scaffolding
npx multimodel-dev-os onboard apply --target . --approved
```

## Security & Safety Guarantees

* **Read-only Commands**: `analyze`, `recommend`, and `plan` are read-only and make no modifications.
* **No Source Code Mutation**: `apply` only creates/updates MultiModel Dev OS configuration files (`.ai/`, `AGENTS.md`, `MEMORY.md`, etc.). It never touches your application source code.
* **Backup Support**: If a file already exists, the onboard engine skips it. To overwrite, use `--force`, which creates a `.bak` backup file first.
