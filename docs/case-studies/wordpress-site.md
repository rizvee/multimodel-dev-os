# Case Study: WordPress Theme & Plugin Scaffolding

An educational case study detailing how a development agency maintained strict PHP coding style conventions and folder boundaries.

---

## 1. The Problem
When developing themes and plugins inside a WordPress directory, coding assistants frequently poll the wrong directories, write test functions inside root assets, or suggest incorrect hooks. The agency needed to enforce strict directory limits so that models wouldn't touch core WordPress configurations (`wp-admin`, `wp-includes`, `wp-config.php`).

---

## 2. Old Workflow
1. The developer prompted the model to generate a custom plugin.
2. The assistant, unaware of workspace limits, edited files directly in the root directory.
3. Git status got polluted, and the developer had to manually revert the changes and re-explain theme folder hierarchies.

---

## 3. MultiModel Dev OS Setup
The agency defined boundaries inside [AGENTS.md](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/AGENTS.md):
- Explicit `no-touch` paths listed `/wp-admin/`, `/wp-includes/`, and `wp-config.php`.
- Centralized custom routines inside `.ai/skills/plugin-boilerplate.md` to guide quick plugin scaffolds.
- The advisory checkup `doctor` warned developers if local build caches compiled inside theme assets.

---

## 4. Files & Subcommands Used
- **Core Files:** `AGENTS.md`, `MEMORY.md`, `.ai/skills/plugin-boilerplate.md`, `.ai/config.yaml`
- **CLI Commands:**
  ```bash
  # Scaffold standard WordPress development configuration
  npx multimodel-dev-os init --template wordpress-site
  
  # Audit environment boundaries and check gitignore ignores
  npx multimodel-dev-os doctor
  ```

---

## 5. Outcome & Results
- **Pristine Workspace Boundaries:** AI assistants strictly followed the defined `no-touch` patterns and generated code blocks only within `/wp-content/themes/` and `/wp-content/plugins/` subfolders.
- **Improved Scaffolding Speed:** Zero false starts or directory pollution, cutting local manual revisions completely.

---

## 6. Reusable Design Pattern
**Strict Context Bounds:** Always define directory boundaries explicitly at the root level so that coding agents do not index or modify core engine files.
