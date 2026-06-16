# Workflow Marketplace & Plugin Catalog Directory

This directory stores the curated, first-party plugin definitions and their declarative assets for the local Workflow Marketplace.

## Folder Structure

* `catalog.yaml`: The master catalog index referencing all available plugin slugs, categories, tags, and file previews.
* `catalog/`: Holds the actual plugin YAML configuration manifests and their respective sub-assets.
  - `git-workflows.yaml`: Git pre-commit checks and branch audit operations.
  - `seo-workflows.yaml`: HTML metadata audits and sitemap verification helpers.
  - `wordpress-workflows.yaml`: Boilderplate generators and security checks for WordPress.
  - `nextjs-workflows.yaml`: App router, middleware, and route handler validations for Next.js.
  - `ecommerce-workflows.yaml`: Stripe webhook signature and transaction auditing templates.
  - `release-workflows.yaml`: CI-safe package publishing pre-flight checklists and verifiers.

Any assets copied by these plugins (such as skills, checks, or prompts) must reside relative to this catalog root folder matching their destination layout (e.g. inside `catalog/.ai/skills/` or `catalog/.ai/checks/`).

## Installation

These catalog plugins can be listed, searched, and installed using the CLI:

```bash
# List all catalog plugins
npx multimodel-dev-os catalog list

# Search for a plugin
npx multimodel-dev-os catalog search git

# Get recommendations for the current repository
npx multimodel-dev-os catalog recommend

# Install a plugin
npx multimodel-dev-os catalog install git-workflows --approved
```
