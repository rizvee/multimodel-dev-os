# CLI Roadmap

> The zero-dependency CLI utility is fully integrated with `npm` and `npx` in v2.0.0!

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

Alternatively, you can run the CLI directly from cloned source during development:
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
| `models` | List configured model registry entries | v2.0.0 | ✅ Completed |
| `show-model` | Inspect settings for a model registry entry | v2.0.0 | ✅ Completed |
| `providers` | List configured model registry providers | v2.0.0 | ✅ Completed |
| `route-model`| Route a target prompt based on presets | v2.0.0 | ✅ Completed |
| `adapters` | List configured adapter registry entries | v2.0.0 | ✅ Completed |
| `show-adapter`| Inspect settings for an adapter registry entry | v2.0.0 | ✅ Completed |
| `skills` | List configured skill registry entries | v2.0.0 | ✅ Completed |
| `show-skill` | Inspect settings for a skill registry entry | v2.0.0 | ✅ Completed |

## CLI v2.0.0 Stabilization & Beyond

The `v2.0.0` stabilization milestone was completed successfully, hardening registries configurations, custom skill checking tools, and token size overrides. Any future subcommands or adapter sync mechanisms will follow SemVer guidelines to ensure full backward compatibility.


