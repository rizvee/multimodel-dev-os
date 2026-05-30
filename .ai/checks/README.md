# Checks

> Pre- and post-action checks that agents run before/after critical operations.

## What is a Check?

A check is a markdown file that defines verification steps an agent should run:
- Before committing code
- Before deploying
- After a migration
- After a dependency update

## Structure

```
.ai/checks/
├── README.md            ← You are here
├── pre-commit.md        ← Example pre-commit check
└── your-check.md        ← Your custom checks
```

## Enabling Checks

Set in `.ai/config.yaml`:

```yaml
checks:
  pre_commit:
    enabled: true
    file: ".ai/checks/pre-commit.md"
```

## Creating a Check

1. Create a markdown file in this directory
2. Define the check name, trigger, and steps
3. Include pass/fail criteria
4. Reference it in `.ai/config.yaml`
