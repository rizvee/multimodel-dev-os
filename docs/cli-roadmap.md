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

## Requirements Completed in v0.5.0

- [x] Implemented strict `validate` CLI command for structural directory validation.
- [x] Implemented advisory `doctor` command for project compatibility warnings.
- [x] Implemented `templates` and `show-template` commands for built-in profiles inspection.
- [x] Upgraded all 5 built-in template profiles with practical real-world contents.
- [x] Implemented dynamic context budgetary constraints and skills validation.
- [x] Preserved zero-dependency pure Node CLI implementations.

## Future Releases (v0.6.0+)

* **Adapter Autoregeneration (`sync`):** Parse custom override boundaries inside adapters and automatically synchronize them with updates in the root markdown source of truth.
* **Interactive Mode:** Provide step-by-step CLI options if run without arguments.

## Protocol Stabilization & v1.0.0 Freeze (v0.9.0)

In version **v0.9.0**, we pivot the roadmap to focus on **stabilization and hardening** ahead of the official `v1.0.0` freeze:
- **API Freeze:** The CLI syntax, standard command names (`init`, `verify`, `validate`, `doctor`, `templates`), and dynamic flags are frozen to ensure zero breaking changes in future minor patches.
- **Robust JSON Schemas:** Added standard validators inside `.ai/schema/` to define config and template formats.
- **Continuous Integration Gates:** Transitioning `validate` to serve as a strict build blocker for pulling and publishing code.
- **Enhanced Warning Paths:** Hardened CLI error messaging when directory write conflicts occur, mapping absolute paths cleanly.

