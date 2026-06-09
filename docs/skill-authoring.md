# Skill Authoring Guide

This guide explains how to construct high-fidelity reusable skills for MultiModel Dev OS.

## Overview

Skills are custom prompts placed in the `.ai/skills/` directory of a project workspace. They instruct coding agents on exactly how to perform specific coding, refactoring, validation, or deployment routines.

## Required Structure

Every reusable skill file must be a Markdown (`.md`) file containing the following key sections:

```markdown
# Purpose
Describe what this skill accomplishes.

# Activation Trigger
Specify when a developer or agent should invoke this skill.

# Input Context
List the dependencies, files, or information required before executing this skill.

# Output Contract
Define the expected deliverables, formats, or file updates.

# Token Budget
Expected prompt footprint and limits.
```

## Example Skill File

```markdown
# Purpose
Deploy a Next.js Server Action with security gates.

# Activation Trigger
Trigger when building or modifying API endpoints / React Server Actions.

# Input Context
* Target action file
* Schema validations definitions

# Output Contract
Return the modified action file containing secure CSRF/Origin validation rules.

# Token Budget
~500 tokens
```

## Validating a Skill

To test your skill structure compliance, run:

```bash
node bin/multimodel-dev-os.js validate-skill my-skill-name
```
