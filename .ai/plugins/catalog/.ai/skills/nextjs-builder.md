# Next.js Route & Action Builder Skill

This skill guides the AI agent when designing and auditing Next.js App Router applications.

## Guidelines

1. **Server Actions Security:**
   - Ensure Server Actions (declared with `'use server'`) validate all input payloads using Zod or equivalent schemas.
   - Enforce authorization checks inside every action before processing requests.
2. **Route Handlers:**
   - Enforce standard response formats: always return `NextResponse.json(...)` or proper redirect responses.
   - Handle CORS and HTTP methods properly, returning status `405 Method Not Allowed` for unsupported verbs.
