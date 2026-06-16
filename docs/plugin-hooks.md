# Declarative Plugin Hooks System

MultiModel Dev OS features a secure, registry-based **Declarative Plugin System** designed to extend workspace templates, rules, workflows, and skills without exposing repositories to arbitrary third-party code execution or dependency vulnerabilities.

---

## Safety & Security Boundaries

To maintain absolute containment, plugins in MMDO are **strictly declarative configs (YAML)**.

| Allowed Operations | Forbidden Operations (Hard Blocked) |
|:---|:---|
| Copying markdown templates into `.ai/templates/` | Arbitrary JavaScript execution (`eval` or `vm`) |
| Injecting custom skills into `.ai/skills/` | Running external shell scripts, npm install, or binaries |
| Registering advisory checks in `.ai/checks/` | Writing files to source directories (e.g. `src/`, `lib/`) |
| Mapping adapter rules in `adapters/` | Modifying `.env`, `.git/`, `.npmrc`, or `package.json` |
| Setting up custom read-only workflow lists | Fetching remote packages or making network calls |

Every file copy operation requested by a plugin must match against a strict whitelist of safe directories:
* `.ai/plugins/`
* `.ai/registries/`
* `.ai/templates/`
* `.ai/skills/`
* `.ai/checks/`
* `.ai/prompts/`
* `.ai/adapters/`

---

## Plugin Commands

### 1. `plugin list`
Lists all plugins currently installed in the workspace directory.

```bash
npx multimodel-dev-os@latest plugin list [--json]
```

### 2. `plugin show`
Inspect the specifications, capabilities, and safety notes of an installed plugin.

```bash
npx multimodel-dev-os@latest plugin show <slug>
```

### 3. `plugin validate`
Validate a plugin manifest YAML file locally before submitting it to a repository. Ensures the manifest conforms to the JSON Schema and contains no safety violations.

```bash
npx multimodel-dev-os@latest plugin validate <path-to-yaml>
```

### 4. `plugin install`
Install a plugin from a local manifest file.

```bash
# Preview the planned copy actions (Dry Run)
npx multimodel-dev-os@latest plugin install <path-to-yaml>

# Apply the copy actions (Execution Gate)
npx multimodel-dev-os@latest plugin install <path-to-yaml> --approved

# Force overwrite of conflicting files (creates .bak backups)
npx multimodel-dev-os@latest plugin install <path-to-yaml> --approved --force
```

### 5. `plugin status`
Check the health status of installed plugins. Verifies if all declared templates, skills, or rules are present in their target `.ai/` directories.

```bash
npx multimodel-dev-os@latest plugin status [--target <path>]
```

---

## Overwrite Protection & Backup System

When a plugin installation causes file conflicts:
* By default, the installer aborts and prints a list of conflicting files.
* Running with `--force` overwrites the destination files but automatically copies the existing file to `<filename>.bak` in the same directory.

---

## Validation & Safe Execution Gates

To prevent path traversal and enforce robust script auditing:
* **Alphanumeric Slug Constraints**: Slugs are validated against `/^[a-z0-9-_]+$/i` to block directory escapes when writing to `.ai/plugins/<slug>.yaml`.
* **Path Boundary checks**: The `plugin validate` CLI command automatically parses `allowed_file_patterns` to assert they fit within whitelisted `.ai/` and `adapters/` folders, checking that no `..` traversal or blacklisted files are referenced.
* **Non-zero CI exit codes**: If `plugin install` is called without the `--approved` flag, it prints planned actions and exits with **exit code 1** to abort scripting pipelines safely.

---

## Workflow Marketplace & Plugin Catalog

In `v2.9.0`, MultiModel Dev OS introduces a curated local **Workflow Marketplace & Plugin Catalog** for discoverability of safe first-party plugins. For catalog operations, see the [Workflow Marketplace Catalog Guide](/catalog).
