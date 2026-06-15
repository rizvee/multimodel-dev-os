# Example: Adapter Sync

Sync your AGENTS.md rules to `.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, and more — automatically.

## Prerequisites

- Node.js 18+
- A MultiModel Dev OS workspace (`npx multimodel-dev-os@latest init`)

## Commands

```bash
# Check which adapters are enabled/disabled
npx multimodel-dev-os@latest adapter status

# Preview diff for a specific adapter
npx multimodel-dev-os@latest adapter diff cursor

# Sync all enabled adapters (requires approval)
npx multimodel-dev-os@latest adapter sync all --approved

# Verify workspace health
npx multimodel-dev-os@latest validate
```

## Expected Result

```
🔄 Syncing adapters...
  CREATE .cursorrules
  CREATE CLAUDE.md
  CREATE .vscode/settings.json
✅ 3 adapters synced.
```

## Safety

- `adapter status` and `adapter diff` are read-only
- `adapter sync` requires `--approved` flag
- Existing files need `--force` to overwrite
- All overwrites create `.bak` backups

## Full Demo

See the [complete walkthrough](/demos/adapter-sync) for step-by-step instructions.
