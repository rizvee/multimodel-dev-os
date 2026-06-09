# Repository Intelligence Layer

This directory contains the schemas, structures, and indices that govern the repository intelligence and feedback systems for MultiModel Dev OS.

## Directory Structure

*   `memory.schema.json` — The JSON schema defining the token-efficient representation of codebase state (hashes, summaries, and dependencies).
*   `feedback.schema.json` — The JSON schema mapping developer feedback logs and instruction overrides.

## Indices & Learning Files (Workspace Specific)

When configured, developer agents will generate:
*   `memory.json` — The compiled state index mapping files to fingerprints and semantic summaries.
*   `learnings.yaml` — The database of rule modifications learned from developer feedback.
