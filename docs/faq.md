# FAQ

## General

**What is multimodel-dev-os?**
A set of markdown files and conventions that let multiple AI coding tools
(Codex, Cursor, Claude, Gemini, Antigravity, VS Code) share the same
project context. Not a runtime. Not an AI agent. Think `.editorconfig`
but for AI tools.

**Is this an operating system?**
No. "Dev OS" is a metaphor for the shared operating layer between tools.
It's just markdown files in your repo.

**What does "multimodel" mean?**
Multiple AI models/tools working on the same project.
Not "multimodal" (multiple input types like text + image).

## Setup

**Do I need Node.js?**
It depends on your installation path:
* **Yes:** If you run the primary, recommended `npx multimodel-dev-os@latest init` workflow, Node.js is required.
* **No:** If you run the fallback automated shell installer scripts (`install.sh` or `install.ps1`), they run purely on native bash or PowerShell and download resources directly.

**Why not just write a single manual AGENTS.md myself?**
While you can write a raw markdown instruction file manually, `multimodel-dev-os` offers a standardized development environment:
1. **Automated Bridging:** Rather than copying and pasting rules into `.cursorrules`, `CLAUDE.md`, `.vscode/settings.json`, and `.gemini/settings.json`, our adapters dynamically references your root source of truth.
2. **Standardized Context Segregation:** Separates concerns cleanly (`MEMORY.md` for architectural context, `TASKS.md` for task state tracking, `RUNBOOK.md` for incident response, and `.ai/` for skills and prompts).
3. **Structured Verification:** Pre-packaged CLI and verification scripts test and assert the structural completeness of your rules.
4. **Token Savings:** Seamlessly switches into Caveman Mode to slash token footprints by **~79%** for smaller models.

**Can I use just one AI tool?**
Yes. Use a single adapter. The multi-agent features are optional.

**Which files are required?**
At minimum: `AGENTS.md`. Everything else is optional.
The installer creates the full structure, but you can delete what you don't need.

## Adapters

**Do I copy adapter files to my project root?**
Yes, for tools that auto-detect specific files:
- Cursor → copy `.cursorrules` to root
- Claude → copy `CLAUDE.md` to root
- VS Code → copy `.vscode/` to root

**My tool isn't listed. Can I add one?**
Yes. See [docs/adapters.md](adapters.md) for the guide. PRs welcome.

**Will adapters break if a tool changes its config format?**
Possibly. Adapters are community-maintained. File an issue if you
notice an adapter is outdated.

## Caveman Mode

**When should I use Caveman Mode?**
When your context window is tight, your model is small, or you're
optimizing for API cost. It cuts ~79% of tokens.

**Can I mix standard and caveman files?**
Yes. Each file is independent. You could have a standard `AGENTS.md`
and a caveman `TASKS.md`.

## Orchestrator

**Does the orchestrator run agents automatically?**
No, not in v0.1. It's a protocol spec — conventions for how agents
should coordinate. Runtime orchestration is planned for v0.2+.

**Do I need the orchestrator for single-agent workflows?**
No. The orchestrator is only relevant when multiple agents work
on the same codebase.
