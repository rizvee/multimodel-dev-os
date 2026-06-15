# TUI & Plugin Safety Model

MultiModel Dev OS enforces a sandboxed, low-risk execution model for both the Interactive TUI Dashboard and the Declarative Plugin System. This document outlines the security architecture and constraints that protect your development environment.

---

## Interactive Dashboard Safety

The `dashboard`/`ui` command acts as a wrapper around the existing CLI commands. 

### 1. Zero Arbitrary Code Execution
The TUI engine is written entirely using Node.js's native `readline` module. It does not pull in any external third-party interactive libraries or prompt managers at runtime. This guarantees that no untrusted node package codes are executed during dashboard rendering.

### 2. Explicit Approval Gates
Any operation that alters the workspace directory (such as adapter synchronization or onboarding template setup) is configured to run in **Dry-Run mode** by default. To apply modifications, the underlying command must be run directly from the shell with the explicit `--approved` and `--force` flags.

### 3. Equivalent Command Visibility
Before executing any action from the menu, the dashboard prints the exact CLI command in bold text. This removes hidden actions and teaches the developer the underlying tooling mechanics.

---

## Declarative Plugin Sandboxing

The plugin system allows community-contributed extensions while ensuring that they cannot infect the host machine or repository code.

### 1. Strictly Config-Based (YAML)
Plugins in MMDO cannot declare execution steps, binaries, or javascript files. They contain only metadata, workflow steps (mapping to pre-approved MMDO commands), and file paths to copy.

### 2. Path Whitelisting (Write Containment)
The installer restricts all plugin file copies to specific directories inside the workspace. The whitelisted paths are:
* `.ai/plugins/`
* `.ai/registries/`
* `.ai/templates/`
* `.ai/skills/`
* `.ai/checks/`
* `.ai/prompts/`
* `.ai/adapters/`

If a plugin manifest attempts to write to paths outside of these folders (such as `src/`, `lib/`, or `tests/`), the validator immediately throws an error and aborts the installation.

### 3. Blacklist Enforcement
The system hard-blocks write operations to critical files or directories to prevent credentials exposure or project hijack:
* `.env` and `.env.*` (secrets containment)
* `.git/` (git history protection)
* `.npmrc` (npm authentication protection)
* `node_modules/` (dependency safety)
* `package.json` and `package-lock.json` (preventing unauthorized package installations)

### 4. Overwrite & Conflict Backups
If a plugin attempts to copy files over existing workspace files:
* Without `--force`, the installation aborts with conflict warnings.
* With `--force`, the installer automatically creates backup copies (`<filename>.bak`) of the target files before overwriting them.

---

## Network & Package Quarantine

* **No Network Calls**: Neither the dashboard nor the plugin engine executes network queries (e.g. `curl`, `fetch`, or remote API calls). All plugin checks and file copy actions are performed 100% offline.
* **No Package Downloads**: Plugins cannot run `npm install` or call other package managers.
