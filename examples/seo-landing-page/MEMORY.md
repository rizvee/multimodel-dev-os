# Project Memory

> Persistent context that AI agents carry across sessions.
> Update this file as the project evolves. Keep it under 200 lines.

## Architecture Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-30 | Astro for static rendering | Astro offers zero-JS by default, ensuring perfect Lighthouse performance. |
| 2026-05-30 | Tailwind CSS for styling | Utility-first classes optimized and purged during the production build. |

## Key Patterns

- **Structured Metadata:** Always include custom JSON-LD schemas in layout headers.
- **Image Optimization:** Enforce specific width/height ratios and lazy loading on all non-above-the-fold assets.

## Known Issues

- External font loading might trigger visual flashes (CLS). Font display swapping is enabled.

## Environment Notes

- OS: Platform independent
- CI: GitHub Actions
- Hosting: Vercel Static

## Session Notes

### Session: Baseline Scaffold
**Date:** 2026-05-30
**Agent:** Antigravity
**Summary:** Created layout structure and integrated SEO-audit skills guidelines.
**Files changed:** AGENTS.md, MEMORY.md, TASKS.md