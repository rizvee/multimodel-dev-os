# Learning Rules and Feedback Loop

MultiModel Dev OS captures developer corrections and instruction overrides to compile reusable system rules that refine subsequent agent proposal generations.

---

## 1. Feedback Loop Commands

### 1. Log Feedback
To log a design preference or instruction override, run:
```bash
npx multimodel-dev-os feedback add "Prefer vanilla CSS or CSS Modules in legacy components" --type preference --tags styling --files "src/components/legacy/*"
```
This logs a structured JSON entry to `.ai/intelligence/feedback-log.jsonl`.

### 2. List Logged Feedback
To view all feedback entries in a formatted list:
```bash
npx multimodel-dev-os feedback list
```

### 3. Summarize Feedback
To compile the raw feedback log into instructions that agents read:
```bash
npx multimodel-dev-os feedback summarize
```
This aggregates the logs by type and writes `.ai/intelligence/learning-rules.md`.

---

## 2. Context Ingestion by Agents

Prior to generating proposals or refactoring components:
1. Model agents read `.ai/intelligence/learning-rules.md` as context.
2. The rules act as prompt constraints matching specific file target patterns.
3. This prevents agents from repeating previously corrected mistakes.
