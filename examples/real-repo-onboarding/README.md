# Example: Real Repo Onboarding

Onboard an existing codebase into MultiModel Dev OS safely — no breaking changes, automatic backups.

## Prerequisites

- Node.js 18+
- An existing project directory with source code

## Commands

```bash
# Step 1: Analyze your project (read-only)
npx multimodel-dev-os@latest onboard analyze

# Step 2: Get template recommendations (read-only)
npx multimodel-dev-os@latest onboard recommend

# Step 3: Generate onboarding plan (writes to .ai/intelligence/, gitignored)
npx multimodel-dev-os@latest onboard plan

# Step 4: Apply configs (creates files, requires approval)
npx multimodel-dev-os@latest onboard apply --approved

# Step 5: Verify completeness
npx multimodel-dev-os@latest onboard status
```

## Expected Result

```
📊 Onboarding Status
  Completeness: 100%
  Root files: AGENTS.md ✓ MEMORY.md ✓ TASKS.md ✓ RUNBOOK.md ✓
  Config: .ai/config.yaml ✓
```

## Files Created

- `AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`
- `.ai/config.yaml` and `.ai/context/` directory
- `.ai/intelligence/onboarding.plan.json` (gitignored)
- `.ai/intelligence/onboarding.report.md` (gitignored)

## Safety

- Steps 1-3 are fully read-only
- Step 4 never overwrites existing files without `--force`
- All overwrites create `.bak` backups automatically

## Full Demo

See the [complete walkthrough](/demos/existing-repo-onboarding) for expected terminal output and detailed explanations.
