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
Advisory checkups for gitignores, large token-sinks, and intelligence configuration.
* **Usage:** `node bin/multimodel-dev-os.js doctor [options]`
* **Audits:** Missing `.env` gates in gitignores, missing build steps inside `AGENTS.md`, and large unignored directories.
* **Options:**
  - `--release`: Verifies version stability, verifies Vitepress docs build, checks dry-run pack.
  - `--intelligence`: Runs advisory audits verifying memory index freshness, feedback log presence, learning rules compilation, proposals status, and `.gitignore` safety boundaries.

### 4. `templates` / `list-templates`
Inspection map of all built-in stacks.
* **Usage:** `node bin/multimodel-dev-os.js templates`

### 5. `show-template <name>`
Detailed layout specifications and skill blueprints audit.
* **Usage:** `node bin/multimodel-dev-os.js show-template nextjs-saas`

### 6. `scan`
Scan codebase structure, frameworks, package managers, and security/exclusion risks.
* **Usage:** `node bin/multimodel-dev-os.js scan [options]`
* **Options:**
  - `-t, --target <path>`: Specifies target destination (default: current working directory).

### 7. `memory`
Manage codebase hash-compressed memory index.
* **Usage:** `node bin/multimodel-dev-os.js memory <subcommand> [options]`
* **Subcommands:**
  - `build`: Performs full codebase scan and writes memory files.
  - `refresh`: Performs incremental memory updates based on file hash diffs.
  - `diff`: Reports files modified, added, or removed compared to memory index without writing any changes.
* **Options:**
  - `-t, --target <path>`: Specifies target destination (default: current working directory).

### 8. `feedback`
Manage developer feedback loop and compile rules.
* **Usage:** `node bin/multimodel-dev-os.js feedback <subcommand> [options]`
* **Subcommands:**
  - `add "<text>"`: Append a structured feedback object.
  - `list`: View logged feedback entries.
  - `summarize`: Compile raw feedback logs into `learning-rules.md`.
* **Options:**
  - `--type <type>`: Classification type (`correction`, `preference`, `bug`, etc.)
  - `--tags <list>`: Comma-separated list of tags.
  - `--files <list>`: Comma-separated list of related files.

### 9. `improve`
Manage codebase optimization proposals and deterministic execution.
* **Usage:** `node bin/multimodel-dev-os.js improve <subcommand> [options]`
* **Subcommands:**
  - `propose`: Generate a codebase improvement proposal markdown file.
  - `review`: List active proposals and their statuses.
  - `status`: Show aggregate counts of proposal statuses.
  - `validate <proposal-file>`: Validate safety gates and parse operations. Prints a structured safety checklist (Frontmatter, Approval, JSON, Types, Boundaries, Permissions, Constraints) with actionable fixes on refusal.
  - `diff <proposal-file>`: Preview proposed changes grouped by type in a token-safe truncated diff format.
  - `apply <proposal-file> --approved`: Apply approved operations to target, printing compact summaries, clear idempotent statuses, and writing success/refusal audit logs.
  - `log`: Display Applied Proposals Audit Log execution history (`apply-log.jsonl`).
* **Options:**
  - `--title <text>`: Title of the proposal (used with `propose`).
  - `--approved`: Explicitly authorize apply command execution (required for `apply`).
  - `-t, --target <path>`: Specifies target destination (default: current working directory).

### 10. `status`
Display a compact project intelligence dashboard.
* **Usage:** `node bin/multimodel-dev-os.js status [options]`
* **Overview:** Summarizes package metadata, framework signals, memory state (`MISSING`/`STALE`/`CURRENT`), feedback counts, proposal statuses, apply log audits, and the recommended next command. Fully read-only.

### 11. `workflow`
Orchestrate read-only development workflow pipelines.
* **Usage:** `node bin/multimodel-dev-os.js workflow <subcommand> [options]`
* **Subcommands:**
  - `list`: Print all registered workflows in `.ai/registries/workflows.yaml`.
  - `show <workflow>`: Display details, risk level, memory write capability, code modification capability, and logical steps of target workflow.
  - `plan <workflow>`: Print steps and commands of target workflow without executing them (dry-run).
  - `run <workflow>`: Sequentially execute safe, read-only and metadata-write steps (e.g. scan, doctor, memory refresh, feedback summarize). Any step requiring source code modification will halt and output manual instructions.

### 12. `handoff`
Compile token-compressed agent session handoff context.
* **Usage:** `node bin/multimodel-dev-os.js handoff <subcommand> [options]`
* **Subcommands:**
  - `build`: Scans project signals and intelligence state and generates `.ai/intelligence/handoff.md` (which is git-ignored by default).
  - `show`: Prints handoff contents to console (building them first if not present).
