# CLI Command Reference

`multimodel-dev-os` features a lightweight, dependency-free CLI utility with **zero third-party runtime dependencies**. All commands work on Windows, macOS, and Linux.

## Execution

```bash
# Via npx (recommended — no install needed)
npx multimodel-dev-os@latest <command> [options]

# Via local clone
node bin/multimodel-dev-os.js <command> [options]
```

---

## Commands

### 1. `init` — Scaffold Workspace

Scaffold MultiModel Dev OS files and adapters cleanly.

```bash
npx multimodel-dev-os@latest init [options]
```

| Option | Description |
|:---|:---|
| `-t, --target <path>` | Target destination (default: current directory) |
| `--template <name>` | Stack blueprint: `nextjs-saas`, `wordpress-site`, `ecommerce-store`, `seo-landing-page`, `expo-react-native-android`, `general-app` |
| `-a, --adapter <name>` | Inject adapter rules: `cursor`, `claude`, `vscode`, `gemini`, `antigravity`, `codex` |
| `--caveman` | Install ultra-lightweight token-optimized variant |
| `-d, --dry-run` | Preview actions without writing files |
| `-f, --force` | Overwrite existing files (creates `.bak` backups) |

---

### 2. `scan` — Codebase Scanner

Scan codebase structure, frameworks, package managers, and security/exclusion risks.

```bash
npx multimodel-dev-os@latest scan [--target <path>]
```

---

### 3. `status` — Intelligence Dashboard

Display a compact project intelligence dashboard summarizing package metadata, framework signals, memory state, feedback counts, proposals, and recommended next steps. Fully read-only.

```bash
npx multimodel-dev-os@latest status [--target <path>]
```

---

### 4. `memory` — Hash-Compressed Memory

Manage codebase hash-compressed memory index.

```bash
npx multimodel-dev-os@latest memory <subcommand> [--target <path>]
```

| Subcommand | Description |
|:---|:---|
| `build` | Full codebase scan → writes memory files |
| `refresh` | Incremental memory update based on file hash diffs |
| `diff` | Reports modified/added/removed files vs memory index (read-only) |

---

### 5. `feedback` — Developer Feedback Loop

Capture developer corrections and compile them into reusable learning rules.

```bash
npx multimodel-dev-os@latest feedback <subcommand> [options]
```

| Subcommand | Description |
|:---|:---|
| `add "<text>"` | Append a structured feedback entry |
| `list` | View all logged feedback entries |
| `summarize` | Compile feedback logs into `learning-rules.md` |

**Options:** `--type <type>` (correction, preference, bug) · `--tags <list>` · `--files <list>`

---

### 6. `improve` — Proposal Engine

Manage codebase optimization proposals and deterministic execution.

```bash
npx multimodel-dev-os@latest improve <subcommand> [options]
```

| Subcommand | Description |
|:---|:---|
| `propose` | Generate a codebase improvement proposal |
| `review` | List active proposals and their statuses |
| `status` | Show aggregate proposal status counts |
| `validate <file>` | Validate safety gates and parse operations |
| `diff <file>` | Preview changes in grouped diff format |
| `apply <file> --approved` | Apply approved operations to target codebase |
| `log` | Display Applied Proposals Audit Log history |

**Options:** `--title <text>` (with `propose`) · `--approved` (required for `apply`) · `--target <path>`

---

### 7. `workflow` — Workflow Orchestration

Orchestrate read-only development workflow pipelines.

```bash
npx multimodel-dev-os@latest workflow <subcommand> [options]
```

| Subcommand | Description |
|:---|:---|
| `list` | Print all registered workflows |
| `show <name>` | Display workflow details, risk level, and steps |
| `plan <name>` | Dry-run preview of workflow steps |
| `run <name>` | Execute safe, read-only workflow steps |

**Built-in workflows:** `repo-health` · `memory-refresh` · `feedback-review` · `proposal-review` · `release-check`

---

### 8. `handoff` — Agent Session Handoff

Compile token-compressed agent session handoff context.

```bash
npx multimodel-dev-os@latest handoff <subcommand>
```

| Subcommand | Description |
|:---|:---|
| `build` | Generate `.ai/intelligence/handoff.md` (gitignored) |
| `show` | Print handoff contents to console |

---

### 9. `onboard` — Existing Repo Onboarding

Safely onboard an existing repository into MultiModel Dev OS.

```bash
npx multimodel-dev-os@latest onboard <subcommand> [options]
```

| Subcommand | Description |
|:---|:---|
| `analyze` | Scan project structure, frameworks, and risk markers (read-only) |
| `recommend` | Run diagnostics and recommend templates/adapters (read-only) |
| `plan` | Generate onboarding plan and report (read-only) |
| `apply --approved` | Copy configuration templates (creates backups, requires `--force` for overwrites) |
| `status` | Show onboarding progress and completeness dashboard |

---

### 10. `adapter` — IDE Adapter Sync

Manage and synchronize rule files for IDE and assistant adapters.

```bash
npx multimodel-dev-os@latest adapter <subcommand> [options]
```

| Subcommand | Description |
|:---|:---|
| `status` | Show rules files status and enable/disable states |
| `diff <adapter>` | Show diff between bundled template and target root file |
| `sync <adapter\|all> --approved` | Synchronize rule files (creates backups, requires `--force` for overwrites) |

---

### 11. `validate` — Strict Validation

Strict directory schema compliance gate. Exits with code 1 on failures — safe for CI/CD.

```bash
npx multimodel-dev-os@latest validate [--target <path>]
```

---

### 12. `doctor` — Advisory Diagnostics

Advisory checkups for workspace health, gitignores, token-sinks, and intelligence configuration.

```bash
npx multimodel-dev-os@latest doctor [options]
```

| Flag | Description |
|:---|:---|
| `--release` | Verify version stability, docs build, and dry-run pack |
| `--intelligence` | Audit memory freshness, feedback logs, proposals, and `.gitignore` safety |
| `--onboarding` | Verify crucial root files, configs, and git-ignored plan files for onboarding readiness |

---

### 13. `verify` — Release Audit

Full release verification suite with **214+ structural assertions**. Checks all files, registries, YAML syntax, CLI version matching, npm pack hygiene, and security boundaries.

```bash
npx multimodel-dev-os@latest verify
# or
npm run verify
```

---

### 14. `templates` — Template Gallery

List and inspect all built-in stack templates.

```bash
npx multimodel-dev-os@latest templates          # List all templates
npx multimodel-dev-os@latest show-template <name>  # Detailed template inspection
```

---

### 15. Registry Commands

Explore model, adapter, and skill registries.

```bash
npx multimodel-dev-os@latest models         # View model registry
npx multimodel-dev-os@latest models --json   # Machine-readable output
npx multimodel-dev-os@latest show-model <id> # Detailed model info
npx multimodel-dev-os@latest providers       # View API providers
npx multimodel-dev-os@latest adapters        # View adapter registry
npx multimodel-dev-os@latest skills          # View skill registry
```
