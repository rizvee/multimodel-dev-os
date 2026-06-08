# Final Launch Guidelines (v2.0.0 Target)

This document details the final launch guidelines and distribution routines for the public releases of MultiModel Dev OS.

> [!IMPORTANT]
> **NPM publishing is paused until v2.0.0.** No new releases will be published under `v1.2.x` minor versions list.
> 
> * **GitHub Source**: Contains unreleased `v1.2+` features (Template Galaxy, model registries, Android templates).
> * **NPM Latest**: Remains at the last stable released version.
> * **v2.0.0**: The next approved NPM publication.

---

## 1. Local Pre-flight Verification

Prior to pushing files or preparing a release, ensure that:
- The exact target version starts with `2.` (e.g. `2.0.0`) in `package.json` for publishing, or remains at `1.2.0` for local development.
- The cross-platform verify script completes cleanly:
  ```bash
  npm run verify
  ```
- The VitePress documentation compiles without warnings or errors:
  ```bash
  npm run docs:build
  ```

---

## 2. Launch Announcement Outlines

When publishing the stable release, communicate the key advantages clearly:
- **Portability**: Write-once configurations working seamlessly across Cursor, Claude, Gemini, Antigravity, and VS Code.
- **Context Economy**: Up to 79% reduction in prompt tokens through Caveman Mode configurations.
- **Zero Dependencies**: A completely self-contained CLI for lightning-fast setups.
- **AI Discoverability**: Ready-to-ingest discoverability guides (`llms.txt` / `llms-full.txt`) for LLM agents.

Refer to `docs/launch-kit.md` for specific copy blocks ready for distribution on Twitter/X, LinkedIn, Hacker News, and Reddit.

Explore our [Stable Protocol Specification](/stable-protocol) or [Upgrade & Migration Guide](/migration-guide) for details.
