# 5-Day AI Dev OS Adoption Roadmap

Getting engineering teams aligned under a shared, zero-drift AI configuration doesn't require sweeping repository changes. This tool-neutral, step-by-step roadmap outlines how to fully integrate `multimodel-dev-os` within a business week.

---

## Horizontal Milestones

The timeline maps the progress from a fresh install to automated pull request verifications:

![5-Day Adoption Roadmap](/assets/ai-dev-os-roadmap.svg)

---

### Day 1: Install & Scaffold (Scaffold the CLI)
- **Objective:** Deploy the zero-dependency CLI scaffolding pipeline.
- **Tasks:**
  1. Initialize the shared directories and central core files:
     ```bash
     npx multimodel-dev-os@latest init
     ```
  2. Confirm that target folders (`.ai/context`, `.ai/skills`, `.ai/session-logs`) exist.
  3. Run a dry-run check to verify setup constraints:
     ```bash
     npx multimodel-dev-os@latest init --dry-run
     ```

---

### Day 2: Fill Project Memory (Core Workspace Contracts)
- **Objective:** Author the central single source of truth files.
- **Tasks:**
  1. Edit [AGENTS.md](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/AGENTS.md) — detail your project overview, technology stack, build commands, and strict directory boundaries (`no-touch` blocks).
  2. Edit [MEMORY.md](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/MEMORY.md) — log architectural decisions, third-party credentials rules, and project milestones.
  3. Verify file placement is correct inside the root folder.

---

### Day 3: Configure Skills & Checks (Custom Prompt Packs)
- **Objective:** Assemble reusable instructions for common development routines.
- **Tasks:**
  1. Author specific command workflows inside [.ai/skills/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/skills/) (e.g. database setup scripts, feature-specific build guidelines).
  2. Define validation constraints in [.ai/checks/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/checks/) (e.g. regression checks, test coverage parameters).
  3. Edit [.ai/prompts/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/prompts/) to establish output formatting expectations.

---

### Day 4: Mount Adapters & Handoff Logs (Sync Environments)
- **Objective:** Synchronize the central rules with IDE settings and terminal agents.
- **Tasks:**
  1. Map adapters using the CLI command:
     ```bash
     npx multimodel-dev-os@latest init --adapter cursor --adapter claude --adapter vscode
     ```
  2. Confirm that `.cursorrules`, `CLAUDE.md`, and `.vscode/settings.json` mirror the central instructions properly.
  3. Execute a local hand-off by creating a session log template inside `.ai/session-logs/` to pass context between agents.

---

### Day 5: Run Audits & Foster Team Reuse (Compliance & CI/CD)
- **Objective:** Guard workspace structure health and enforce linter checkups.
- **Tasks:**
  1. Run the local structure verification:
     ```bash
     npx multimodel-dev-os validate
     ```
  2. Add validation gates to pre-commit hooks or CI workflows (e.g. `.github/workflows/verify.yml`).
  3. Run diagnostic checkups using the `doctor` command:
     ```bash
     npx multimodel-dev-os doctor
     ```
  4. Educate the engineering team on executing validations before pushing code blocks.
