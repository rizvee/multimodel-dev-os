# Registry Security Model

MultiModel Dev OS is designed with a **zero-trust architecture** for remote registries and plugins. Because plugins configure coding guidelines, workflows, and prompts for AI coding agents, securing the distribution channel is critical.

This document describes the threat model, safety boundaries, and mitigation strategies implemented in `v3.0.0+`.

---

## Threat Model & Mitigations

```
Threat: Malicious Remote Registry
   |--> Arbitrary Code Execution (Mitigated: Declarative-only YAML)
   |--> Path Traversal / Overwrite (Mitigated: Resolve path bounds + Blacklist)
   |--> Dependency Poisoning (Mitigated: No automated package installation)
```

### 1. Arbitrary Code Execution
* **Threat:** A remote registry delivers a plugin containing malicious scripts (`shell`, `javascript`, etc.) that execute on the developer's machine.
* **Mitigation:**
  * **Declarative-only manifests:** Plugins are purely declarative YAML manifests defining workflows, skills, and checks.
  * **No runtime scripts:** Plugins cannot contain JavaScript files, shell scripts, or binary assets.
  * **No eval/exec:** The CLI parser reads manifests using a custom regex-based parser, strictly avoiding `eval` or dynamic JS execution.

### 2. Path Traversal & Unauthorized Overwrites
* **Threat:** A plugin manifest contains destination paths like `../../.ssh/authorized_keys` or `/etc/hosts` to write files outside the workspace.
* **Mitigation:**
  * **Allowed Write Roots:** The policy engine enforces that all destination paths must resolve within whitelisted directories (defaulting to `.ai/` and `adapters/`).
  * **Path Resolution Checks:** The installer uses `path.resolve` and `path.relative` to ensure destinations do not escape the target root or cache root.
  * **Blocked Paths Blacklist:** Sensitive files (e.g. `.env`, `.npmrc`, `.git/`, `package.json`) are blacklisted and cannot be overwritten under any circumstances.

### 3. Dependency Poisoning
* **Threat:** A synced plugin runs `npm install` to inject malicious dependencies into the project.
* **Mitigation:**
  * **Zero dependency installer:** The installation process does not interact with the npm registry, execute package managers, or modify `node_modules`.
  * **Ignored package files:** The blacklist blocks writes to `package.json`, `package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock`.

### 4. Cache Poisoning / Tampering
* **Threat:** An attacker modifies cached remote files on disk to bypass verification.
* **Mitigation:**
  * **In-process verification:** The `registry verify` command performs SHA256 checksum checks against the manifest.
  * **ReadOnly Dashboard:** The interactive TUI Dashboard is completely read-only for registry and plugin operations, preventing UI-driven privilege escalation.

### 5. Sync Command Injection & URL Validation (Patched in v3.0.2)
* **Threat:** A compromised or malicious remote registry URL is pre-configured in `.ai/registries/sources.yaml` to execute command injection payloads (e.g. via quotes or shell metacharacters) during sync.
* **Mitigation:**
  * **No Shell Execution:** Remote synchronization (`registry sync`) does not invoke shell interpreters. It spawns the Node sub-process using the safe `execFileSync` API, passing the target URL as arguments (`process.argv[1]`) rather than string-interpolating it into evaluated code.
  * **Strict URL Sanitization:** URLs are validated using the native `URL` class. Remote registry URLs must use HTTPS by default. Credentials, quotes (`'`, `"`, `` ` ``), spaces, and shell metacharacters (`$`, `;`, `&`, `|`, `<`, `>`, `(`, `)`, `*`) are strictly blocked.
  * **HTTP Localhost Exception:** The `allow_http_localhost` policy flag (defaulting to `false`) optionally allows local development registries using `http://localhost` or `http://127.0.0.1`.

---

## Safety Boundaries Matrix

The following table summarizes the enforcement gates for different registry types:

| Capability | Local Bundled | Verified Remote | Community Remote |
|---|---|---|---|
| **Requires Approved Flag** | Yes | Yes | Yes |
| **Integrity Check** | Yes (Built-in) | Yes (SHA256 Manifest) | Yes (SHA256 Manifest) |
| **Write Directory Restricted** | Yes (`.ai/`, `adapters/`) | Yes (`.ai/`, `adapters/`) | Yes (`.ai/`, `adapters/`) |
| **Size Limit Enforced** | No | Yes (max 100KB) | Yes (max 100KB) |
| **File Limit Enforced** | No | Yes (max 20 files) | Yes (max 20 files) |
| **Allowed Extensions Only** | Yes | Yes | Yes |
| **Automatic Activation** | No | No | No |

---

## Best Practices for Enterprise

For teams deploying MultiModel Dev OS in sensitive environments, we recommend:
1. Keeping `allow_remote_registries: false` (the default) if no third-party plugins are needed.
2. If remote plugins are required, set `allow_untrusted_install: false` to only permit plugins from official, signed corporate registries.
3. Commit `.ai/policies/registry-policy.yaml` to version control to enforce uniform governance across all developer machines.
