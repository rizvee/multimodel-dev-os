# Next.js SaaS — Agent Instructions

project: nextjs-saas-starter
stack: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Prisma ORM, Stripe, PostgreSQL
description: Subscription-based SaaS boilerplate with checkout modules and database triggers.

## Build Commands
```
dev:   npm run dev
build: npm run build
test:  npm run test
lint:  npm run lint
```

## Coding Conventions
- **Language:** TypeScript (strict mode enabled).
- **Framework:** Next.js App Router. Enforce Server Components by default; add `"use client"` only for files requiring state, effects, or user event handlers.
- **Data Access:** Enforce Prisma Client operations inside Server Actions or Route Handlers; keep connection pools under limits (e.g. `npx prisma db push`).
- **Styling:** Vanilla CSS modules or Tailwind CSS utilities classes. Order Tailwind classes systematically (layout first, then spacing, then typography).
