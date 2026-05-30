# Prompts

> Reusable prompt templates for AI coding agents.

## Purpose

Store prompt templates that agents or humans can reference:
- Code review prompts
- Architecture analysis prompts
- Refactoring prompts
- Testing strategy prompts

## Format

Each prompt is a markdown file:

```markdown
# Prompt: {name}

## When to Use
{Trigger conditions}

## Template
{The prompt text with {placeholders}}

## Variables
| Variable | Description |
|----------|-------------|
| {project} | Project name |
```

## Guidelines

- One prompt per file
- Use `{variable}` syntax for placeholders
- Keep prompts under 50 lines
- Name files descriptively: `code-review.md`, `architecture-audit.md`
