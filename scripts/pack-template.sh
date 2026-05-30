#!/usr/bin/env bash
set -euo pipefail

# Pack multimodel-dev-os template files into a distributable archive.
# Used for future npm/CLI packaging. Does not include .git, examples, or docs.

VERSION="${1:-0.1.0}"
OUTPUT="multimodel-dev-os-${VERSION}.tar.gz"

echo "Packing multimodel-dev-os v${VERSION}..."

INCLUDE=(
  AGENTS.md
  MEMORY.md
  TASKS.md
  RUNBOOK.md
  .ai/
  adapters/
)

# Check that required files exist
for item in "${INCLUDE[@]}"; do
  if [ ! -e "$item" ]; then
    echo "ERROR: $item not found. Run from the repo root."
    exit 1
  fi
done

tar -czf "$OUTPUT" \
  --exclude='*.gitkeep' \
  --exclude='.ai/session-logs/*.md' \
  --exclude='!.ai/session-logs/README.md' \
  "${INCLUDE[@]}"

echo "Created: $OUTPUT"
echo "Contents:"
tar -tzf "$OUTPUT" | head -30
echo "..."
echo "Done."
