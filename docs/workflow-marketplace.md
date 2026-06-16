# Workflow Marketplace Guide

The local Workflow Marketplace allows you to extend the capabilities of your AI agents by injecting domain-specific coding standards (skills), quality checks, and workflows.

## How it Works

1. **Discovery:**
   Search or recommend plugins suitable for your project stack:
   ```bash
   npx multimodel-dev-os catalog recommend
   ```
2. **Installation:**
   Installing a catalog plugin copies its manifest YAML and declarative files (skills/checks) to the target `.ai/` directory:
   ```bash
   npx multimodel-dev-os catalog install nextjs-workflows --approved
   ```
3. **Execution:**
   Once installed, the workflows declared in the plugin become available for execution:
   ```bash
   # Run workflow step
   npx multimodel-dev-os workflow run nextjs-action-check
   ```
