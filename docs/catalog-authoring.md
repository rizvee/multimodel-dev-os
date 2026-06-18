# Catalog Authoring Guide

This guide details how to add new plugin entries to the local marketplace catalog.

## Step 1: Declare Catalog Entry

Add the plugin metadata to `.ai/plugins/catalog.yaml`:

```yaml
- slug: custom-workflows
  name: "Custom Quality Audits"
  version: "1.0.0"
  description: "Automated checks for custom APIs."
  category: "custom"
  tags: ["api", "audit"]
  use_cases: ["API audits"]
  supported_templates: ["*"]
  provided_workflows: ["api-audit"]
  provided_skills: ["api-skills.md"]
  safety_level: "sandboxed"
  install_scope: "declarative"
  recommended_for: "APIs and services integration"
  files_preview:
    - dest: ".ai/plugins/custom-workflows.yaml"
    - dest: ".ai/skills/api-skills.md"
```

## Step 2: Create Manifest and Assets

Save the plugin manifest configuration under `.ai/plugins/catalog/custom-workflows.yaml`:

```yaml
name: "Custom Quality Audits"
slug: "custom-workflows"
version: "1.0.0"
description: "Automated checks for custom APIs."
author: "Your Name"
allowed_file_patterns:
  - .ai/skills/api-skills.md
workflows:
  api-audit:
    name: "API Audit"
    description: "Scan routes for API spec integrity"
    steps:
      - run: "echo 'Verifying API routes...'"
```

Place any referenced assets relative to the catalog subdirectory:
- `.ai/plugins/catalog/.ai/skills/api-skills.md`

## Step 3: Run Validation

Verify that your catalog entry complies with all safety rules:
```bash
npx multimodel-dev-os plugin validate .ai/plugins/catalog/custom-workflows.yaml
```

## Parser-Safe YAML Guidelines

To ensure parser compatibility across all environments:
1. **Flow Arrays**: Both block lists (using `-`) and inline flow arrays (e.g. `tags: ["api", "audit"]`) are fully supported.
2. **Type Preservation**: Wrap version numbers and slugs in quotes (e.g., `version: "1.0.0"`) to prevent them from being incorrectly converted to integers or floats.
3. **Quoted Hash Characters**: Quoted strings containing `#` symbols (e.g., `description: "Includes # tag"`) are parsed safely without stripping the hash character.
