# local-first Workflow Marketplace & Plugin Catalog

MultiModel Dev OS includes an offline, sandboxed **Workflow Marketplace** that lets you discover, inspect, and install curated plugins and workflow packs.

## Catalog CLI Commands

### 1. List Available Plugins
List all plugins registered in the local marketplace.
```bash
npx multimodel-dev-os catalog list
```
To filter by category:
```bash
npx multimodel-dev-os catalog list --category git
```

### 2. Search Catalog
Search for plugins matching a query string in names, slugs, descriptions, or tags.
```bash
npx multimodel-dev-os catalog search <query>
```

### 3. Show Plugin Specifications
Inspect detailed specifications, category, use cases, safety logs, and files previewed for a catalog plugin.
```bash
npx multimodel-dev-os catalog show <slug>
```

### 4. Get Recommendations
Analyze the current workspace framework and language signals to suggest optimal plugins.
```bash
npx multimodel-dev-os catalog recommend
```

### 5. Install a Catalog Plugin
Install the plugin manifest and all declared assets to the current workspace.
```bash
npx multimodel-dev-os catalog install <slug> --approved
```
To overwrite existing assets (creating `.bak` backups):
```bash
npx multimodel-dev-os catalog install <slug> --approved --force
```

### 6. Audit Installed Catalog Status
Check which catalog plugins are installed and if any of their declared files are missing.
```bash
npx multimodel-dev-os catalog status
```
