# Demo: Multi-Agent Handoff

> **Who**: Developers switching between AI models (e.g., Claude → Gemini → Cursor) mid-session.
> **Time**: ~1 minute | **Prerequisites**: Node.js 18+, a MultiModel Dev OS workspace with some history

---

## Starting State

You've been coding with Claude Code for an hour. You want to switch to Gemini for an audit pass, but you don't want to lose the session context.

---

## Workflow

### Step 1: Build the memory index

```bash
npx multimodel-dev-os@latest memory build
```

**What happens**: Scans your codebase and writes a hash-compressed index to `.ai/intelligence/memory.hash.json` and a human-readable summary to `.ai/intelligence/memory.summary.md`. Both are gitignored.

### Step 2: Compile the handoff spec

```bash
npx multimodel-dev-os@latest handoff build
```

**What happens**: Compiles a token-compressed session context document at `.ai/intelligence/handoff.md`. This includes:
- Project structure summary
- Active tasks from `TASKS.md`
- Recent memory state
- Feedback log highlights
- Proposal status

### Step 3: View the handoff

```bash
npx multimodel-dev-os@latest handoff show
```

**Expected output**: Prints the handoff document to stdout — ready to paste into your next agent session.

### Step 4: Check workspace status

```bash
npx multimodel-dev-os@latest status
```

**What happens**: Shows a compact dashboard of package details, framework signals, memory freshness, feedback counts, proposal states, and audit metrics.

---

## What Gets Created

| File | Purpose | Gitignored? |
|------|---------|-------------|
| `.ai/intelligence/memory.hash.json` | Hash-compressed file index | ✅ |
| `.ai/intelligence/memory.summary.md` | Human-readable memory summary | ✅ |
| `.ai/intelligence/handoff.md` | Token-compressed session context | ✅ |

---

## Safety Notes

- **All commands are read-only** except `memory build` and `handoff build` which write to gitignored `.ai/intelligence/` paths
- No project source files are modified
- Handoff documents are designed to be ephemeral — rebuild before each agent switch
- Secret-safety exclusions automatically skip `.env`, `.npmrc`, `.keystore` files

---

## Cleanup

```bash
rm -f .ai/intelligence/memory.hash.json
rm -f .ai/intelligence/memory.summary.md
rm -f .ai/intelligence/handoff.md
```

---

## Next Steps

- **Paste handoff into your next agent** — copy the output of `handoff show` into Claude, Gemini, or Cursor
- **Run a health workflow**: `npx multimodel-dev-os@latest workflow run repo-health`
- **Refresh after more work**: `npx multimodel-dev-os@latest memory refresh`
