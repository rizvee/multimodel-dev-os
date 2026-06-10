# Hash-Compressed Repository Memory

To prevent context bloat and ensure token-efficient prompting, MultiModel Dev OS leverages a diff-driven, hash-compressed repository memory engine.

---

## Codebase State Index (`memory.hash.json`)

The memory engine compiles the workspace structure into a compact JSON file under `.ai/intelligence/memory.hash.json`:
*   **Content Fingerprints**: SHA-256 hashes and size metrics of files to detect changes quickly.
*   **Framework Signals**: Automatically detected project framework and environment indicators.
*   **Package Manager Signals**: Detected package managers (npm, yarn, pnpm, etc.).
*   **AI Dev OS Integration**: Mapped list of present MultiModel Dev OS workspace files.
*   **Risk Profile**: Scans and logs files/patterns that require stricter verification checks.
*   **Recommended Next Steps**: Tailored integration and stabilization recommendations.

---

## Memory CLI Commands

MultiModel Dev OS provides four commands to scan the codebase and manage the memory index:

### 1. `mmdo scan`
Scans the codebase target directory, detects package managers, frameworks/languages, MultiModel Dev OS integrations, and lists security or size risks without writing any files.

```bash
npx multimodel-dev-os@latest scan
```

### 2. `mmdo memory build`
Performs a full codebase scan and compiles the index files under `.ai/intelligence/`:
- `memory.hash.json`: Structural fingerprints and framework signals.
- `memory.summary.md`: Human-readable codebase status summary.

```bash
npx multimodel-dev-os@latest memory build
```

### 3. `mmdo memory refresh`
Incremental refresh of memory files, comparing current file hashes against `memory.hash.json` to update changed, added, or removed files without re-indexing unchanged assets.

```bash
npx multimodel-dev-os@latest memory refresh
```

### 4. `mmdo memory diff`
Computes the difference between the current workspace state and the existing `memory.hash.json` file. Reports count and paths of added, removed, and changed files without writing any changes to disk.

```bash
npx multimodel-dev-os@latest memory diff
```

---

## Memory Refresh Operations

Re-indexing the workspace is optimized to run incrementally:
1.  **Hash Scanning**: The scanner compares current file hashes against the fingerprints in `memory.hash.json`.
2.  **Pruning**: Files no longer present in the directory are removed from summaries.
3.  **Targeted Summarization**: Only modified or new files are summarized, preserving historical decision logs and unchanged summaries to minimize token costs.
4.  **Ignore Bounds**: Any directory or file path matching patterns inside `.gitignore` or default excludes (like `node_modules`, `.git`, `build`, etc.) is completely excluded from the memory scanning loop.
5.  **Secret Redaction**: Skips configuration files containing secrets, credential blocks, or keystores (e.g. `.env`, `.npmrc`, `.keystore`).

