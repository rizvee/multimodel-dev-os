# Registry Sync

Registry Sync allows local workspaces to pull down updated catalog and template definitions from trusted remote catalogs.

## CLI Usage

To sync the official remote registry:
```bash
npx multimodel-dev-os registry sync official --approved
```

Without the `--approved` flag, the sync operation will refuse to write files and exit safely with code 1.
