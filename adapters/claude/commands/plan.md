---
description: Plan multi-file changes with reviewable diffs before execution
allowed-tools: ["read_file", "list_directory", "search_files"]
---

# /plan — Implementation Plan

Create a structured implementation plan before making changes.

## Format

For each file to change:

```
### [MODIFY|NEW|DELETE] <filepath>

**Reason:** Why this file changes.

**Diff preview:**
```diff
- old line
+ new line
  unchanged context
```
```

## Rules

1. Read all target files first
2. Group by component/module
3. Order dependencies-first
4. Show search-replace diffs, not full file rewrites
5. List verification steps at the end
6. Wait for user approval before executing

Target: `$ARGUMENTS`
