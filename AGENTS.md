# Agent Instructions

> This file is the **source of truth** for all AI coding agents working on this project.
> Tool-specific adapters in `adapters/` read from this file. Do not duplicate instructions there.

## Project Overview

<!-- Replace with your project description -->
project: null
stack: null
description: null

## Build Commands

<!-- Replace with your actual commands -->
```
dev:   null
build: null
test:  null
lint:  null
```

## Coding Conventions

<!-- Define your style rules -->
- Language: null
- Framework: null
- Style guide: null
- Type checking: null
- Formatting: null

## File Structure Rules

<!-- Which directories serve which purpose -->
```
src/       → Application source code
lib/       → Shared libraries and utilities
tests/     → Test files
docs/      → Documentation
```

## Boundaries

<!-- Files and directories agents must NOT modify -->
```
no-touch:
  - .env
  - .env.local
  - node_modules/
  - package-lock.json (do not manually edit)
```

## Agent Roles

<!-- Define roles if using the multimodel orchestrator -->
<!-- See .ai/agents/multimodel-orchestrator.md for full orchestration config -->

| Role | Tool | Scope | Permissions |
|------|------|-------|-------------|
| default | any | all files | read + write |

## Dependencies

<!-- Key dependencies agents should be aware of -->
- null

## Testing Strategy

<!-- How agents should approach testing -->
- Unit tests: null
- Integration tests: null
- E2E tests: null

## Additional Context

<!-- Any other context agents need -->
- See `MEMORY.md` for project history and decisions
- See `TASKS.md` for current work items
- See `RUNBOOK.md` for operational procedures
