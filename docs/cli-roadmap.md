# CLI Roadmap

> Future `npx multimodel-dev-os init` command. Not implemented in v0.1.

## Planned Usage

```bash
# Interactive setup
npx multimodel-dev-os init

# With options
npx multimodel-dev-os init --adapters codex,cursor
npx multimodel-dev-os init --caveman
npx multimodel-dev-os init --example nextjs-app

# Check health
npx multimodel-dev-os verify

# Sync adapters from source of truth
npx multimodel-dev-os sync
```

## Planned Commands

| Command | Purpose | Target Version |
|---------|---------|----------------|
| `init` | Scaffold multimodel-dev-os into a project | v0.2 |
| `verify` | Check that all required files exist and are valid | v0.2 |
| `sync` | Regenerate adapter files from root AGENTS.md | v0.3 |
| `add-adapter` | Add a new adapter to the project | v0.3 |
| `caveman` | Convert standard templates to caveman mode | v0.3 |

## Requirements for v0.2

- [ ] `package.json` with `bin` entry
- [ ] CLI argument parser (no heavy dependencies)
- [ ] Template bundling with `scripts/pack-template.sh`
- [ ] Published to npm as `multimodel-dev-os`
- [ ] Tested on Node 18+

## Why Not Yet

v0.1 focuses on getting the file structure and content right.
The CLI is a convenience layer on top of a working convention —
the convention needs to prove itself first.
