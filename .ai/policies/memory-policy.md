# MultiModel Dev OS Memory & Privacy Policy

This policy governs the security, storage, token budget constraints, and privacy parameters for local repository memory indices and feedback loops compiled by MultiModel Dev OS.

---

## 1. Token Efficiency Constraints

To avoid saturating the context window of developer agents, the generated memory indices (`memory.json`) and feedback files (`learnings.yaml`) must be kept compact:
*   **Summary Bounds**: Component/file summaries must not exceed **200 tokens** per file entry.
*   **Pruning Rules**: Stale summaries of deleted files or historic decision logs exceeding 90 days must be automatically pruned during the `mmdo memory refresh` cycles.
*   **Token Budget**: The total memory footprint loaded into an active workspace context must remain below **5%** of the target model's active context window.

---

## 2. Privacy & Secret Security

Local memory indexing must **never** store sensitive credentials, secrets, or PII:
1.  **Strict File Exclusions**:
    *   Configurations storing credentials (e.g. `.env`, `.npmrc`, `key.pem`, `.git-credentials`, service accounts JSON) must be strictly ignored.
    *   No content signatures or lines from excluded files may be hashed or compiled.
2.  **No Code Scraping**: Code block contents may be semantically summarized but the raw code blocks (especially database connection strings, passwords, and API keys) must never be copied into `memory.json`.
3.  **Local Isolation**: Memory files are restricted to the local workspace and must never be uploaded to external APIs or third-party servers.

---

## 3. Index Refresh & Git Bounds

*   **Diff-Driven Updates**: Re-indexing must use content hash comparison. A file is only re-analyzed if its content hash differs from the stored fingerprint.
*   **Gitignore Alignment**: Any directory or file path marked as ignored inside the workspace `.gitignore` is automatically excluded from the memory scanning loop.
