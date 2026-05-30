# Installers

## Overview

Cross-platform scripts that scaffold multimodel-dev-os into any project. Located in `scripts/`.

## Usage

### macOS / Linux / WSL (`install.sh`)

```bash
# Standard install (interactive adapter selection)
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash

# Caveman Mode (minimal tokens)
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash -s -- --caveman

# All adapters, no prompts
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash -s -- --all

# Dry run (preview only)
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash -s -- --dry-run
```

### Windows (`install.ps1`)

```powershell
# Standard install
irm https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1 | iex

# With flags (download first, then run)
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1" -OutFile install.ps1
.\install.ps1 -Caveman -All
```

## Flags

| Flag | Bash | PowerShell | Effect |
|------|------|------------|--------|
| Caveman Mode | `--caveman` | `-Caveman` | Install minimal-token templates |
| All adapters | `--all` | `-All` | Skip adapter selection prompt |
| Dry run | `--dry-run` | `-DryRun` | Preview without creating files |
| Help | `--help` | `-Help` | Show usage information |

## Behavior

- **Non-destructive** — never overwrites existing files by default.
- **CLI-integrated** — bundles our zero-dependency CLI `bin/multimodel-dev-os.js` script so you can perform advanced target-directory routing and local schema verifications after installation.
- **Selective** — choose which adapters to install.
- **Offline-safe** — fails gracefully if downloads fail.

## What Gets Created

The installer creates:
1. Root files: `AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`
2. Core configuration utilities: `.gitattributes` (enforces LF line endings) and `bin/multimodel-dev-os.js` CLI
3. `.ai/` directory with config, skills, checks, templates
4. Selected adapter directories under `adapters/`
