# Installers

## Overview

Cross-platform scripts that scaffold multimodel-dev-os into any project.
Located in `scripts/`.

## Usage

### macOS / Linux / WSL (`install.sh`)

```bash
# Standard install (interactive adapter selection)
curl -fsSL https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.sh | bash

# Caveman Mode (minimal tokens)
curl -fsSL .../scripts/install.sh | bash -s -- --caveman

# All adapters, no prompts
curl -fsSL .../scripts/install.sh | bash -s -- --all

# Dry run (preview only)
curl -fsSL .../scripts/install.sh | bash -s -- --dry-run
```

### Windows (`install.ps1`)

```powershell
# Standard install
irm https://raw.githubusercontent.com/rizvee/multimodel-dev-os/main/scripts/install.ps1 | iex

# With flags (download first, then run)
Invoke-WebRequest -Uri ".../scripts/install.ps1" -OutFile install.ps1
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

- **Non-destructive** — never overwrites existing files
- **Idempotent** — safe to run multiple times
- **Selective** — choose which adapters to install
- **Offline-safe** — fails gracefully if downloads fail

## What Gets Created

The installer creates:
1. Root files: `AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`
2. `.ai/` directory with config, skills, checks, templates
3. Selected adapter directories under `adapters/`
