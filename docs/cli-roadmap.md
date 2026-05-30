# CLI Roadmap

> The local `node bin/multimodel-dev-os.js` CLI tool is fully implemented in v0.2.0!

## Current CLI Usage

```bash
# Initialize project with configurations
node bin/multimodel-dev-os.js init

# Initialize with specific template and adapters
node bin/multimodel-dev-os.js init --template nextjs-saas --adapter cursor --adapter claude

# Run dry-run preview
node bin/multimodel-dev-os.js init --dry-run

# Force overwrite existing files
node bin/multimodel-dev-os.js init --force

# Check structural health of target directory
node bin/multimodel-dev-os.js verify
```

## CLI Roadmap & Commands Status

| Command | Purpose | Target Version | Status |
|---------|---------|----------------|--------|
| `init` | Scaffold multimodel-dev-os into a project | v0.2.0 | ✅ Completed |
| `verify` | Check that all required files exist and are valid | v0.2.0 | ✅ Completed |
| `sync` | Regenerate adapter files from root AGENTS.md | v0.3.0 | 📋 Planned |
| `add-adapter` | Add a new adapter to the project | v0.3.0 | 📋 Planned |

## Requirements Completed in v0.2.0

- [x] `package.json` with `bin` entry
- [x] CLI argument parser (implemented purely with Node.js built-ins)
- [x] Template profile injection (Next.js SaaS, WordPress, etc.)
- [x] Conflict protection and `--force` overrides
- [x] Dry-run preview mode
- [x] Tested on Node 18+ and Windows/macOS/Linux

## Future Releases (v0.3.0+)
- Publish package to npm as `multimodel-dev-os` to support `npx` execution.
- Implement the `sync` subcommand to parse custom override markers inside adapters and align them with changes in root instructions.
