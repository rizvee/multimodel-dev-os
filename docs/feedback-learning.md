# Feedback Learning Loop

MultiModel Dev OS implements a feedback learning loop, converting developer edits and instruction overrides into reusable prompt rules.

---

## 1. Learning Flow

When an agent proposes changes and the developer modifies or rejects the code:
1.  **Directive Compilation**: The developer logs the feedback comment:
    ```bash
    npx multimodel-dev-os feedback add "Do not use Tailwind CSS in components under src/components/legacy; use CSS modules." --type preference --tags styling
    ```
2.  **Summarization**: The developer compiles the logged guidelines:
    ```bash
    npx multimodel-dev-os feedback summarize
    ```
3.  **Learnings Update**: The learning rules are compiled and saved to `.ai/intelligence/learning-rules.md`.

---

## 2. Dynamic Context Ingestion

During subsequent task prompts:
1.  **Pattern Matching**: The routing engine scans `learning-rules.md` for rules matching the current file targets.
2.  **Constraint Assembly**: Matching rules are compiled and injected directly into the prompt context budget as strict formatting rules.
3.  **Instruction Drift Prevention**: This guarantees that once a design preference is specified, developer agents immediately align to it without repeating mistakes.

---

## Command Center Integration

The [Repository Command Center](repository-command-center.md) dashboard counts the logged feedback items and tracks whether `learning-rules.md` is present or missing. Running `mmdo status` will advise you when feedback logs exist but have not yet been summarized into active rules.
