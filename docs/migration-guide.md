# Migration Guide: Upgrading MultiModel Dev OS

This guide assists engineering teams in upgrading their MultiModel Dev OS configurations across releases, preparing repositories for v1.0.0 compliance.

---

## 1. Upgrading from v0.1 to v0.5

The `v0.5` release introduced the pure-Node local CLI and template scaffolding directories.

### Upgrade Steps:
1. **Directory Scaffolding:** Create the Lower-case subfolders under `.ai/` if they do not exist:
   ```bash
   mkdir -p .ai/context .ai/skills .ai/session-logs
   ```
2. **Move Custom Rules:** Scrape old system prompt snippets from `.cursorrules` and modularize them into isolated files inside `.ai/context/` (e.g. `project-brief.md`, `architecture.md`).
3. **Configure Adapters Settings:** Create [.ai/config.yaml](../.ai/config.yaml) and configure adapter mappings:
   ```yaml
   version: "0.5.0"
   adapters:
     cursor: true
     claude: true
   ```

---

## 2. Upgrading from v0.5 to v0.8

The `v0.8` release focused on cost/context optimizations, adding the 12 playbook techniques and visual timelines.

### Upgrade Steps:
1. **Enable Caveman Mode:** Set up Caveman minimal-token files inside `.ai/templates/` to allow rapid chat turns under tight budgets.
2. **Deploy Session Logs:** Confirm a `session-log-template.md` exists in `.ai/templates/` and create [.ai/session-logs/README.md](../.ai/session-logs/README.md) to manage sequential handoffs.
3. **Audit Workspace compliance:** Run the linter to diagnostic environment issues:
   ```bash
   npx multimodel-dev-os doctor
   ```

---

## 3. Upgrading from v0.9.0 to v1.0.0 Stable

The `v1.0.0` release completely freezes the public protocol and schemas.

### Upgrade Steps:
1. **Mount JSON Schemas:** Verify that config schemas under `.ai/schema/` are linked in your local configuration files.
2. **Execute Strict Validations:** Enforce strict assertions inside your pull requests or pre-commit hooks:
   ```bash
   npx multimodel-dev-os validate
   ```
3. **Run Diagnostics Suite:** Execute the full verification and doctor suite to ensure absolute compliance:
   ```bash
   npx multimodel-dev-os doctor
   ```
