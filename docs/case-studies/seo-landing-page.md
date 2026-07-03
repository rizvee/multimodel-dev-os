# Case Study: SEO Landing Page Audit Quality Gates

An educational case study detailing how a marketing agency managed automated performance linter audits and SEO compliance checks.

---

## 1. The Problem
When developing marketing landing pages, developers switched frequently between editors to write CSS and assistants to optimize metadata. Assistants often recommended bulky third-party tracking scripts or ignored Core Web Vitals targets, causing page load speeds to drop below acceptable criteria.

---

## 2. Old Workflow
1. The developer prompted the model to add promotional sections.
2. The assistant, unaware of style guides or speed budgets, suggested large image assets and unoptimized JS scripts.
3. Page performance dropped, requiring manual optimization and auditing cycles.

---

## 3. MultiModel Dev OS Setup
- The team configured speed budgets inside [.ai/context/seo-rules.md](../../.ai/context/seo-rules.md).
- Reusable audit routines were defined inside `.ai/skills/seo-audit.md`.
- Strict pre-deploy compliance verifications were configured in the checks folder.

---

## 4. Files & Subcommands Used
- **Core Files:** `AGENTS.md`, `.ai/context/seo-rules.md`, `.ai/skills/seo-audit.md`, `.ai/checks/pre-deploy.md`
- **CLI Commands:**
  ```bash
  # Scaffold SEO template configurations
  npx multimodel-dev-os init --template seo-landing-page
  
  # Audit structure health
  npx multimodel-dev-os validate
  ```

---

## 5. Outcome & Results
- **Pragmatic Speed Compliance:** Assistants strictly followed Core Web Vitals rules, suggesting optimized images and inline styling instead of bulky scripts.
- **Improved Performance:** Initial page load speed remained high with zero manual auditing overhead.

---

## 6. Reusable Design Pattern
**Metadata Quality Budgets:** Always store performance budgets and SEO criteria in a modular rules file to force coding models to optimize assets dynamically before writing scripts.
