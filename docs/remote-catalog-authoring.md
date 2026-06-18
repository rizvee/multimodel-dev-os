# Remote Catalog Authoring Guide

This guide explains how to create, package, and publish a remote catalog registry for MultiModel Dev OS.

## Registry Directory Structure

A registry is a web-accessible directory containing a catalog index, a provenance manifest, and individual plugin manifest files with their assets:

```
my-registry/
├── catalog.yaml          # Registry index file
├── manifest.json         # Integrity manifest containing file hashes
└── catalog/
    ├── nextjs-helper.yaml # Plugin manifest for 'nextjs-helper'
    └── .ai/              # Plugin asset folder
        └── skills/
            └── nextjs-skills.md
```

---

## 1. Creating the Catalog Index (`catalog.yaml`)

The `catalog.yaml` file lists all available plugins in the registry. It matches the structure of the bundled catalog:

```yaml
# catalog.yaml
catalog:
  version: "1.0.0"
  description: "Custom team-specific workflows and guidelines"
  plugins:
    - slug: nextjs-helper
      name: "NextJS Component Helper"
      version: "1.2.0"
      description: "Standards-compliant NextJS boilerplates and structure checks."
      category: "nextjs"
      tags:
        - nextjs
        - react
      safety_level: "sandboxed"
      install_scope: "declarative"
      recommended_for: "NextJS React projects"
      files_preview:
        - dest: ".ai/plugins/nextjs-helper.yaml"
        - dest: ".ai/skills/nextjs-skills.md"
```

---

## 2. Packaging Plugin Files

Create the plugin YAML manifest in `catalog/<slug>.yaml`. This file defines the actual workflows and the files to copy:

```yaml
# catalog/nextjs-helper.yaml
name: "NextJS Component Helper"
slug: "nextjs-helper"
version: "1.2.0"
description: "Standards-compliant NextJS boilerplates and structure checks."
allowed_file_patterns:
  - .ai/skills/nextjs-skills.md
workflows:
  route-check:
    name: "Check App Router Routes"
    steps:
      - run: "npx multimodel-dev-os validate"
```

Then create the corresponding asset files (e.g. `catalog/.ai/skills/nextjs-skills.md`) in the correct subdirectories.

---

## 3. Generating the Manifest (`manifest.json`)

To make the registry verified, you must generate a `manifest.json` file. This file contains metadata and SHA256 checksums of all files in the registry.

Below is an example Node script you can run from your registry's root folder to generate the manifest:

```javascript
// generate-manifest.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const registryName = 'custom-registry';
const publisher = 'My Team';
const version = '1.0.0';

function computeSHA256(filePath) {
  const content = fs.readFileSync(filePath);
  return 'sha256:' + crypto.createHash('sha256').update(content).digest('hex');
}

const filesHashes = {};
const walk = (dir) => {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath);
    } else {
      const relPath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
      if (relPath !== 'manifest.json' && relPath !== 'generate-manifest.js') {
        filesHashes[relPath] = computeSHA256(fullPath);
      }
    }
  });
};

walk(__dirname);

const manifest = {
  registry_name: registryName,
  publisher: publisher,
  version: version,
  generated_at: new Date().toISOString(),
  catalog_hash: filesHashes['catalog.yaml'],
  files_hashes: filesHashes,
  minimum_mmdo_version: "3.0.0",
  safety_policy_version: "1.0",
  signature: null
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2), 'utf8');
console.log('manifest.json generated successfully!');
```

---

## 4. Publishing the Registry

1. Upload all files (preserving structure) to any static HTTPS file host (e.g. GitHub Pages, AWS S3, Cloudflare Pages).
2. Share the URL to `catalog.yaml` with your team.
3. Users can add and sync the registry via:
   ```bash
   npx multimodel-dev-os registry add my-team-registry https://example.com/my-registry/catalog.yaml --approved
   npx multimodel-dev-os registry sync my-team-registry --approved
   ```
