# Next.js SaaS — Project Memory

## Architectural Decisions
- **React Server Actions:** Adopted Server Actions for form submissions and mutation endpoints. Kept Route Handlers only for webhooks (like Stripe Webhook events).
- **Prisma Connection Pooling:** Instantiated PrismaClient as a global singleton on development to prevent socket fatigue on hot-reloading.

## Active Conventions
- Always wrap database actions in standard try-catch blocks returning custom objects `{ success: boolean, data?: any, error?: string }` to simplify frontend feedback.
