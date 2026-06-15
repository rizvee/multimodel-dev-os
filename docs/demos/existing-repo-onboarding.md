# Demo: Existing Repo Onboarding

> **Who**: Developers with an existing codebase who want to add AI Dev OS configs without breaking anything.
> **Time**: ~2 minutes | **Prerequisites**: Node.js 18+, an existing project directory

---

## Starting State

You have a project directory with source code — for example a Next.js app, a Python API, or a WordPress site. No MultiModel Dev OS files exist yet.

```bash
cd /path/to/your-project
```

---

## Workflow

### Step 1: Analyze your project

```bash
npx multimodel-dev-os@latest onboard analyze
```

**What happens**: Scans your directory for frameworks, languages, package managers, and existing AI config files. Read-only — no files are created or modified.

**Expected output**:
```
🔍 Analyzing repository: /path/to/your-project
  Detected: package.json (Node.js)
  Detected: next.config.js (Next.js)
  Detected: tsconfig.json (TypeScript)
  Frameworks: nextjs, typescript
  Adapters found: none
  Risk markers: 0
```

### Step 2: Get recommendations

```bash
npx multimodel-dev-os@latest onboard recommend
```

**What happens**: Based on the analysis, recommends the best template and adapter configuration. Read-only.

**Expected output**:
```
📋 Recommendations for /path/to/your-project
  Template: nextjs-saas (confidence: 85%)
  Adapters: cursor, claude (detected IDE signals)
```

### Step 3: Generate an onboarding plan

```bash
npx multimodel-dev-os@latest onboard plan
```

**What happens**: Creates a structured plan file at `.ai/intelligence/onboarding.plan.json` and a human-readable report at `.ai/intelligence/onboarding.report.md`. These are gitignored by default.

### Step 4: Apply the plan

```bash
npx multimodel-dev-os@latest onboard apply --approved
```

**What happens**: Copies configuration templates to your project. Existing files are **never overwritten** unless you pass `--force`, and automatic `.bak` backups are created.

### Step 5: Check status

```bash
npx multimodel-dev-os@latest onboard status
```

**Expected output**:
```
📊 Onboarding Status: /path/to/your-project
  Completeness: 100%
  Root files: AGENTS.md ✓ MEMORY.md ✓ TASKS.md ✓ RUNBOOK.md ✓
  Config: .ai/config.yaml ✓
  Adapters: cursor ✓ claude ✓
```

---

## What Gets Created

| File | Purpose |
|------|---------|
| `AGENTS.md` | Project instructions for all AI tools |
| `MEMORY.md` | Architectural decisions and milestones |
| `TASKS.md` | Active task backlog |
| `RUNBOOK.md` | Operational verification commands |
| `.ai/config.yaml` | Central configuration |
| `.ai/context/` | Project context files |
| `.ai/intelligence/onboarding.plan.json` | Onboarding plan (gitignored) |
| `.ai/intelligence/onboarding.report.md` | Human-readable report (gitignored) |

---

## Safety Notes

- **Steps 1-3 are fully read-only** — no files are written to your project
- **Step 4 writes files** but never overwrites existing files without `--force`
- All overwrites create `.bak` backup files automatically
- Plan and report files are placed under `.ai/intelligence/` which is gitignored

---

## Cleanup

To remove all MultiModel Dev OS files from your project:

```bash
rm -rf .ai/ AGENTS.md MEMORY.md TASKS.md RUNBOOK.md
```

---

## Next Steps

- **Sync IDE adapters**: `npx multimodel-dev-os@latest adapter sync all --approved` → [Adapter Sync Demo](/demos/adapter-sync)
- **Build memory index**: `npx multimodel-dev-os@latest memory build`
- **Run workspace health check**: `npx multimodel-dev-os@latest workflow run repo-health`
