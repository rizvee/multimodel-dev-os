# Demo: Safe Improvement Loop

> **Who**: Teams who want their AI agents to propose codebase improvements with human-in-the-loop safety.
> **Time**: ~2 minutes | **Prerequisites**: Node.js 18+, a MultiModel Dev OS workspace

---

## Starting State

You have a project with MultiModel Dev OS initialized and at least one coding session completed. You've noticed patterns you want the system to learn.

---

## Workflow

### Step 1: Record developer feedback

```bash
npx multimodel-dev-os@latest feedback add "Always use TypeScript strict mode" --type preference
npx multimodel-dev-os@latest feedback add "Avoid Tailwind CSS in this project" --type override
```

**What happens**: Logs feedback entries to `.ai/intelligence/feedback-log.jsonl` (gitignored). Each entry is timestamped and typed.

### Step 2: Compile feedback into learning rules

```bash
npx multimodel-dev-os@latest feedback summarize
```

**What happens**: Reads all feedback entries and compiles them into `.ai/intelligence/learning-rules.md` — a human-readable file that AI agents can reference. Gitignored.

### Step 3: Propose an improvement

```bash
npx multimodel-dev-os@latest improve propose --title "Add TypeScript strict config"
```

**What happens**: Creates a structured proposal file under `.ai/proposals/` with frontmatter, description, and optionally a deterministic operations JSON block.

### Step 4: Review proposals

```bash
npx multimodel-dev-os@latest improve review
npx multimodel-dev-os@latest improve status
```

**What happens**: Lists all proposals and their statuses (draft, approved, applied, refused). Read-only.

### Step 5: Validate safety gates

```bash
npx multimodel-dev-os@latest improve validate .ai/proposals/proposal-XXXX.md
```

**What happens**: Runs 12 safety gates including path boundary checks, protected path blocks, approval status, and operation type validation. Read-only.

### Step 6: Preview changes

```bash
npx multimodel-dev-os@latest improve diff .ai/proposals/proposal-XXXX.md
```

**What happens**: Shows a unified diff of what the proposal would change. No files are modified.

### Step 7: Apply the approved proposal

```bash
npx multimodel-dev-os@latest improve apply .ai/proposals/proposal-XXXX.md --approved
```

**What happens**: Executes the deterministic operations (`create_file`, `append_line`, `replace_text`). Records execution in `.ai/proposals/apply-log.jsonl` with SHA-256 hashes.

### Step 8: Check the audit log

```bash
npx multimodel-dev-os@latest improve log
```

---

## What Gets Created

| File | Purpose | Gitignored? |
|------|---------|-------------|
| `.ai/intelligence/feedback-log.jsonl` | Raw feedback entries | ✅ |
| `.ai/intelligence/learning-rules.md` | Compiled learning rules | ✅ |
| `.ai/proposals/proposal-XXXX.md` | Improvement proposal | ❌ (reviewable) |
| `.ai/proposals/apply-log.jsonl` | Execution audit log | ✅ |

---

## Safety Notes

- **Steps 1-6 are non-destructive** — feedback logging, proposal drafting, review, and diff are all safe
- **Step 7 modifies files** but only through validated deterministic operations
- 12 safety gates must pass before any apply can execute
- Proposals require explicit `--approved` flag
- All applied changes are audited with pre/post SHA-256 file hashes
- Protected paths (`.git/`, `.env`, `node_modules/`, `apply-log.jsonl`) are blocked

---

## Cleanup

```bash
# Remove feedback and proposals (gitignored files stay local)
rm -f .ai/intelligence/feedback-log.jsonl
rm -f .ai/intelligence/learning-rules.md
rm -rf .ai/proposals/
```

---

## Next Steps

- **Build memory index**: `npx multimodel-dev-os@latest memory build`
- **Run a workflow cycle**: `npx multimodel-dev-os@latest workflow run feedback-review`
- **Hand off to next agent**: [Multi-Agent Handoff Demo](/demos/multi-agent-handoff)
