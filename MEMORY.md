# Project Memory

> Public workspace-memory template for MultiModel Dev OS projects.

Use this file to record durable project decisions that should help future
maintainers and compatible coding agents understand the repository. Keep it
concise, factual, and free of private chat transcripts, temporary prompts,
personal notes, credentials, and local machine paths.

## Architecture Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| YYYY-MM-DD | Adopt MultiModel Dev OS workspace contracts | Keep agent-facing instructions, context, tasks, and operational procedures portable across tools |
| YYYY-MM-DD | Keep runtime secrets outside the repository | Prevent accidental credential disclosure in public source and npm packages |

## Key Patterns

- Runtime code should use explicit, documented dependencies.
- Generated files should be identified and regenerated from source.
- Credentials, tokens, signing keys, local caches, logs, and session transcripts must stay ignored.
- Public `.ai/` assets should be reusable product configuration, not private implementation notes.

## Release Notes

- Record user-facing release decisions here only when they remain useful after the release.
- Keep detailed release execution logs outside the public repository.

## Known Issues

- Document confirmed, user-facing limitations.
- Avoid speculative debugging notes or private work-in-progress analysis.

## Environment Notes

- List supported runtimes, operating systems, and build tools.
- Do not include local absolute paths, usernames, private hostnames, or secret values.
