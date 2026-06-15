# Plugin Authoring Guide

MultiModel Dev OS declarative plugins allow you to share templates, rules, custom workflows, and adapters across different repositories. This guide walks you through authoring and packaging a compliant plugin.

---

## Plugin Manifest Schema

A plugin is defined by a single YAML or JSON file. The manifest schema structure is enforced by [.ai/schema/plugin.schema.json](file:///f:/multimodel-dev-os/.ai/schema/plugin.schema.json).

### Required Fields

* **`name`** (string): The human-readable name of the plugin (e.g. `Git Integration Plugin`).
* **`slug`** (string): A unique, URL-friendly slug identifier (e.g. `git-integration`). This slug determines the filename under `.ai/plugins/<slug>.yaml` after installation.
* **`version`** (string): Semantic version string (e.g. `1.0.0`).
* **`description`** (string): A brief summary of the capabilities introduced by the plugin.
* **`author`** (string): The creator's name or team.

### Optional Config Fields

* **`allowed_file_patterns`** (array of strings): A list of relative paths within the whitelist directory boundaries (`.ai/` or `adapters/`) that this plugin plans to install.
* **`denied_file_patterns`** (array of strings): Explicit glob patterns of forbidden locations.
* **`templates`** (object): Custom project templates registered by the plugin.
* **`workflows`** (object): Custom workflows added by the plugin (reused by `multimodel-dev-os workflow run`).
* **`adapters`** (object): Custom adapter settings mappings.
* **`safety_notes`** (string): Security disclosures printed to the user before they approve installation.

---

## Example Manifest

Here is a standard example manifest mapping custom git operations and rules:

```yaml
name: "Example Git Integration Plugin"
slug: "git-integration"
version: "1.0.0"
description: "Declarative plugin extending MultiModel Dev OS with custom git workflows and rules"
author: "MultiModel Dev OS Team"
allowed_file_patterns:
  - ".ai/skills/git-operations.md"
  - ".ai/checks/pre-push-audit.md"
denied_file_patterns:
  - "src/**"
  - ".env"
  - "node_modules/**"
templates:
  git-commit-helper:
    name: "Git Commit Message Assistant"
    description: "Generates semantic commit messages based on staged diffs"
workflows:
  git-audit:
    name: "Pre-Push Git Audit"
    description: "Scan branch status and verify all local commits pass verification before pushing code"
    steps:
      - name: "Status Check"
        command: "status"
      - name: "Doctor Pre-flight Audit"
        command: "doctor"
      - name: "Integrity Verify"
        command: "verify"
adapters:
  git-rules:
    name: "Git Rules Configuration"
    targetFile: ".gitattributes"
safety_notes: "This plugin only writes configurations to .ai/skills/ and .ai/checks/ to aid developer git workflows. No binary code is executed."
```

---

## Local Validation

Before distributing your plugin, always validate the manifest structure using the built-in validation CLI:

```bash
npx multimodel-dev-os@latest plugin validate path/to/your-plugin.yaml
```

If the validation fails, it outputs detailed error reports indicating which schema constraint was violated.

---

## Packaging Guidelines

A packaged plugin folder should mirror the workspace directory structure. For example, if a plugin copies `.ai/skills/git-operations.md`, the folder layout must look like:

```txt
your-plugin-folder/
├── plugin.yaml
└── .ai/
    └── skills/
        └── git-operations.md
```

To install this plugin locally, users run:

```bash
npx multimodel-dev-os@latest plugin install your-plugin-folder/plugin.yaml --approved
```
