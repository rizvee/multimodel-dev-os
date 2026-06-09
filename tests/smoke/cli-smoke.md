# CLI Smoke Test Specification

This document lists the essential CLI commands to execute when verifying the MultiModel Dev OS installation stability.

## Sanity Commands

```bash
# Verify help output
node bin/multimodel-dev-os.js --help

# List templates
node bin/multimodel-dev-os.js templates
node bin/multimodel-dev-os.js templates --json

# List models and adapters
node bin/multimodel-dev-os.js models --json
node bin/multimodel-dev-os.js adapters --json

# List active skills
node bin/multimodel-dev-os.js skills
```

## Validation & Doctor Commands

```bash
# Validate built-in resources
node bin/multimodel-dev-os.js validate-template nextjs-saas
node bin/multimodel-dev-os.js validate-adapter cursor
node bin/multimodel-dev-os.js validate-skill custom-skill.example

# Validate all registry entries
node bin/multimodel-dev-os.js validate --all-registries

# Release advisory checkup
node bin/multimodel-dev-os.js doctor --release

# Token budget checks
node bin/multimodel-dev-os.js doctor --tokens --threshold 100KB
```

## Initialization Dry-Runs

```bash
# Dry-run general app init
node bin/multimodel-dev-os.js init --dry-run --template general-app

# Dry-run with adapter injections
node bin/multimodel-dev-os.js init --dry-run --template nextjs-saas -a cursor -a claude
```
