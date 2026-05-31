# Interactive CLI & Terminal Demo

Experience the clean scaffolding pipeline and zero-dependency commands of `multimodel-dev-os` right from your terminal.

---

## Visual Initialization Pipeline

Here is how the automatic bootstrapping pipeline looks when initializing a project with a template:

![Terminal Scaffold Mockup](/assets/terminal-demo.svg)

---

## Under the Hood: CLI Commands

`multimodel-dev-os` is built entirely on native Node.js libraries, keeping execution lightning-fast with **zero third-party runtime dependencies**.

### 1. The `init` Scaffolding Engine

Bootstraps the shared workspace contract files and target directory setups.

```bash
# Global zero-install setup
npx multimodel-dev-os@latest init

# Scaffold a specific technology stack template and set up adapter status automatically
npx multimodel-dev-os@latest init --template nextjs-saas --adapter cursor --adapter claude

# Run a dry-run preview to verify planned file actions without modifying the disk
npx multimodel-dev-os@latest init --dry-run
```

#### Core Scaffolding Activities:
- **Directory Guarantee:** Assures target paths (`.ai/context`, `.ai/skills`, `.ai/session-logs`) exist.
- **Contract Scaffold:** Creates the root source-of-truth instructions (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`).
- **Adapter Linking:** Translates and copies rule files (like `.cursorrules`, `CLAUDE.md`, or `.vscode/`) directly to your workspace root.

---

### 2. The `templates` Gallery Inspector

Allows developers to view, inspect, and choose real-world configuration templates.

```bash
# List all pre-configured stack templates
npx multimodel-dev-os templates

# Display detailed configuration rules and files of a specific template
npx multimodel-dev-os show-template nextjs-saas
```

---

### 3. The `validate` Quality Gate

Enforce strict formatting conventions inside your repository before checking in code:

```bash
# Strict directory schema and file validation checkup
npx multimodel-dev-os validate
```

If any core agent file (`AGENTS.md`, `MEMORY.md`) is missing or is structurally invalid, the CLI exits with non-zero exit codes to fail pull requests or pre-commit hooks, guarding workspace health.

---

### 4. The `doctor` Advisory Inspector

An advisory checkup to diagnose environment compatibility issues:

```bash
# Diagnostic audit of gitignore rules and IDE adapter overrides
npx multimodel-dev-os doctor
```

The doctor warns you if:
- IDE cache directories (like `node_modules` or `.vitepress/dist`) are not listed in your `.gitignore` file.
- Enabled adapter configurations inside `.ai/config.yaml` lack corresponding physical rule files on the disk.
