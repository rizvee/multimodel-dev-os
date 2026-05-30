# Scaffolding Template Gallery

`multimodel-dev-os` provides high-fidelity, real-world scaffolding profiles for common architectural targets.

## Stacks Blueprints

### [Next.js SaaS Stack](/use-cases.html#_1-next-js-saas-stack)
- **Tech Stack:** Next.js 14 App Router, TypeScript, React Server Actions, Prisma, Stripe.
- **Skill File:** `.ai/skills/nextjs-action-build.md` (form parameters validation and isolation conventions).
- **Audit Target:** `npx multimodel-dev-os init --template nextjs-saas`

### [WordPress Theme & Plugin Custom Site](/use-cases.html#_4-wordpress-custom-site)
- **Tech Stack:** WordPress Core, PHP 8.1+, Gutenberg custom blocks, MySQL.
- **Skill File:** `.ai/skills/plugin-boilerplate.md` (database escape statements and esc_html gates).
- **Audit Target:** `npx multimodel-dev-os init --template wordpress-site`

### [Headless E-commerce Cart](/use-cases.html#_2-headless-e-commerce-store)
- **Tech Stack:** MedusaJS, Stripe API, cart session structures.
- **Skill File:** `.ai/skills/webhook-handler.md` (Checkout validation loops and webhook signatures auditing).
- **Audit Target:** `npx multimodel-dev-os init --template ecommerce-store`

### [SEO Astro Landing Layout](/use-cases.html#_3-seo-landing-page)
- **Tech Stack:** Astro, Tailwind, HTML5, structured JSON-LD schemas.
- **Skill File:** `.ai/skills/seo-audit.md` (Image compression parameters and meta validations).
- **Audit Target:** `npx multimodel-dev-os init --template seo-landing-page`

### [General Universal App API](/use-cases.html#_5-general-application-scaffolding)
- **Tech Stack:** Node, Express, PostgreSQL, Jest.
- **Skill File:** `.ai/skills/example-skill.md` (Standardized environment variables and validation middleware).
- **Audit Target:** `npx multimodel-dev-os init --template general-app`
