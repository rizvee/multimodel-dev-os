# Changelog

## [Unreleased] — v3.5.0-prep: Trusted Registry Signing + Provenance Foundation

### Added
- **Verdict Module** (`src/registry/verdict.js`): Implemented `createTrustVerdict` to generate structured, machine-readable trust status reports for local lockfiles and audit logs.
- **Offline E2E Signed Registry Fixtures** (`tests/fixtures/signed-registries/`): Generated offline test fixtures covering valid-signed, tampered-manifest, wrong-key, revoked-key, unsigned-remote-required, and unsupported-algorithm states.
- **E2E verification tests** (`tests/unit/registry-e2e-signature-fixtures.test.js`): Added E2E verification test suite validating signature blocks, keys, policy defaults, and CLI command outputs.
- **Core Security & Readiness Docs**: Published `docs/security-threat-model.md` and `docs/v3.5.0-readiness.md` to establish threat modeling mitigation layers (STRIDE) and checklist targets.
- **Updated Sitemaps and Discovery Links**: Integrated new security pages and commands into `docs/.vitepress/config.js`, sitemaps, and LLM text indices (`llms.txt`, `llms-full.txt`).
- **Public-Key Registry Signatures** (`src/registry/signing.js`): Extended the signing module to support Ed25519 asymmetric keypairs, deterministic canonical JSON payload serialization, normalizing PEM/SPKI formatted public keys, and multi-signer signature block verification (zero runtime dependencies).
- **Trusted Key Store** (`src/registry/trust-store.js`): New module to parse, validate, and load trusted keys from `.ai/registries/trusted-keys.yaml` under strict status, active date, and scope constraint checks.
- **`registry trust` subcommands**: Added `registry trust list` and `registry trust show <key_id>` to inspect the trust store contents directly from the CLI.
- **Extended Registry Policies**: Configured default signature rules in `src/core/policy.js` (`allow_unsigned_local`, `allow_unsigned_bundled`, `allow_unsigned_remote`, `require_trusted_publisher`, `provenance_required`) to govern remote vs local registries safely.
- **Structured Schemas**: Created `.ai/schema/trusted-keys.schema.json` and updated `.ai/schema/registry-manifest.schema.json` and `.ai/schema/registry-policy.schema.json` to enforce public key schemas.
- **New Unit Test Suites**: Added `tests/unit/registry-public-signing.test.js` (9 tests), `tests/unit/registry-trust-store.test.js` (5 tests), and `tests/unit/registry-signature-policy.test.js` (6 tests). Total test count increased to 98 tests (all passing).
- **Expanded Release Verification**: Added assertions in `scripts/verify.js` for new public signing modules, schemas, trust store config files, policies, and unit tests.
- **Registry Provenance Lockfile** (`src/registry/provenance.js`): Implemented a tamper-evident `.ai/registry-lock.json` lockfile. Each registry sync writes a provenance entry recording the URL, catalog/manifest hashes, sync timestamp, and signatures.
- **Registry Signing Module** (`src/registry/signing.js`): Implemented HMAC-SHA256 signing and timing-safe verification using Node.js built-in `crypto` only (zero new runtime deps).
- **`registry keygen` subcommand**: Generates a 32-byte random signing key at `.ai/registry-signing-key` with mode `0o600`. Refuses to overwrite without `--force`.
- **`registry lock` subcommand**: Displays the current `.ai/registry-lock.json` lockfile state with signature status badges. Supports `--json` output.
- **Signing integration in `registry sync`**: signs `catalog_sha256` after sync, failing if `require_signature: true` and no key is present.
- **Provenance checks in `registry verify`**: Performs multi-layer validation — file integrity, lockfile hash match, and HMAC/Ed25519 signature checks.

### Security
- **Asymmetric trust boundary**: Signatures can be verified using public keys from the trust store without disclosing the private signing keys.
- **Gitignore enforcement**: `.ai/registry-signing-key` is automatically gitignored at the project level.
- **Timing-safe comparison**: Signature verification uses `crypto.timingSafeEqual` to prevent side-channel leaks.
- **Key file permissions**: Private key files are written with `0o600` (owner-only) permissions.




### Added
- **Build Freshness Auditing**: Integrated `check-build-fresh.js` to ensure the generated single-file CLI binary matches standard ES modules under `src/` dynamically.
- **Hardened Package Governance**: Configured the NPM manifest (`package.json`) to include the modular source folder (`src/`) and unit test suites (`tests/unit/`) for developer auditability, while verifying the strict exclusion of sensitive and temporary files.
- **Cross-Platform CI Pipeline**: Configured a complete multi-platform CI verification matrix on GitHub Actions covering Windows, Linux, and macOS across Node.js versions `20.x` and `22.x`.
- **Source and Test Packaging Inclusions**: Configured the npm package manifest (`package.json`) to include the modular source folder (`src/`) and unit test suites (`tests/unit/`) for developer auditability.
- **Build Output Unit Tests**: Implemented `tests/unit/build-output.test.js` validating shebang counts, warning headers, and URL safety.

### Fixed
- **Hardened Build Execution**: Configured `scripts/build-cli.js` to programmatically assert the entrypoint presence, set Unix executable permissions after compile, and enforce output header validations.
- **Hardened Release Auditing**: Expanded `scripts/verify.js` with shebang, header, path whitelisting, and dry-run file inclusion constraints.

## [3.1.0] - 2026-06-19

### Added
- **Modular Source Layout**: Refactored the monolithic CLI structure into clean, isolated modules under `src/` (core, registry, catalog, plugin, cli, etc.).
- **Esbuild Build Process**: Programmed a zero-runtime-dependency programmatic compiler script `scripts/build-cli.js` using esbuild to bundle modules into `bin/multimodel-dev-os.js` with shebang preservation and deterministic outputs.
- **Formal Unit Testing**: Integrated `vitest` unit test suites covering isolated YAML parsing, registry URL validation, policy checks, path safety boundaries, plugin manifest validations, and prepublish guard checks.
- **Improved Integration Verification**: Hooked the unit test runner and build step directly into the release audit `npm run verify` verification gate.

### Changed
- **Safety Sandboxing**: Extended `validatePluginManifest` to permit `adapters/` (project-root adapter paths) in addition to `.ai/` subdirectories to align with actual installer behavior.
- **Release Documentation**: Updated documentation references and installer scripts to support v3.1.0 parity.

## [3.0.2] - 2026-06-19

### Fixed
- **Registry Sync Command Injection Remediation**: Patched the synchronous fetch helper `fetchUrlSync` to use `execFileSync` instead of shell-based `execSync` interpolation. Registry URL inputs are passed strictly as process arguments (`process.argv[1]`), fully preventing shell injection risks.
- **Strict Registry URL Validation**: Implemented strict URL checking in `registry add` and sync execution paths. Registry URLs are parsed with `new URL()` and must use HTTPS by default. Credentials, whitespaces, quotes, backticks, and shell metacharacters are rejected.
- **Diagnostics Validation**: Added strict URL validations to `registry show`, `registry verify`, and source loading paths.
- **Local Host HTTP Option**: Added `allow_http_localhost` policy flag to `loadRegistryPolicy` defaults (disabled by default) to optionally allow HTTP local development registries under localhost or 127.0.0.1.

## [3.0.1] - 2026-06-19

### Added
- **Enhanced Registry UX**: Improved CLI outputs for `registry status`, `registry list`, `registry show`, `registry verify`, and `registry sync` with clearer labels and next-step actions.
- **Hardened Policy Safety**: Clarified remote registry policy defaults (disabled by default) and safety boundaries (offline verify, no automated installs, path sandboxing).
- **Offline Integrity Diagnostics**: Added distinct local/offline verification labels for `bundled` and `local` catalog sources.

### Fixed
- **Prepublish Guard Rule**: Patched the prepublish guard to permit publishing stable major versions >= 2 (e.g. v3.x.x) under `MMDO_ALLOW_PUBLISH=true`.
- **Registry Error Handling**: Improved error output when displaying non-configured registry sources.
- **Release Version Parity**: Bumped installer script version variables and sitemap indexes to preserve v3.0.1 release consistency.

## [3.0.0] - 2026-06-17

### Added
- **Trusted Remote Registry Sync**: Introduced the `registry` CLI command suite allowing users to optionally sync remote catalogs, including `list`, `add`, `remove`, `sync`, `status`, `verify`, `show`, and `cache clear` commands.
- **Declarative Security Policy Engine**: Implemented `.ai/policies/registry-policy.yaml` governing remote registries, with opt-in defaults, permitted write directories, blocked file paths, size limits, allowed extensions, and registry trust levels.
- **SHA256 Integrity Verification**: Standardized SHA256 integrity verification inside registry manifest files, verified on sync and installation, using Node's native `crypto` module.
- **Source-Aware Catalog Loading**: Extended `loadCatalog` and existing `catalog` commands with `--source` and `--all-sources` flags, ensuring seamless prioritization across bundled, local, and synced remote registries.
- **TUI Dashboard Integration**: Added a read-only "Registry Sources & Cache" submenu to the zero-dependency keyboard-interactive command center.
- **Zero-Dependency Core**: Deployed the remote integration layer natively using Node's built-in modules (`https`, `crypto`, `fs`, `path`).
- **Comprehensive Documentation**: Added five new manuals (`registry-sync.md`, `trusted-registries.md`, `registry-policy.md`, `registry-security.md`, and `remote-catalog-authoring.md`) and updated sitemaps, configs, and existing guides.

## [2.9.1] - 2026-06-17

### Added
- **YAML Parser Safety Check**: Implemented a quote scanner in `parseYaml` to only strip comments outside quotes, and added flow-style array parsing support (`[a, "b", 123]`) using `parseFlowArray`.
- **Parser Type Preservation**: Ensured quoted numbers and booleans (e.g. `version: "1.0"`) are kept as strings instead of being converted to integers/booleans.
- **Improved UX Outputs**: Polished terminal formatting layouts, alignment paddings, and safety status indicators for all catalog subcommands.
- **Search Empty State Warning**: Added custom warning logs for zero-match search results.
- **Expanded Verification Tests**: Added flow arrays, comment-aware parsing, and empty search terminal check assertions to `scripts/verify.js`.

## [2.9.0] - 2026-06-16

### Added
- **Workflow Marketplace**: Curated index catalog (`catalog.yaml` and `.ai/plugins/catalog/`) packaging 6 first-party plugins for Git, SEO, WordPress, Next.js, E-commerce, and releases.
- **Catalog CLI Commands**: Added `catalog list`, `catalog search`, `catalog show`, `catalog categories`, `catalog recommend`, `catalog install`, and `catalog status` to the zero-dependency CLI.
- **Recommendation Engine**: Automatically ranks and recommends marketplace plugins using package scripts, frameworks, languages, and repo type heuristics.
- **TUI Dashboard Integration**: Integrated read-only catalog actions (list, search, recommend, status) directly into the interactive command center.
- **Robust Safety Boundaries**: Reuses the plugin installer validations (traversal protection, whitelist directories, backup overwrites, and exit code 1 gates).

## [2.8.1] - 2026-06-16

### Added
- **Plugin Validation Checklists**: Implemented strict alphanumeric slug validation (`/^[a-z0-9-_]+$/i`) and whitelisted boundary pattern assertions in the `validate` command.
- **Detailed Asset Audits**: Improved `plugin status` to list the exact filenames of any missing assets.
- **TUI list-actions flag**: Added `--list-actions` parameter to bypass TUI rendering and print clean grouped action previews.

### Changed
- **Scripting Friendly Refusal**: Updated `plugin install` without `--approved` to fail with exit code 1.
- **Polished CLI Layouts**: Grouped and padded headless command preview lists for clean terminal alignment and dynamic target folder mapping.

## [2.8.0] - 2026-06-16

### Added
- **Interactive TUI Dashboard**: Added `dashboard`/`ui` command launching a zero-dependency keyboard-interactive command center built with Node's native `readline` module.
- **Declarative Plugin Hooks**: Added `plugin` command suite (`list`, `show`, `validate`, `install`, `status`) and JSON schema to securely extend workspace templates, workflows, and skills.
- **Secure Plugin Installer**: Supports `--approved` execution gate, path whitelisting to `.ai/` and `adapters/` directories, and automatic conflict `.bak` backups.
- **Headless Fallback**: Automatically degrades to listing CLI commands in non-TTY/CI environments.

### Changed
- Improved YAML parser helper in `bin/multimodel-dev-os.js` to strip quotes from array items.
- Added comprehensive documentation pages: `dashboard.md`, `plugin-hooks.md`, `plugin-authoring.md`, `tui-safety.md`.
- Updated all existing documentation portals, config sidebars, sitemaps, and LLM assistant discovery files for v2.8.0 compatibility.

## [2.7.0] - 2026-06-16

### Added — Website / Demo / Distribution System
- Added 5 copy-paste demo workflow pages: existing-repo-onboarding, multi-agent-handoff, safe-improvement-loop, adapter-sync, and release-check
- Added demo hub page with guided navigation cards
- Added comprehensive distribution and release documentation
- Added new SVG visual assets for onboarding and adapter sync flows
- Added docs-first examples for real-repo-onboarding, adapter-sync, command-center, and safe-improvement-loop workflows

### Changed
- Restructured VitePress homepage as a product conversion funnel
- Improved README with updated roadmap, demo links, and v2.7 highlights
- Rewrote launch kit with current v2.7.0 positioning (was stale at v0.8.0)
- Refreshed comparison guide with Aider, Roo Code, and Continue comparisons
- Updated FAQ with demo-specific safety and execution details
- Updated SEO metadata, sitemap, llms.txt, and llms-full.txt for v2.7.0
- Updated v2 roadmap: rescheduled TUI/plugin hooks to v2.8.0
- Refreshed SVG assets with updated commands and architecture layers

## [2.6.1] - 2026-06-16

### Changed — Documentation Discovery + GitHub Star Growth Patch
- Rewrote README for faster developer understanding and stronger GitHub conversion
- Added clearer feature positioning for onboarding, memory, workflow, adapters, and safe improvement proposals
- Refreshed VitePress homepage with sharper value proposition and v2.6 highlights
- Updated quickstart to include existing-repo onboarding and adapter sync workflows
- Expanded FAQ with practical developer questions around safety, MCP, model support, and Cursor/Roo/Aider differences
- Improved comparison guide with clearer decision matrix
- Updated architecture docs for Intelligence and Onboarding layers
- Refreshed v2 roadmap to reflect shipped v2.6 reality and future v2.7/v3.0 direction
- Improved CLI reference for new onboarding and adapter commands
- Improved CONTRIBUTING guide with good-first-issue guidance
- Removed stale version references and outdated roadmap claims

## [2.6.0] - 2026-06-11

### Added
- **Real-Repo Onboarding**: Added `onboard` command suite (`analyze`, `recommend`, `plan`, `apply`, `status`) to safely analyze project structures and bootstrap AI Dev OS configs inside existing repositories.
- **Onboarding Reports & Plans**: Generates structured `.ai/intelligence/onboarding.plan.json` plans and human-readable `.ai/intelligence/onboarding.report.md` files.
- **IDE Adapter Synchronization**: Added `adapter` command suite (`status`, `diff`, `sync`) to mirror rule and configuration files (e.g. `.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`) from bundled templates based on enabled status.
- **Template Recommendation Engine Heuristics**: Matches project directory signatures to recommended profile templates with confidence scores.
- **Safety Overwrite & Backups**: Enforces that file overwrites require `--force` and automatically generate `<filepath>.bak` backups.
- **Doctor Onboarding Diagnostics**: Extended `doctor` command with `--onboarding` flag to verify crucial root files, configurations, and git-ignored plan files.

## [2.5.1] - 2026-06-11

### Fixed
- **Command Center Initialization**: Bootstraps command-center registry assets (`.ai/registries/workflows.yaml`, `capabilities.yaml`, `tools.yaml`, `.ai/proposals/README.md`, `.ai/intelligence/README.md`) on `init`.
- **Bundled Workflow Fallback**: Enabled workflow commands to fall back to the bundled workflow registry in the package when local registry is missing.
- **Fresh Repository UX**: Improved status, doctor, and handoff commands output and recommendations for fresh repositories.

## [2.5.0] - 2026-06-11

### Added
- **Repository Command Center**: Added `status` command to show a compact operational dashboard of package details, framework signals, memory freshness, feedback loop counts, proposals, and apply log audits.
- **Workflow Orchestration Runner**: Added `workflow` command with `list`, `show`, `plan` (dry-run), and `run` subcommands to coordinate multi-agent cycles safely. Standard workflows include `repo-health`, `memory-refresh`, `feedback-review`, `proposal-review`, and `release-check`.
- **Safe Execution Boundaries**: Strictly gated the workflow runner from applying proposals (`improve apply`) or running destructive shell/npm commands. Any steps requiring changes halt and print manual instructions.
- **Agent Handoff Specification**: Added `handoff` command with `build` and `show` subcommands to compile token-compressed session context to `.ai/intelligence/handoff.md`.
- **Intelligence Doctor Diagnostics**: Extended `doctor` command with `--intelligence` flag to verify memory index freshness, feedback logs, proposal files, `.gitignore` exclusions, and scan for credential leaks.
- **Unified Command Center Guides**: Added detailed documentation manuals: `repository-command-center.md`, `workflow-orchestration.md`, and `agent-handoff.md`.

## [2.4.1] - 2026-06-11

### Changed
- **Validation Checklist**: Improved `improve validate` to print a structured, colored checklist for the 7 safety gates (Frontmatter, Approval Status, JSON Block, Operation Types, Boundaries, Permissions, Constraints) with short and actionable fixes on refusal.
- **Grouped Diff Previews**: Enhanced `improve diff` to display grouped operations by type, unique affected files list, total statistics, and token-safe truncated file/replacement previews.
- **Detailed Apply UX**: Added compact pre-execution operation summaries, explicit `[CREATED]`, `[OVERWRITTEN]`, `[APPENDED]`, and `[IDEMPOTENT] (skipped)` indicators, and reported the exact count of replacements made for `replace_text`.
- **Refused Proposal Logging**: Hardened audit logging to record refused/failed attempts inside `.ai/proposals/apply-log.jsonl` with `status: 'refused'` (or `'failed'`) and `refused_reason`.
- **Harden Protected Paths**: Explicitly blocked reading or modifying `apply-log.jsonl` via safety gates.
- **Fixtures and Docs**: Added extended fixtures for validation testing and updated documentation describing the recommended verification workflow.

## [2.4.0] - 2026-06-11

### Added
- **Approved Proposal Application Engine**: Added `improve validate`, `improve diff`, and `improve apply` subcommands to automatically execute machine-readable deterministic operations from proposal files under strict safety gates.
- **Applied Proposals Audit Log**: Added `improve log` command and append-only `.ai/proposals/apply-log.jsonl` audit log to track successful proposal executions, computing file SHA-256 pre-hashes and post-hashes.
- **Deterministic Operations Format**: Support optional JSON code blocks mapping `create_file`, `append_line`, and `replace_text` operations.
- **Strict Safety Gates**: Enforced 12 safety checks including target path boundary containment, protected path blocks (e.g. `.git/`, `.env`, `node_modules/`), idempotency, and explicit user approval flag (`--approved`).
- **Ignore list updates**: Automatically ignore audit logs in git and scanning engines.

## [2.3.0] - 2026-06-10

### Added
- **Feedback Learning Loop**: Added `feedback` command with `add`, `list`, and `summarize` subcommands to capture developer corrections/overrides and compile them into local instructions (`learning-rules.md`).
- **Codebase Improvement Proposals**: Added `improve` command with `propose`, `review`, and `status` subcommands to scan codebase state and draft structured optimization proposal markdown files under `.ai/proposals/` with Frontmatter validation.
- **Safety Gate Controls**: Implemented read-only proposal drafting, with strict write-protection rules on core CLI/script folders and manual developer approval gates.
- **Exclusion Filters**: Mapped feedback logs, compiled learning rules, and proposals to codebase scanner and gitignores to prevent recursive indexing or git leaks.

## [2.2.0] - 2026-06-10

### Added
- **Codebase Scanner**: Added new `scan` command to inspect frameworks, package managers, and AI Dev OS files.
- **Hash-Compressed Memory Engine**: Added `memory build`, `memory refresh`, and `memory diff` commands to index repository files into `.ai/intelligence/memory.hash.json` and `.ai/intelligence/memory.summary.md`.
- **Ignore & Secret-Safety Rules**: Mapped recursive ignore patterns (e.g. `node_modules`, `dist`, `.next`) and secret exclusions (e.g. `.env`, `.npmrc`, `.keystore`) to prevent key leakage and context bloat.
- **Documentation & Verification**: Fully documented scanning/memory commands and added 4 new release pre-flight verification guards to `scripts/verify.js` (total 197 assertions).

## [2.0.1] - 2026-06-10

### Added
- **GitHub Community Files**: Added pull request template `.github/PULL_REQUEST_TEMPLATE.md`, template requests issue template `.github/ISSUE_TEMPLATE/template_request.md`, and issue configuration rules `.github/ISSUE_TEMPLATE/config.yml`.
- **Registry Discoverability**: Added newly introduced docs pages (`model-routing.md`, `local-models.md`, `provider-strategy.md`, `agent-compatibility.md`, `adapter-authoring.md`, `template-authoring.md`, `skill-authoring.md`, `v2-migration.md`, `package-safety.md`, `registry-contribution.md`) to the hosted sitemap `docs/public/sitemap.xml`.

### Changed
- **Documentation Polish**: Cleaned up stale source-only warnings, local-only CLI instructions, and NPM pause notices across `README.md`, `docs/index.md`, `docs/quickstart.md`, `docs/templates-guide.md`, `docs/faq.md`, `docs/release-policy.md`, `docs/cli-roadmap.md`, `docs/npm-publishing.md`, and discoverability indexes (`llms.txt`, `llms-full.txt`).
- **CLI UX Enhancements**: Refined output prompts in `bin/multimodel-dev-os.js` to log more helpful next-step copying guidelines after `init` scaffolds successfully, and made planned template fallbacks clearer.
- **Installer Version Parity**: Bumped version pins to `2.0.1` in `scripts/install.sh` and `scripts/install.ps1`.
- **Prepublish Safety Guard**: Polished warning message in `scripts/prepublish-guard.js` to prompt for explicit release approvals.

## [2.0.0] - 2026-06-09

### Added
- **Model Compatibility & Routing Layer**: Configured model registries under `.ai/models/` (`registry.yaml`, `providers.yaml`, `routing-presets.yaml`, `local-models.yaml`).
- **Adapter Registry Expansion**: Added central mappings under `.ai/adapters/registry.yaml` and expanded command options.
- **Android Expo Mobile Template**: Created a new high-fidelity mobile template under `examples/expo-react-native-android/` supporting production Android delivery and EAS Build setup.
- **New CLI registries subcommands**: Implemented `models`, `show-model`, `providers`, `route-model`, `adapters`, `show-adapter`, `skills`, `show-skill`.
- **Contributor Attribution**: Added credits in `CONTRIBUTORS.md` acknowledging Ssiyam0123 for mobile template inputs.
- **Roadmap Planning**: Added `docs/v2-roadmap.md` mapping v2.0.0 stabilization goals.

### Changed
- **Release Strategy**: Released v2.0.0 stable version to public npm registry.
- **Linter Adjustments**: Updated `scripts/verify.js` to assert the presence of prepublish guard modules and roadmap pages.

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
