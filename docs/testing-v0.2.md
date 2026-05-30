# multimodel-dev-os v0.2.0 Testing Documentation

This document describes how to execute local test cases to verify the `bin/multimodel-dev-os.js` CLI tool and installer scripts.

---

## 1. Platform Requirements
* **Node.js:** v18.0.0 or higher.
* **Unix-like Shell (Git Bash, macOS Terminal, Linux Bash):** Required for executing `.sh` scripts.
* **Windows PowerShell:** Required for executing `.ps1` scripts.

---

## 2. CLI Validation Tests

### Test Case A: Help Command
Ensures the argument parser and help outputs render correctly.
```bash
# Git Bash / macOS / Linux / PowerShell
node bin/multimodel-dev-os.js --help
```
* **Expected Output:** Displays correct option flags, commands (`init`, `verify`), and versions.

### Test Case B: Structural Verification Check
Verifies structural presence of 20 critical files inside the repository.
```bash
# Git Bash / macOS / Linux / PowerShell
node bin/multimodel-dev-os.js verify
```
* **Expected Output:** Outputs `✓` indicators for each file and returns a `PASSED` status with exit code `0`.

### Test Case C: Dry-Run Scaffolding Check
Validates loading of custom templates (e.g. `nextjs-saas`) and adapter boundaries without actual writes.
```bash
# Git Bash / macOS / Linux / PowerShell
node bin/multimodel-dev-os.js init --target ./test-project --template nextjs-saas --adapter cursor --dry-run
```
* **Expected Output:** Outputs 61 `[DRY-RUN] WOULD CREATE` operation logs and a final `Project initialized successfully!` success message.

### Test Case D: Conflict Prevention Check
Verifies that the CLI protects existing files from overwrites.
```bash
# 1. Create a dummy file
mkdir -p test-conflict && touch test-conflict/AGENTS.md

# 2. Run init without force
node bin/multimodel-dev-os.js init --target ./test-conflict
```
* **Expected Output:** Safely aborts, prints a red `CONFLICT` warning, and exits with code `1`.

### Test Case E: Overwrite Override Check
Verifies that `--force` successfully bypasses conflict protection.
```bash
# Run init with force
node bin/multimodel-dev-os.js init --target ./test-conflict --force
```
* **Expected Output:** Overwrites conflicting files and completes successfully.

---

## 3. Script Installer Validation Tests

### macOS / Linux / WSL (bash):
```bash
# Run dry-run installation
bash scripts/install.sh --dry-run
```

### Windows (PowerShell):
```powershell
# Run dry-run installation
.\scripts\install.ps1 -DryRun
```
