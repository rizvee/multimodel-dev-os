# Token Optimization & Budget Policy

In agentic coding workflows, token overheads are the single largest source of API latency and cost. MultiModel Dev OS integrates tools and policies to optimize context inputs.

---

## 1. Caveman Mode
* **Goal**: Reduce baseline context token footprint by ~79%.
* **CLI Flag**: `node bin/multimodel-dev-os.js init --caveman`
* **Behavior**: Instantiates minimal `.caveman.md` files for `AGENTS.md`, `MEMORY.md`, `TASKS.md`, and `RUNBOOK.md`, omitting explanatory files and dense markdown guidelines.

---

## 2. Context Budget Auditing
* Define strict context bounds inside [.ai/context/context-budget.md](../.ai/context/context-budget.md).
* **CLI Command**: `node bin/multimodel-dev-os.js doctor --tokens`
  * Checks if build outputs or caches (`node_modules/`, `dist/`, `.next/`, `build/`) are missing from `.gitignore` or are being exposed to LLM scan scopes.

---

## 3. Policy Guidelines

### Keep Checklist Files Short
Use `TASKS.md` exclusively for active release or maintenance tasks. Move completed or historical backlogs to archive directories or logs.

### Model Handoff Compression
When switching from reasoning models to quick-fixing models, use [.ai/prompts/compress-context.md](../.ai/prompts/compress-context.md) to distill findings into high-density prompts.
