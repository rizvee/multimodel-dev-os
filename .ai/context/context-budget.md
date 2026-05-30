# Context Budget & Token Management

> Core limits, file exclusion lists, and guidelines to prevent context window saturation and minimize token bloat.

## Rules
1. Never pass unnecessary build outputs or dependencies (`node_modules`, `.next`, `dist`) to the context.
2. In large codebases, switch the AI config `mode` to `caveman` to use abbreviated instructions.
3. Keep logs inside `.ai/session-logs/` pruned or gitignored by default.

## Budgets
- Target instruction token size: under 1,000 tokens
- Max active codebase files in context: 15-20 files
