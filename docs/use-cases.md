# Use Cases & Stack Scaffolding

`multimodel-dev-os` ships with pre-configured template profiles tailored for specific development environments. This guide explains how to leverage these profiles for maximum context-efficiency.

---

## 1. Next.js SaaS Stack
Designed for modern web applications using the Next.js App Router, React, and TypeScript.
* **Command:** `npx multimodel-dev-os@latest init --template nextjs-saas`
* **Scaffolds:** Optimized `.ai/context/architecture.md` focusing on server components, edge routing, Prisma schema rules, and custom state boundaries.
* **Benefits:** AI agents are instantly aligned on routing rules, avoiding common imports errors (e.g. Mixing server vs. Client components).

## 2. Headless E-commerce Store
Tailored for fast front-ends integrated with Shopify, Stripe, or MedusaJS.
* **Command:** `npx multimodel-dev-os@latest init --template ecommerce-store`
* **Scaffolds:** Context files defining critical payment gateways flow, secure Webhook signatures, and shopping cart session logic.
* **Benefits:** Guides AI models to implement strict validation rules for sensitive checkout states without manual prompt injection.

## 3. SEO Static Landing Page
Optimized for high-performance static websites built with Astro, Hugo, or Tailwind CSS.
* **Command:** `npx multimodel-dev-os@latest init --template seo-landing-page`
* **Scaffolds:** Rules outlining Core Web Vitals targets, structured JSON-LD schemes, and image optimization constraints.
* **Benefits:** Establishes automatic quality gates where the AI checks metadata structures before completing edits.

## 4. WordPress Custom Site
Built for PHP-based environments, custom plugins, and block theme architectures.
* **Command:** `npx multimodel-dev-os@latest init --template wordpress-site`
* **Scaffolds:** Strict configurations detailing WordPress coding standards, sanitization techniques (`esc_html`, `wp_kses`), and database queries structure.
* **Benefits:** Prevents AI from writing insecure direct SQL statements or outdated styling actions.

## 5. General Application Scaffolding
The universal fallback layout for Python, Go, Rust, or general backend setups.
* **Command:** `npx multimodel-dev-os@latest init --template general-app`
* **Scaffolds:** High-level project specifications, basic memory structures, and generic agent build instructions.
* **Benefits:** Fast, lightweight starting point for any software repository.

---

For a complete breakdown of all files, scaffolding structures, and custom developer skills included in each profile, refer to the [Templates Guide](templates-guide.md).
