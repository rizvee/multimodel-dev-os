# Feedback Learning Loop

MultiModel Dev OS implements a feedback learning loop, converting developer edits and instruction overrides into reusable prompt rules.

---

## 1. Learning Flow

When an agent proposes changes and the developer modifies or rejects the code:
1.  **Diff Extraction**: The OS parses the developer's corrective modifications against the agent's proposed files.
2.  **Directive Compilation**: The developer logs the feedback comment:
    ```bash
    npx multimodel-dev-os learn from "Do not use Tailwind CSS in components under src/components/legacy; use CSS modules."
    ```
3.  **Learnings Update**: The learning rule, timestamp, context tier, and file pattern are appended to `.ai/intelligence/learnings.yaml`.

---

## 2. Dynamic Context Ingestion

During subsequent task prompts:
1.  **Pattern Matching**: The routing engine scans `learnings.yaml` for rules matching the current file targets.
2.  **Constraint Assembly**: Matching rules are compiled and injected directly into the prompt context budget as strict formatting rules.
3.  **Instruction Drift Prevention**: This guarantees that once a design preference is specified, developer agents immediately align to it without repeating mistakes.
