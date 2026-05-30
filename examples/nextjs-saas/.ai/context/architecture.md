# Next.js SaaS — Architecture Map

## Directory Boundaries
- `/app` — Route groups, API routes, and Server Actions controllers.
- `/components` — React UI components (Tailwind classes ordered).
- `/lib` — Prisma database Client singleton, helper utilities.
- `/prisma` — Postgres SQL schemas definitions, migrations files.
- `/tests` — Unit tests using vitest or Jest.
