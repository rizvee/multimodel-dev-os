# Before/After Workflow Case Studies

Explore how `multimodel-dev-os` eliminates instruction drift and saves token budgets across multiple AI programming agents.

---

## 1. Before: Chaotic AI Prompting (The Old Way)

In a typical modern development pipeline, developers switch between multiple agents to leverage their distinct strengths (Cursor for inline autocomplete, Claude Code for CLI scaffolding, Gemini for repository audits). 

Without context standardizations, this leads to **Chaotic AI Prompting**:
- **Manual Translation:** Every time a build script, staging path, or coding convention changes, the developer must manually edit `.cursorrules`, `CLAUDE.md`, and custom system instruction files.
- **Instruction Drift:** One IDE agent inevitably operates on an outdated convention. For example, Cursor suggests database patterns that Claude Code already replaced, causing immediate syntax and compiler crashes.
- **Context Bloat:** Boilerplate guidelines are copy-pasted across all files. Models consume **1,500+ tokens** of duplicate context on every single prompt turn, inflating API bills.

---

## 2. After: MultiModel Dev OS Workflow (The Standard)

`multimodel-dev-os` establishes a single source of truth inside your repository root, dynamically routing updates across all specialized tools.

```
                  ┌──────────────────────┐
                  │ AGENTS.md (Root Truth)│
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │ MultiModel Dev OS    │
                  └────┬───────────┬─────┘
                       │           │
          ┌────────────▼───┐   ┌───▼────────────┐
          │  IDE Adapters  │   │  CLI Adapters  │
          │ (Cursor, VS)   │   │ (Claude, Codex)│
          └────────────────┘   └────────────────┘
```

---

## 3. Real-World Task Workflows

Here is how different agents execute their tasks under the standardized system:

### A. Codex Scaffolding Task
When **Codex** bootstraps components:
1. Codex parses the central `AGENTS.md` package specs and `/adapters/codex/AGENTS.md` instructions.
2. It operates exactly under the defined build scripts, generating matching component schemas instantly.
3. No instructions drift; Codex is aware of the exact package-lock constraints of the repository.

### B. Antigravity Auditing Task
When **Antigravity** executes security/performance review audits:
1. It reads `AGENTS.md` and respects the strict directory boundary rules defined under `no-touch` blocks.
2. Antigravity executes compliance assertions against the active task backlog tracked inside `TASKS.md`.
3. It performs checks under the shared stack guidelines without polluting directories or editing ignored configurations.

### C. Cursor Autocomplete Task
When **Cursor** guides inline coding:
1. Cursor reads the dynamically generated `.cursorrules` located in the workspace root.
2. The rules are synchronized with the central repository brain.
3. Cursor suggests matching code styles and variables without recommending legacy APIs or outdated database fields.

---

## 4. The Claude / Gemini Sequential Handoff Protocol

When pair programming requires switching between terminal-based execution (**Claude Code**) and deep-file analysis (**Gemini / Antigravity**), `multimodel-dev-os` uses the **Structured Session Log Handoff**:

1. **Step 1 (Claude Code):** After finishing the terminal build, Claude Code summarizes its progress in `.ai/session-logs/session-001.md` utilizing the standard template. It logs:
   - What changed
   - Verification status
   - Next planned steps
2. **Step 2 (Gemini Pick-Up):** When the developer launches Gemini, the system feeds the last session log. Gemini reads `session-001.md` and instantly knows exactly where Claude Code left off.
3. **Outcome:** Zero context drop, zero redundant questions, and pristine, seamless model hand-offs!
