# Model Map & Capability Routing

> Guidelines mapping specific project features and workflow steps to the best-suited AI coding models.

## Routing Schema

| Model Class | Ideal Tasks | Examples |
|-------------|-------------|----------|
| High-Reasoning (e.g. Claude 3.5 Sonnet, GPT-4o) | Planning, Architecture, Refactoring, Complex Logic | Planning a module, multi-file edits |
| Fast/Token-Minimized (e.g. Gemini Flash, GPT-4o-mini) | Quick Bugfixes, Repetitive edits, Lint fixing, Verification | Fixing single-line errors |
| Specialized Code Models (e.g. Codex variants) | Review, Inline Completions | PR audits, Doc writing |
