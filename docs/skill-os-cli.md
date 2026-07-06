# Skill OS CLI

v4.1 Sprint C adds read-only CLI inspection for the Skill OS schema and registry layer. Sprint E extends validation to optional workflow metadata references.

The `skill-os` namespace loads local Skill OS registries when present and falls back to the bundled registries shipped with MultiModel Dev OS. Commands are deterministic and local-only.

## Commands

```bash
multimodel-dev-os skill-os status
multimodel-dev-os skill-os validate
multimodel-dev-os skill-os list skills
multimodel-dev-os skill-os list prompts
multimodel-dev-os skill-os list permissions
multimodel-dev-os skill-os list clusters
multimodel-dev-os skill-os show skill <id>
multimodel-dev-os skill-os show prompt <id>
multimodel-dev-os skill-os show permission <id>
multimodel-dev-os skill-os show cluster <id>
```

## Status

`status` prints registry counts, validation status, and the registry files under inspection.

```bash
multimodel-dev-os skill-os status
```

## Validate

`validate` runs the local Skill OS validation engine and exits non-zero if validation fails.

```bash
multimodel-dev-os skill-os validate
```

Validation checks schemas, YAML registries, required fields, IDs, versions, safe relative paths, permission classes, risk levels, RACE+ fields, declarative guardrail consistency, and optional workflow Skill OS references.

Workflow references remain declarative. `skill-os validate` verifies that referenced skills, prompts, permissions, guardrails, and context files exist, but it does not execute automation or enforce permissions.

## List

`list` prints compact IDs for each registry family.

```bash
multimodel-dev-os skill-os list skills
multimodel-dev-os skill-os list prompts
multimodel-dev-os skill-os list permissions
multimodel-dev-os skill-os list clusters
```

## Show

`show` prints selected metadata for one registry item.

```bash
multimodel-dev-os skill-os show skill release-governance
multimodel-dev-os skill-os show prompt release-audit
multimodel-dev-os skill-os show permission npm-publish
multimodel-dev-os skill-os show cluster core-technical
```

## Sprint D - Declarative Guardrail Validation

Sprint D extends the `skill-os validate` engine to audit the declarative guardrails registry (`.ai/registries/guardrails.yaml`) against `.ai/schema/guardrail.schema.json`. It checks check-file paths, confirmation rules, and advisory constraint declarations.

## Sprint E - Workflow Metadata Validation

Sprint E allows `.ai/registries/workflows.yaml` entries to include optional `skill_os` metadata. Validation checks referenced Skill OS IDs and safe required context paths. Workflow commands remain read-only for inspection and unchanged for execution semantics.

## Safety Boundaries

Sprint E remains advisory and declarative:

- No automation is executed.
- No permission enforcement is active.
- No files are written by `skill-os` commands.
- No network calls are made.
- Registries remain declarative until future implementation work adds explicit enforcement.
