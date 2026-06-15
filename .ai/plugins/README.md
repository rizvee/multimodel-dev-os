# MultiModel Dev OS Plugins

This directory holds declarative MultiModel Dev OS plugin configurations.

## Overview

Plugins are **strictly declarative** YAML files that conform to the JSON schema defined in [.ai/schema/plugin.schema.json](../schema/plugin.schema.json). They allow teams and the community to package and distribute custom configurations without executing unverified third-party code.

### Safe Containment Rules
To protect your repositories from supply-chain threats, the plugin system enforces strict containment rules:
1. **No Code Execution:** Plugins cannot execute JavaScript, binary files, post-install scripts, or terminal shells.
2. **No Package Installs:** Plugins cannot trigger npm/yarn package downloads or modifications to `package.json`.
3. **No Network Activity:** Operations are fully offline-safe.
4. **Write Containment:** Installation can only write rule, template, and workflow definitions to the `.ai/` and `adapters/` folders. Modifying app source code, `.env`, `.git/`, or `.npmrc` is hard-blocked.

## Creating a Plugin

1. Create a YAML file following the layout in [plugin.example.yaml](plugin.example.yaml).
2. Define the metadata fields (`name`, `slug`, `version`, `description`, `author`).
3. Set path permissions using `allowed_file_patterns`.
4. Validate your file using the CLI tool:
   ```bash
   npx multimodel-dev-os@latest plugin validate path/to/your-plugin.yaml
   ```
5. Install your plugin:
   ```bash
   npx multimodel-dev-os@latest plugin install path/to/your-plugin.yaml --approved
   ```

For detailed documentation, see the **[Plugin Authoring Guide](../../docs/plugin-authoring)** and **[TUI & Plugin Safety](../../docs/tui-safety)**.
