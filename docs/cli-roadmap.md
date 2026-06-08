# CLI Roadmap

> The zero-dependency CLI utility is fully integrated with `npm` and `npx` in v0.3.0!

## Current CLI Usage

Recommended way to execute the CLI globally via npx:

```bash
# Initialize standard configuration in current directory
npx multimodel-dev-os@latest init

# Initialize with specific template and adapters
npx multimodel-dev-os@latest init --template nextjs-saas --adapter cursor --adapter claude

# Run dry-run preview before executing file writes
npx multimodel-dev-os@latest init --dry-run

# Force overwrite existing files
npx multimodel-dev-os@latest init --force

# Check structural health of target directory
npx multimodel-dev-os@latest verify
```

Alternatively, you can run the CLI locally within a cloned workspace:
```bash
node bin/multimodel-dev-os.js init
node bin/multimodel-dev-os.js verify
```

| Command | Purpose | Target Version | Status |
|---------|---------|----------------|--------|
| `init` | Scaffold multimodel-dev-os into a project | v0.2.0 | ✅ Completed |
| `verify` | Check that all required files exist and are valid | v0.2.0 | ✅ Completed |
| `templates` | List all built-in template profiles with details | v0.5.0 | ✅ Completed |
| `show-template` | Inspect stack specifications of a template | v0.5.0 | ✅ Completed |
| `doctor` | Advisory checkup of workspace compatibility | v0.5.0 | ✅ Completed |
| `validate` | Strict directory schema compliance checks | v0.5.0 | ✅ Completed |
| `sync` | Regenerate adapter files from root AGENTS.md | v0.6.0 | 📋 Planned |
| `add-adapter` | Add a new adapter to the project | v0.6.0 | 📋 Planned |
| `models` | List configured model registry entries | v1.2.0 | Source Only |
| `show-model` | Inspect settings for a model registry entry | v1.2.0 | Source Only |
| `providers` | List configured model registry providers | v1.2.0 | Source Only |
| `route-model`| Route a target prompt based on presets | v1.2.0 | Source Only |
| `adapters` | List configured adapter registry entries | v1.2.0 | Source Only |
| `show-adapter`| Inspect settings for an adapter registry entry | v1.2.0 | Source Only |
| `skills` | List configured skill registry entries | v1.2.0 | Source Only |
| `show-skill` | Inspect settings for a skill registry entry | v1.2.0 | Source Only |

> [!NOTE]
> All new `v1.2.0` subcommands listed as **Source Only** are fully implemented in the source code but are unreleased on the npm package registry. To run them, execute from a clone of the GitHub repository. They will be packaged officially in the `v2.0.0` stable release.

## CLI v2.0.0 Stabilization Goal

Ahead of the `v2.0.0` release, we will run a comprehensive compatibility pass:
* **Backward Compatibility**: Ensure that all new registries configurations and subcommand syntax do not break the stable `v1.0.0` and `v1.1.0` CLI behaviors.
* **Unified Quality Gates**: Integrate model registry and adapter configuration validation parameters directly into the standard `validate` and `doctor` command pipelines.
* **Cross-Platform Hardening**: Audit all commands on Windows (PowerShell/CMD), macOS, and Linux bash environments before resuming npm package publishing.


