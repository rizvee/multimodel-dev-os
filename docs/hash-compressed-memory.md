# Hash-Compressed Repository Memory

To prevent context bloat and ensure token-efficient prompting, MultiModel Dev OS leverages a diff-driven, hash-compressed repository memory engine.

---

## Codebase State Index (`memory.json`)

The memory engine compiles the workspace structure into a compact JSON file under `.ai/intelligence/memory.json`:
*   **Content Fingerprints**: SHA-256 hashes and size metrics of files to detect changes quickly.
*   **Semantic Summaries**: Ultra-dense (max 200 tokens) semantic summaries of individual directories and files.
*   **Dependency Map**: Compact import/export relationships graph to help agents understand side-effects.
*   **Decision Audit**: Log of architectural constraints and refactoring decisions.
*   **Risk Profile**: Maps sensitive files requiring strict safety validation checks.

---

## Memory Refresh Operations

Re-indexing the workspace is optimized to run incrementally:
1.  **Hash Scanning**: The scanner compares current file hashes against the fingerprints in `memory.json`.
2.  **Pruning**: Files no longer present in the directory are removed from summaries.
3.  **Targeted Summarization**: Only modified or new files are summarized, preserving historical decision logs and unchanged summaries to minimize token costs.
4.  **Ignore Bounds**: Any directory or file path matching patterns inside `.gitignore` is completely excluded from the memory scanning loop.
