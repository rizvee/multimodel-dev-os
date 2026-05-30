# Changelog

All notable changes to multimodel-dev-os will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

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
