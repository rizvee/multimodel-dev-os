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

## Workflow-Focused Use Cases

Beyond specific technology stacks, MultiModel Dev OS addresses operational friction in modern development environments:

### A. Onboarding Legacy Repositories
- **The Challenge:** Joining a massive legacy project with sparse docs. Developers spend days learning layout conventions, and AI assistants generate hallucinated file structures.
- **The Solution:** Run `onboard analyze` to automatically map stack layers, followed by `init` to bootstrap structured rules. Developers instantly get a baseline `AGENTS.md` and `.ai/` directory that teaches incoming models exactly where files belong and how the project compiles.
- **Demo:** Check out the **[Safe Onboarding Workflow](/demos/existing-repo-onboarding)**.

### B. Cross-Tool Collaboration
- **The Challenge:** Using Cursor for quick autocomplete while using Claude Code in the terminal to execute builds. Updates to rules in one tool aren't picked up by the other, leading to conflicting edits.
- **The Solution:** Standardize rules in `AGENTS.md` and use `adapter sync` to write rules to all tool configurations in a single run. Both terminal agents and editor assistants stay aligned.
- **Demo:** Check out the **[Universal Adapter Sync Workflow](/demos/adapter-sync)**.

### C. Audited Self-Improvement Loops
- **The Challenge:** Allowing autonomous agents to apply codebase improvements without a solid verification pipeline can lead to broken builds or silent data loss.
- **The Solution:** Establish a feedback loop where models propose modifications as patch proposals. MultiModel Dev OS enforces Human-In-The-Loop (HITL) approval flags alongside automated `validate` and `doctor` checks before applying edits.
- **Demo:** Check out the **[Safe Improvement Loop Workflow](/demos/safe-improvement-loop)**.

---

For a complete breakdown of all files, scaffolding structures, and custom developer skills included in each profile, refer to the [Templates Guide](templates-guide.md).
