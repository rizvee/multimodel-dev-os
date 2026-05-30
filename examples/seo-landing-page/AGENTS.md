# Agent Instructions

> This file is the **source of truth** for all AI coding agents working on this project.
> Tool-specific adapters in `adapters/` read from this file. Do not duplicate instructions there.

## Project Overview

project: seo-landing-page
stack: Astro, React, Tailwind CSS, HTML5, JSON-LD
description: Premium static landing page optimized for high SEO performance and Core Web Vitals.

## Build Commands

```
dev:   npm run dev
build: npm run build
test:  npm run test
lint:  npm run lint
```

## Coding Conventions

- Language: JavaScript / TypeScript
- Framework: Astro
- Style guide: Astro Standard
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

- astro
- tailwindcss
- @astrojs/react

## Testing Strategy

- Unit tests: none
- Integration tests: Playwright
- E2E tests: Lighthouse audits

## Additional Context

- See `MEMORY.md` for project history and decisions
- See `TASKS.md` for current work items
- See `RUNBOOK.md` for operational procedures