# Agent Instructions

> This file is the **source of truth** for all AI coding agents working on this project.
> Tool-specific adapters in `adapters/` read from this file. Do not duplicate instructions there.

## Project Overview

project: general-app
stack: Node.js, Express, ES6 Javascript, PostgreSQL, Jest
description: Baseline fallback profile for generic backend systems and API services.

## Build Commands

```
dev:   npm run dev
build: npm run build
test:  npm run test
lint:  npm run lint
```

## Coding Conventions

- Language: ES6 JavaScript
- Framework: Express
- Style guide: Airbnb Standard
- Type checking: none
- Formatting: Prettier

## File Structure Rules

```
src/       → Application source code
lib/       → Shared libraries and utilities
tests/     → Test files
docs/      → Documentation
```

## Boundaries

```
no-touch:
  - .env
  - .env.local
  - node_modules/
  - package-lock.json (do not manually edit)
```

## Agent Roles

| Role | Tool | Scope | Permissions |
|------|------|-------|-------------|
| default | any | all files | read + write |

## Dependencies

- express
- pg
- dotenv

## Testing Strategy

- Unit tests: Jest
- Integration tests: Supertest
- E2E tests: none

## Additional Context

- See `MEMORY.md` for project history and decisions
- See `TASKS.md` for current work items
- See `RUNBOOK.md` for operational procedures