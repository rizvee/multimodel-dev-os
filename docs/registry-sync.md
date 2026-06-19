# Registry Synchronization Guide

This guide explains how to configure, synchronize, and manage remote registries in MultiModel Dev OS.

## Overview

MultiModel Dev OS uses a local-first registry system. By default, all remote capabilities are disabled. When enabled, the sync system allows you to fetch remote catalog indexes and verify their integrity before installing any plugin assets.

> [!IMPORTANT]
> **Zero Trust Security Model**
> * Remote sync does **not** download or run arbitrary binary code.
> * Synced assets are placed strictly in the gitignored `.ai/registry-cache/` directory.
> * Files are verified using SHA256 checksums defined in the publisher's signed manifest.

---

## Commands Reference

The `registry` command suite provides the following operations:

| Command | Safety Level | Description |
|---|---|---|
| `registry list` | Read-only | List all configured registry sources |
| `registry status` | Read-only | View sync status, timestamps, and cache health |
| `registry show <name>` | Read-only | View configuration details of a specific source |
| `registry verify <name>` | Read-only | Audit SHA256 checksums of cached registry files |
| `registry add <name> <url> --approved` | Write | Add a new remote registry source |
| `registry sync <name> --approved` | Network + Write | Download and cache remote catalog and manifest |
| `registry remove <name> --approved` | Write | Remove a registry source and clear its cache |
| `registry cache clear --approved` | Write | Clear all cached registry files |

---

## Synchronization Workflow

To synchronize a remote registry, follow these steps:

### 1. Enable Remote Registries in Policy

Open `.ai/policies/registry-policy.yaml` and set `allow_remote_registries: true`:

```yaml
allow_remote_registries: true
```

### 2. Configure a Remote Registry Source

Run the `registry add` command with the `--approved` flag to define a new registry source:

```bash
npx multimodel-dev-os registry add partner-registry https://registry.example.com/catalog.yaml --approved
```

> [!IMPORTANT]
> **Strict URL Constraints (v3.0.2+)**
> * All remote registry URLs must be valid and must use HTTPS by default to prevent sniffing and tampering.
> * URLs containing quotes (`'`, `"`, `` ` ``), spaces, or shell metacharacters (`$`, `;`, etc.) are rejected to eliminate command injection risks.
> * Local testing via HTTP localhost can be enabled if `allow_http_localhost` is set to `true` inside `registry-policy.yaml`.

### 3. Synchronize Registry Data

To fetch the remote catalog, run `registry sync`. Executing without the approval flag displays a safety audit preview:

```bash
npx multimodel-dev-os registry sync partner-registry
```

Once reviewed, run with `--approved`:

```bash
npx multimodel-dev-os registry sync partner-registry --approved
```

This performs the following actions:
1. Downloads `catalog.yaml` and `manifest.json` from the registry source.
2. Resolves and downloads all individual plugin manifests and assets listed in the manifest's `files_hashes`.
3. Verifies every file against its expected SHA256 checksum.
4. Generates a local `checksums.json` index in the cache.

### 4. Browse and Install Synced Plugins

Browse cached plugins from the registry using:

```bash
npx multimodel-dev-os catalog list --source remote:partner-registry
```

Install a cached plugin via:

```bash
npx multimodel-dev-os catalog install <plugin-slug> --approved
```

---

## Cache Directory Layout

All cached data is written to `.ai/registry-cache/<registry-name>/`:

```
.ai/registry-cache/
└── partner-registry/
    ├── catalog.yaml          # Cached plugin index
    ├── manifest.json         # Provenance metadata
    ├── checksums.json        # Verified SHA256 local database
    └── catalog/
        └── custom-plugin.yaml # Cached manifest for individual plugin
```

> [!TIP]
> Clear all cached data at any time without affecting installed plugins:
> `npx multimodel-dev-os registry cache clear --approved`
