# Skills

> Reusable agent skills that extend what AI agents can do in your project.

## What is a Skill?

A skill is a markdown file that teaches an AI agent a specific capability:
- How to perform a database migration
- How to set up a new microservice
- How to run a specific test suite
- How to deploy to a specific environment

## Structure

Each skill is a markdown file in this directory:

```
.ai/skills/
├── README.md              ← You are here
├── example-skill.md       ← Example template
├── your-skill-name.md     ← Your custom skills
└── ...
```

## Creating a Skill

1. Copy `example-skill.md` as a starting point
2. Define the skill name, description, and steps
3. Include any commands, code snippets, or decision trees
4. Keep skills focused — one skill, one capability

## Loading

When `auto_load: true` in `.ai/config.yaml`, agents read all skills in this directory at session start. Keep the directory small to avoid context bloat.
