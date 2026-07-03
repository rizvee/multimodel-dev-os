# Case Study: Next.js SaaS Full-Stack Autocomplete

An educational case study detailing how a SaaS engineering team synchronized database schemas and UI autocompletions across Cursor and Claude Code.

---

## 1. The Problem
The team switched frequently between a command-line assistant (Claude Code) to perform database migrations and local editors (Cursor) to write UI forms. When a database model schema was updated inside Prisma, Cursor's inline autocompletions remained unaware of the changes. The model suggested legacy fields, generating syntax errors and broken API queries that required constant copy-pasting to sync.

---

## 2. Old Workflow
1. The developer updated `schema.prisma`.
2. Claude Code executed migration commands and was aware of the new fields.
3. Cursor (.cursorrules) remained completely unmodified.
4. Inline completion generated compiler errors. The developer copy-pasted compile errors back to the model to resolve the discrepancies, losing significant token budget.

---

## 3. MultiModel Dev OS Setup
The team decoupled rules from tool-specific prompt configurations by defining a single centralized root contract:
- Root contract [AGENTS.md](../../AGENTS.md) tracked database frameworks and style guides.
- Adapters for Claude and Cursor mapped these specifications instantly.
- Caveman Mode was toggled on during UI-focused sprints to save context token footprints.

---

## 4. Files & Subcommands Used
- **Core Files:** `AGENTS.md`, `MEMORY.md`, `.ai/config.yaml`, `/adapters/cursor/.cursorrules`, `/adapters/claude/CLAUDE.md`
- **CLI Commands:**
  ```bash
  # Initialize nextjs-saas stack config and enabled adapters
  npx multimodel-dev-os init --template nextjs-saas --adapter cursor --adapter claude
  
  # Audit structure health
  npx multimodel-dev-os validate
  ```

---

## 5. Outcome & Results
- **Zero Instruction Drift:** Any change committed to the root `AGENTS.md` was instantly mirrored in both `.cursorrules` and `CLAUDE.md`.
- **Token Optimization:** Slashed input rules footprint from `~1,600 tokens` down to `~340 tokens` during UI completions under Caveman Mode, representing **~79% savings in context API billing**.

---

## 6. Reusable Design Pattern
**Decoupled Schema Mapping:** Always store database and framework constraints in a singular root contract, and deploy lightweight automated adapters to translate those rules dynamically to terminal assistants and autocomplete editors.
