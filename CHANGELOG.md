# Changelog

All notable changes to multimodel-dev-os will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [0.5.0] - 2026-05-30

### Added
- **v0.5.0 Real-World Template Upgrade:** Replaced generic placeholders in all 5 built-in templates (`nextjs-saas`, `wordpress-site`, `ecommerce-store`, `seo-landing-page`, `general-app`) with rich, practical, high-fidelity real-world profiles.
- **Template Context Scaffolding:** Added essential layout files inside each template: `AGENTS.md`, `MEMORY.md`, `TASKS.md`, `.ai/config.yaml`, `.ai/context/project-brief.md`, `.ai/context/architecture.md`, `.ai/context/model-map.md`, `.ai/context/context-budget.md`, and custom `.ai/skills/[template-specific-skill].md`.
- **Command Diagnostics & Templates Commands:** Implemented pure Node zero-dependency commands: `templates`, `list-templates`, `show-template <name>`, `validate`, and `doctor`.
- **Validation Gates & Advisory Audits:** Strict compliance assertions via `validate` and advisory warning loops via `doctor` commands.
- **Improved Scaffolding Copy Pipelines:** Dynamic copy of template-specific directory overrides and global folders ensures pristine layout integrity.
- **Scaffolding Directories Guarantee:** Ensures `.ai/context`, `.ai/skills`, and `.ai/session-logs` are created during standard and `--caveman` runs.
- **Extended Documentation:** Added `docs/templates-guide.md` and updated all existing manuals.

## [0.4.0] - 2026-05-30

### Added
- GitHub Community Templates: Configured standardized bug reports, feature requests, and support templates in `.github/ISSUE_TEMPLATE/`.
- Modern NPX Quickstart Focus: Rewrote `README.md` and `quickstart.md` to establish global execution of `npx multimodel-dev-os@latest init` as the primary installation path.
- In-depth FAQ context: Explained the comparative value of `multimodel-dev-os` over manual unstructured rules configuration.
- Installer script parity: Synchronized fallback bash and PowerShell installer version pins to current release status.

## [0.3.0] - 2026-05-30

### Added
- Dynamic CLI Version Tracking: Programmed CLI to dynamically parse version metadata from `package.json` to prevent drifts.
- npm & npx Scaffolding Integration: Fully whitelisted packaging scopes and configured bin executables to support standard `npx` global installations.
- Pre-Flight Verification Checks: Added strict automated asserts verifying package.json specifications and npm tarball dry-runs in verify script.
- NPM Publishing Runbook: Created `docs/npm-publishing.md` detailed guide.

## [0.2.0] - 2026-05-30

### Added
- Dependency-Free Local CLI: Implemented core Node-based CLI `bin/multimodel-dev-os.js` supporting recursive scaffolding (`init`), option parsing, and directory validations (`verify`).
- Template Profiles: Added stack-specific template selections (`nextjs-saas`, `wordpress-site`, `ecommerce-store`, `seo-landing-page`, `general-app`).
- Overwrite Conflict Prevention: CLI automatically audits files and lists overwrite conflicts before touching the disk. Bypassed only via `-f, --force` flags.
- Dry-Run Option: Integrates `-d, --dry-run` to preview planned operations without mutating files.
- Testing Guide: Added `docs/testing-v0.2.md` comprehensive testing document.

## [0.1.1] - 2026-05-30

### Fixed
- README Quickstart: Fixed placeholder path to raw GitHub URL for Caveman Mode curl command.

### Added
- Supported Tool Matrix: Documented all adapter scopes and their reference mappings in a matrix table.
- Manual Setup Documentation: Added alternative installation instructions for users avoiding shell script downloads.
- Protocol/Convention Clarification: Explicitly clarified early in the README that v0.1 is a Markdown convention layer and not a background runtime engine.

## [0.1.0] - 2026-05-30

### Added
- Core template files: `AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`
- `.ai/` directory with config, orchestrator spec, caveman reference
- `.ai/skills/` — reusable agent skill templates
- `.ai/checks/` — pre/post action check templates
- `.ai/session-logs/` — agent session log directory
- `.ai/templates/` — Caveman Mode minimal-token variants
- Adapters for 6 tools: Codex, Antigravity, Cursor, Claude, Gemini, VS Code
- Cross-platform installers: `install.sh` (bash) and `install.ps1` (PowerShell)
- Documentation: architecture, adapter guide, caveman mode, orchestrator guide
- Example configs: Next.js app, Python API
- `CONTRIBUTING.md`, `LICENSE` (MIT), `.editorconfig`, `.gitignore`
