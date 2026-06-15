# Example: Safe Improvement Loop

Capture developer corrections, propose improvements, validate safety gates, and apply changes with full audit trails.

## Prerequisites

- Node.js 18+
- A MultiModel Dev OS workspace (`npx multimodel-dev-os@latest init`)

## Commands

```bash
# Record developer feedback
npx multimodel-dev-os@latest feedback add "Always use TypeScript strict mode" --type preference

# Compile feedback into learning rules
npx multimodel-dev-os@latest feedback summarize

# Draft an improvement proposal
npx multimodel-dev-os@latest improve propose --title "Add strict mode config"

# Review all proposals
npx multimodel-dev-os@latest improve review

# Validate a proposal's safety gates (12 checks)
npx multimodel-dev-os@latest improve validate .ai/proposals/proposal-XXXX.md

# Preview changes without modifying files
npx multimodel-dev-os@latest improve diff .ai/proposals/proposal-XXXX.md

# Apply approved proposal with audit logging
npx multimodel-dev-os@latest improve apply .ai/proposals/proposal-XXXX.md --approved

# View the audit log
npx multimodel-dev-os@latest improve log
```

## Safety

- Feedback logging, proposal drafting, review, and diff are non-destructive
- `improve apply` requires explicit `--approved` flag
- 12 safety gates validated before any apply
- Protected paths blocked: `.git/`, `.env`, `node_modules/`, `apply-log.jsonl`
- All operations audited with SHA-256 pre/post file hashes

## Full Demo

See the [complete walkthrough](/demos/safe-improvement-loop) for detailed explanations and expected output.
