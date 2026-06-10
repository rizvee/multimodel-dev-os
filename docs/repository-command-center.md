# Repository Command Center Guide

The **Repository Command Center** introduced in `v2.5.0` provides a unified, read-only operational dashboard summarizing the entire repository intelligence status of a MultiModel Dev OS workspace.

---

## 1. Using the `status` Command

The `status` command allows developers and AI agents to instantly check project health and progress.

```bash
npx multimodel-dev-os status
```

Or target a specific subdirectory:

```bash
npx multimodel-dev-os status --target ./some-subproject
```

### Dashboard View

Running `status` prints a formatted, color-coded status summary:

1.  **Project Info**: Displays the package name and package version from the root `package.json`.
2.  **Framework & Dependency Signals**: Summarizes detected languages, framework engines (e.g. Next.js, Express, React), and package lockfiles (e.g. `package-lock.json`).
3.  **Memory State**:
    *   `CURRENT` (Green): Memory index is fully built and matches the filesystem.
    *   `STALE` (Yellow): Modifications have been made. Lists number of added, removed, or modified files.
    *   `MISSING` (Red): No memory files have been built yet.
4.  **Feedback Loop & Rules**: Displays total count of developer feedback entries and whether compiled learning rules are active.
5.  **Improvement Proposals**: Lists total optimization proposals, categorized by approval status (`pending`, `approved`, `rejected`).
6.  **Apply Audit Log**: Counts applied proposal runs.
7.  **Next Recommended Command**: Offers dynamic advice on what to execute next (e.g., refreshing memory, review proposals, running health checks).

---

## 2. Benefits for Multi-Agent Workflows

*   **Context Discovery**: Instantly summarizes active templates, environment structures, and boundaries.
*   **Zero-Dependency Parsing**: Fast initialization checks that don't load external libraries.
*   **Actionable Next Steps**: Guides developers and AI models to the correct command sequence, preventing execution drift.
