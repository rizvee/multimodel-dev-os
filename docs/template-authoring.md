# Custom Template Authoring Guide

This guide explains how to author a custom workspace configuration template for MultiModel Dev OS.

## Overview

A template packages a set of boilerplate markdown files (`AGENTS.md`, `MEMORY.md`, `TASKS.md`, `RUNBOOK.md`), a central `.ai/config.yaml` file, and stack-specific context files and skills.

## Structure of a Template Source

A template resides in the `examples/` directory of the project, or can be loaded dynamically from a custom path using `--registry` if declared in the registry.

```
examples/my-custom-template/
├── AGENTS.md                   # Core workspace contracts
├── MEMORY.md
├── TASKS.md
├── RUNBOOK.md
└── .ai/
    ├── config.yaml             # Core configuration rules
    ├── context/                # Context templates
    │   ├── project-brief.md
    │   ├── architecture.md
    │   └── context-budget.md
    └── skills/                 # Custom reusable skill files
        └── custom-action.md
```

## Creating a Registry Entry

Add your template metadata to `.ai/templates/registry.yaml`:

```yaml
templates:
  my-custom-template:
    name: "my-custom-template"
    description: "My custom framework stack workspace baseline."
    stack: "My Framework, TypeScript, PostgreSQL"
    skill: "custom-action.md"
    skillDesc: "Framework specific secure execution rules."
    category: "Web"
    status: "stable"
    maturity: "production-ready"
    required_files:
      - AGENTS.md
      - MEMORY.md
      - TASKS.md
      - RUNBOOK.md
      - .ai/config.yaml
      - .ai/context/project-brief.md
      - .ai/skills/custom-action.md
```

## Validation Rules

You can validate your template configuration using the CLI:

```bash
node bin/multimodel-dev-os.js validate-template my-custom-template
```

Validation ensures:
1. The template metadata matches the registry schema.
2. The template source directory exists.
3. All files listed in `required_files` are present.
