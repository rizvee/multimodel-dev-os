# multimodel-dev-os Templates Guide

`multimodel-dev-os` ships with 5 production-ready, stack-specific real-world templates that turn simple directories into structured developer profiles.

## Available Templates

### 1. `nextjs-saas`
- **Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Prisma ORM, Stripe payments
- **Use Case:** Subscription-based applications and SaaS products.
- **Skill File:** `.ai/skills/nextjs-action-build.md` (React Server Actions security guidelines).

### 2. `wordpress-site`
- **Stack:** WordPress Core, PHP, Gutenberg Block APIs, theme customization hooks, MySQL
- **Use Case:** Headless or standard custom themes and plugins.
- **Skill File:** `.ai/skills/plugin-boilerplate.md` (Sanitization gates and `$wpdb->prepare` queries).

### 3. `ecommerce-store`
- **Stack:** Headless Store API, cart states, secure payment webhooks (Stripe/Medusa)
- **Use Case:** PCI-compliant headless e-commerce store with secure checkout loops.
- **Skill File:** `.ai/skills/webhook-handler.md` (Payment webhooks listener auditing).

### 4. `seo-landing-page`
- **Stack:** Astro, HTML5, structured JSON-LD SEO markup, asset minification frameworks
- **Use Case:** Ultra-fast static marketing and landing page layouts.
- **Skill File:** `.ai/skills/seo-audit.md` (Google Lighthouse and Core Web Vitals optimization audit).

### 5. `general-app`
- **Stack:** Node.js, Express, ES6 Javascript, PostgreSQL, Jest
- **Use Case:** Universal backend APIs, CLI tools, and default projects.
- **Skill File:** `.ai/skills/example-skill.md` (Generic backend standard routing/validation rules).

---

## Scaffolding Directory Structure

```
├── AGENTS.md                   # Stack building conventions
├── MEMORY.md                   # Architectural decisions record
├── TASKS.md                    # Active task tracking
├── RUNBOOK.md                  # Team operations runbook
└── .ai/
    ├── config.yaml             # Core adapters setup
    ├── context/                # Context budgets & maps
    │   ├── project-brief.md
    │   ├── architecture.md
    │   ├── model-map.md
    │   └── context-budget.md
    └── skills/                 # High-fidelity programming skills
        └── [template-specific-skill].md
```

## CLI Configuration Commands

To view and list templates directly from your shell:

```bash
# List all templates
npx multimodel-dev-os templates

# Inspect nextjs-saas layout details
npx multimodel-dev-os show-template nextjs-saas

# Bootstrap target using a template
npx multimodel-dev-os init --target ../my-new-app --template nextjs-saas
```

---

## Template Quality Assurance

To ensure all contributed templates meet our rigorous quality standards before packaging, refer to our [Template Quality Assurance Blueprint](/template-qa).
