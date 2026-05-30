# Project Memory

> Persistent context that AI agents carry across sessions.
> Update this file as the project evolves. Keep it under 200 lines.

## Architecture Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-30 | Express with Express-Router | Lightweight, modular routing for REST API. |
| 2026-05-30 | PostgreSQL for Storage | Relational database with strict validation and transaction support. |

## Key Patterns

- **RESTful Endpoints:** Standard verbs (GET, POST, PUT, DELETE) and JSON response payloads.
- **Middleware Gates:** Authenticate and validate payloads before invoking controller logic.

## Known Issues

- Database connection pool handles automatic reconnects but may time out under cold start.

## Environment Notes

- OS: Platform independent (Docker compatible)
- CI: GitHub Actions
- Hosting: Cloud Container Service

## Session Notes

### Session: Initial Scaffolding
**Date:** 2026-05-30
**Agent:** Antigravity
**Summary:** Initialized base directory layout and added core diagnostic files.
**Files changed:** AGENTS.md, MEMORY.md, TASKS.md