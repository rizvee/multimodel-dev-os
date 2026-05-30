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

## CLI Roadmap & Commands Status

| Command | Purpose | Target Version | Status |
|---------|---------|----------------|--------|
| `init` | Scaffold multimodel-dev-os into a project | v0.2.0 | ✅ Completed |
| `verify` | Check that all required files exist and are valid | v0.2.0 | ✅ Completed |
| `sync` | Regenerate adapter files from root AGENTS.md | v0.4.0 | 📋 Planned |
| `add-adapter` | Add a new adapter to the project | v0.4.0 | 📋 Planned |

## Requirements Completed in v0.3.0

- [x] Published package to npm registry as `multimodel-dev-os` supporting `npx` global launches
- [x] Configured whitelisted dynamic `package.json` version reading in CLI
- [x] Programmed strict packaging dry-runs and automated bundle structure audits
- [x] Standardized zero-dependency command option parsers

## Future Releases (v0.4.0+)

* **Public Adoption Polish:** Update README, docs architecture, and shell installers to prioritize `npx` workflows.
* **Adapter Autoregeneration (`sync`):** Parse custom override boundaries inside adapters and automatically synchronize them with updates in the root markdown source of truth.
* **Interactive Mode:** Provide step-by-step CLI options if run without arguments.
