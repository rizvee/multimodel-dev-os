# Changelog

All notable changes to multimodel-dev-os will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] - 2026-05-31

### Added
- **Visual Branding Integration**: Copied official `favicon.png` and `logo.png` into the public docs folders and configured favicon references and display blocks.
- **VitePress SEO Head tags**: Integrated canonical links, mobile viewport settings, theme parameters, robots tags, Open Graph properties (title, image, description, URL), and Twitter card metadata.
- **Structured JSON-LD Schema**: Embedded standard `SoftwareApplication` structured schemas within hosted pages to support automated web indexing and search results formatting.
- **AEO & GEO Discoverability files**: Added `docs/public/llms.txt` and `docs/public/llms-full.txt` to align AI assistant ingestion parameters, plus `robots.txt`, `sitemap.xml`, and `humans.txt` files.
- **Visual README Overhaul**: Redesigned `README.md` to feature the official logo near the top, add npm and verification badges, and provide localized relative asset paths.
- **Docs UX grids**: Implemented premium styled works-with panels and structured card navigation grids on the hosted homepage (`index.md`).

### Changed
- **Version Bump**: Bounded codebase release parameters to version `1.1.0`.
- **Expanded Verification Scripts**: Added strict file-existence checks inside the verifier suite targeting the new discoverability resources and logos.

## [1.0.0] - 2026-05-31

### Added
- **v1.0.0 Stable Specifications**: Created `docs/stable-protocol.md` to freeze multi-model configurations.
- **Policies & Final Guidelines**: Defined standard policies under `docs/release-policy.md`, `docs/support-policy.md`, and `docs/final-launch.md`.
- **v1.0.0 Quality Checks**: Published `docs/v1-checklist.md` checklist.

### Changed
- **Version Bump**: Updated repository release package configuration to target version `1.0.0`.
- **Verify Assertions**: Expanded verify script suite to ensure all release specifications are met dynamically.
- **Navigation Maps**: Integrated new policy files and guides within the hosted VitePress config sidebar links.

## [0.9.0] - 2026-05-31

### Added
- **Protocol & Specification Docs:** Published official specifications at `docs/protocol.md` mapping layers, adapters, and CLI contratos, plus compatibility guides across 6 tools (`docs/compatibility.md`).
- **JSON Validation Schemas:** Designed standard configuration JSON schemas inside `.ai/schema/` (`config.schema.json`, `template.schema.json`, `adapter.schema.json`) to enforce expected file formats.
- **Migration & QA Timelines:** Created a complete migration upgrade path playbook (`docs/migration-guide.md`) and template scaffolding acceptance playbook (`docs/template-qa.md`).
- **Freeze Readiness Audits:** Added strict v1.0.0 freeze checklist controls inside `docs/v1-readiness.md`.
- **Linter Expansions:** Hardened the dynamic zero-dependency verifier script (`scripts/verify.js`) to assert new protocol schemas and test blueprints exist.

### Changed
- **Visual Landing Redesign:** Overhauled `README.md` and VitePress homepage (`docs/index.md`) to integrate protocol stability guidelines.
- **Enhanced CLI Warning paths:** Improved error warning paths inside the binary CLI `bin/multimodel-dev-os.js` to log descriptive warnings when requested templates do not exist.

## [0.8.0] - 2026-05-31

### Added
- **Educational Case Studies:** Launched a Case Studies Gallery (`docs/case-studies/`) detailing 5 real-world scenarios (Next.js SaaS schema synchronization, WordPress themes boundaries, E-Commerce webhooks states, SEO landing Core Web Vitals targets, and Claude/Gemini hand-off session log protocols).
- **Cost & Context Playbook:** Authored a complete playbook (`docs/cost-optimization.md`) mapping 12 industry cost-reduction strategies directly to MultiModel Dev OS features.
- **5-Day Adoption Roadmap:** Created a step-by-step tool-neutral business playbook (`docs/5-day-roadmap.md`) to guide prompt standards implementation inside teams.
- **Lightweight SVG Visual Charts:** Engineered `assets/cost-optimization.svg` representing token context reductions and `assets/ai-dev-os-roadmap.svg` illustrating Day 1–5 Horizontal milestones.

### Changed
- **Visual Landing Redesign:** Overhauled `README.md` and VitePress homepage (`docs/index.md`) to embed visual roadmaps and playbooks links.
- **Improved Sharing Kit:** Updated launch metadata copy and social outlines inside `docs/launch-kit.md` focusing on context and token savings.
- **VitePress Sidebar integration:** Integrated Case Studies, roadmaps, and playbooks in `.vitepress/config.js` config sidebar categories.

## [0.7.0] - 2026-05-31

### Added
- **Premium Asset Designs:** Re-designed and expanded `assets/terminal-demo.svg`, `assets/social-preview.svg`, and `assets/architecture-preview.svg` to feature polished, modern vector art, system font stacks, and HSL gradients.
- **Interactive CLI Manual:** Developed a rich manual at `docs/demo.md` detailing the visual init pipeline and pure Node.js zero-dependency CLI subcommands.
- **Detailed Workflow Studies:** Added before/after workflow case studies at `docs/workflow-examples.md` showcasing context sync drift prevention and token saving capabilities.
- **Pre-Flight Release Templates:** Authored a standardized release checklist (`docs/launch-checklist.md`) and patch release playbook template (`docs/release-template.md`).
- **Improved Sharing Kit:** Polished ready-to-share promotional copy blocks inside `docs/launch-kit.md` for Twitter/X, LinkedIn, Hacker News, and Reddit campaigns.

### Changed
- **Redesigned Landing Hubs:** Completely overhauled `README.md` and VitePress `docs/index.md` homepage designs with embedded vector previews and instant quickstarts.
- **Aligned Comparison Matrix:** Refined comparison guide details inside `docs/comparison.md` and `docs/quickstart.md` options.

## [0.6.1] - 2026-05-30

### Fixed
- **Dynamic Version Verification:** Hardened release audit verifiers (`verify.js` and `verify.sh`) to extract target versions dynamically from `package.json` with zero hardcoding, resolving GitHub Actions "Verify Repository Structure" failure.
- **NPM Package Hygiene:** Filtered VitePress local cache (`docs/.vitepress/cache`) and built distribution (`docs/.vitepress/dist`) directories from published npm tarballs while retaining required documentation source files.

## [0.6.0] - 2026-05-30

### Added
- **VitePress Docs Site:** Developed a premium, lightweight interactive documentation site with dynamic search, optimized styling, and clear design blueprints.
- **Auto-deployment Flow:** Configured GitHub Actions integration to auto-compile and deploy VitePress static distribution bundles directly to GitHub Pages.

## [0.5.1] - 2026-05-30

### Fixed
- **Cross-Platform Verifier:** Created `scripts/verify.js` Node script for cross-platform release verification with zero external dependencies (working on Windows, macOS, and Linux).
- **Default Template Validation:** Set default template adapter states to `false` in `.ai/config.yaml` templates so that default `init` command runs validate without errors.
- **Strict Adapter Requirements:** Updated `validate` and `doctor` commands to strictly require root adapter rules files (`.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, `.gemini/settings.json`) *only* when the adapter is explicitly marked `true` (enabled) in `.ai/config.yaml`.
- **Improved Root Adapter Installation:** When running `init` with `--adapter <name>`, automatically copies the corresponding rule files (e.g. `.cursorrules`, `CLAUDE.md`, etc.) directly to the root of the project target, and dynamically sets the adapter status to `true` in target `.ai/config.yaml`.
- **Installer Version Sync:** Synchronized `install.sh` and `install.ps1` to reflect `v0.5.1` version parity.

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
