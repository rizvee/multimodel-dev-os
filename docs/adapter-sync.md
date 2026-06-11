# IDE & Coding Agent Adapter Sync

The `adapter` command system synchronizes target IDE configurations and coding agent rule files (e.g. `.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`) from bundled templates based on enabled states in `.ai/config.yaml`.

## Adapter Commands

```bash
# 1. Show the synchronization status of all adapters
npx multimodel-dev-os adapter status --target .

# 2. Preview rules to write for a specific adapter
npx multimodel-dev-os adapter diff cursor --target .

# 3. Synchronize rule files for a specific adapter
npx multimodel-dev-os adapter sync cursor --target . --approved

# 4. Synchronize all enabled adapters
npx multimodel-dev-os adapter sync all --target . --approved
```

## Overwriting Existing Files

By default, the synchronizer skips existing rules files to prevent overwriting user customizations. Use the `--force` option to overwrite, which automatically creates a backup with a `.bak` suffix.

```bash
npx multimodel-dev-os adapter sync all --target . --approved --force
```
