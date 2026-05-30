# CLI Command Reference

`multimodel-dev-os` features a lightweight, dependency-free local CLI utility. It allows standard bootstraps, structural integrity checks, and rule validations natively.

## Execution

Execute the CLI globally or inside target folder contexts using `npx`:

```bash
npx multimodel-dev-os@latest <command> [options]
```

Or execute locally within a cloned workspace:

```bash
node bin/multimodel-dev-os.js <command> [options]
```

---

## Commands

### 1. `init`
Scaffold `multimodel-dev-os` files and adapters cleanly.
* **Usage:** `node bin/multimodel-dev-os.js init [options]`
* **Options:**
  - `-t, --target <path>`: Specifies target destination (default: current working directory).
  - `--template <name>`: Stack blueprint: `nextjs-saas`, `wordpress-site`, `ecommerce-store`, `seo-landing-page`, `general-app`.
  - `-a, --adapter <name>`: Inject rules file directly (`cursor`, `claude`, `vscode`, `gemini`, `antigravity`, `codex`).
  - `--caveman`: Installs ultra-lightweight variant profiles.
  - `-d, --dry-run`: Previews actions without mutated files.
  - `-f, --force`: Overwrites conflicts.

### 2. `validate`
Strict directory schema compliance gate checks.
* **Usage:** `node bin/multimodel-dev-os.js validate [options]`
* **Assertions:** Checks for the presence of crucial root files and enabled adapters' rule targets. If assertions fail, exits with status 1.

### 3. `doctor`
Advisory checkups for gitignores and large token-sinks.
* **Usage:** `node bin/multimodel-dev-os.js doctor [options]`
* **Audits:** Missing `.env` gates in gitignores, missing build steps inside `AGENTS.md`, and large unignored directories (e.g. `node_modules`, `.next`). Reports warnings without blocking execution.

### 4. `templates` / `list-templates`
Inspection map of all built-in stacks.
* **Usage:** `node bin/multimodel-dev-os.js templates`

### 5. `show-template <name>`
Detailed layout specifications and skill blueprints audit.
* **Usage:** `node bin/multimodel-dev-os.js show-template nextjs-saas`
