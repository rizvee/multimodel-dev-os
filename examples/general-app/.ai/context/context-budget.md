# General App — Context Budget

- Keep total context files under **10,000 tokens** per prompt.
- Never pass large dependencies directories like `node_modules` or local `build` artifacts into model prompts.
- Consolidate file reads to avoid context bloating.
