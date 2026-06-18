# Registry Policy Engine

The Policy Engine governs how remote registries are synchronized and how plugins are installed in the workspace. It enforces strict directory boundaries, file limitations, and network controls to prevent unauthorized access and malicious file writes.

## Configuration File

Registry policies are configured in `.ai/policies/registry-policy.yaml`. If this file does not exist, the engine falls back to strict default settings.

> [!NOTE]
> The policy file is read dynamically from the target workspace. If none is found there, it falls back to the bundled defaults in the package root.

---

## Policy Options Reference

Here is a list of all fields supported in `.ai/policies/registry-policy.yaml`:

### `allow_remote_registries` (Boolean)
* **Default:** `false`
* **Description:** Master switch to enable remote registry operations. If set to `false`, `registry add` and `registry sync` commands will fail.

### `require_approval_for_remote_sync` (Boolean)
* **Default:** `true`
* **Description:** Requires the `--approved` flag on the command line to synchronize a remote registry.

### `require_checksum` (Boolean)
* **Default:** `true`
* **Description:** Requires SHA256 checksum validation for all remote assets fetched during a sync.

### `require_signature` (Boolean)
* **Default:** `false`
* **Description:** Reserved for future cryptographic signature validation.

### `allow_untrusted_install` (Boolean)
* **Default:** `false`
* **Description:** When `false`, blocks installation of plugins originating from registries with `trust_level` set to `community` or `untrusted`.

### `allowed_write_roots` (Array of Strings)
* **Default:** `['.ai/', 'adapters/']`
* **Description:** A whitelist of directory paths relative to the project root. Plugins are only permitted to write files into these directories.

### `blocked_paths` (Array of Strings)
* **Default:** `['.env', '.npmrc', '.git/', 'node_modules/', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']`
* **Description:** A blacklist of specific paths or filenames. Plugins are strictly blocked from writing to or modifying these files, even if they reside within an allowed directory.

### `max_plugin_files` (Integer)
* **Default:** `20`
* **Description:** The maximum number of files that a single plugin is allowed to write to the workspace.

### `max_plugin_size_kb` (Integer)
* **Default:** `100`
* **Description:** The maximum combined file size (in KB) that a single plugin's assets can occupy.

### `max_registry_cache_size_kb` (Integer)
* **Default:** `512`
* **Description:** The maximum cache size (in KB) permitted per remote registry in `.ai/registry-cache/`.

### `allowed_file_extensions` (Array of Strings)
* **Default:** `['.md', '.yaml', '.yml', '.json']`
* **Description:** Whitelisted extensions for plugin assets. Any attempt to write files with different extensions (e.g. `.js`, `.sh`, `.exe`) is rejected.

---

## Example Policy Configuration

Below is a typical policy file enabling secure remote synchronization while enforcing strict safety gates:

```yaml
# .ai/policies/registry-policy.yaml
allow_remote_registries: true
require_approval_for_remote_sync: true
require_checksum: true
allow_untrusted_install: false

allowed_write_roots:
  - ".ai/"
  - "adapters/"

blocked_paths:
  - ".env"
  - ".npmrc"
  - ".git/"
  - "package.json"

max_plugin_files: 10
max_plugin_size_kb: 50
max_registry_cache_size_kb: 256

allowed_file_extensions:
  - ".md"
  - ".yaml"
  - ".json"
```
