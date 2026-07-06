# v4.1.0 - Skill OS Foundation

## Summary

v4.1.0 introduces the Skill OS foundation for MultiModel Dev OS: a declarative, validation-first layer for structured prompts, reusable skills, tool permission metadata, advisory guardrails, workflow metadata, and draft-only business operator templates.

This release provides metadata, validation, documentation, and read-only inspection foundations. It does not execute automation from Skill OS metadata, enforce permissions at runtime, or make advisory guardrails block live commands.

## Highlights

* Skill OS foundation release
* RACE+ prompt templates
* Skill registry metadata
* Tool permission metadata
* Declarative advisory guardrails
* Read-only `skill-os` CLI inspection
* Workflow `skill_os` metadata integration
* Draft-only business operator templates
* Migration, adoption, example, and authoring documentation
* Zero runtime dependency posture
* Validation-first safety model with no automation execution and no runtime permission enforcement

## Validation

* `npm run build`
* `npm run check:build`
* `npm test`
* `npm run verify`
* `npm run docs:build`
* `npm pack --dry-run`

## Package

npmjs package:

```bash
npm install -g multimodel-dev-os
```

Published version: `4.1.0`

GitHub Packages mirror: `@rizvee/multimodel-dev-os` via `npm.pkg.github.com`, with visibility and access controlled by GitHub Packages settings.
