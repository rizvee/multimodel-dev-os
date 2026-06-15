# Demo: Adapter Sync

> **Who**: Developers using 2+ AI coding tools who want rules synced automatically.
> **Time**: ~1 minute | **Prerequisites**: Node.js 18+, a MultiModel Dev OS workspace (run `init` first)

---

## Starting State

You have a project with MultiModel Dev OS initialized. Your `AGENTS.md` has been customized with your project's build commands and coding conventions. Now you want those rules pushed to `.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, etc.

---

## Workflow

### Step 1: Check adapter status

```bash
npx multimodel-dev-os@latest adapter status
```

**Expected output**:
```
🔌 Adapter Status:
  cursor:       enabled  → .cursorrules (missing from root)
  claude:       enabled  → CLAUDE.md (missing from root)
  vscode:       enabled  → .vscode/settings.json (missing from root)
  gemini:       disabled
  antigravity:  disabled
```

### Step 2: Preview differences

```bash
npx multimodel-dev-os@latest adapter diff cursor
```

**What happens**: Shows the diff between the bundled adapter template and your current root file (if it exists). Read-only.

### Step 3: Sync all enabled adapters

```bash
npx multimodel-dev-os@latest adapter sync all --approved
```

**What happens**: Copies rule files from `adapters/*/` to your project root. Existing files require `--force` to overwrite, and `.bak` backups are created automatically.

**Expected output**:
```
🔄 Syncing adapters...
  CREATE .cursorrules
  CREATE CLAUDE.md
  CREATE .vscode/settings.json
✅ 3 adapters synced.
```

### Step 4: Verify

```bash
npx multimodel-dev-os@latest validate
```

---

## What Gets Created

| File | Source Adapter |
|------|--------------|
| `.cursorrules` | `adapters/cursor/.cursorrules` |
| `CLAUDE.md` | `adapters/claude/CLAUDE.md` |
| `.vscode/settings.json` | `adapters/vscode/.vscode/settings.json` |
| `.gemini/settings.json` | `adapters/antigravity/.gemini/settings.json` |
| `GEMINI.md` | `adapters/gemini/GEMINI.md` |

Only enabled adapters are synced.

---

## Safety Notes

- **Step 1-2 are read-only** — no files are modified
- **Step 3 writes files** but never overwrites without `--force`
- All overwrites create `.bak` backup files
- Adapter enable/disable is controlled by `.ai/config.yaml`

---

## Cleanup

Remove synced adapter files:

```bash
rm -f .cursorrules CLAUDE.md GEMINI.md
rm -rf .vscode/ .gemini/
```

---

## Next Steps

- **Edit your rules**: Customize `AGENTS.md` → re-run `adapter sync all --approved` to propagate
- **Build memory**: `npx multimodel-dev-os@latest memory build` → [Multi-Agent Handoff Demo](/demos/multi-agent-handoff)
- **Run health check**: `npx multimodel-dev-os@latest workflow run repo-health`
