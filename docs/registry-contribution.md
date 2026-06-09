# Registry Contribution Workflow

This document describes how to propose and contribute new models, adapters, and templates.

## Contribution Flow

1. **Local Authoring:** Follow the respective authoring guides:
   * [Custom IDE Adapter Authoring](adapter-authoring.md)
   * [Custom Template Authoring](template-authoring.md)
   * [Skill Authoring](skill-authoring.md)
2. **Local Validation:** Use validation CLI commands to ensure structural compliance:
   * `node bin/multimodel-dev-os.js validate-template <name>`
   * `node bin/multimodel-dev-os.js validate-adapter <name>`
   * `node bin/multimodel-dev-os.js validate-skill <name>`
3. **Registry Addition:** Insert your metadata records into:
   * `.ai/templates/registry.yaml` for templates.
   * `.ai/adapters/registry.yaml` for adapters.
   * `.ai/models/registry.yaml` for models.
4. **Verification suite:** Run `npm run verify` to ensure the release audit checks pass cleanly.
5. **Submit PR:** Submit your changes via a GitHub Pull Request to `https://github.com/rizvee/multimodel-dev-os`.
