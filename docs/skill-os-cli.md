# Skill OS CLI

v4.1 Sprint C adds read-only CLI inspection for the Skill OS schema and registry layer.

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

Validation checks schemas, YAML registries, required fields, IDs, versions, safe relative paths, permission classes, risk levels, RACE+ fields, and declarative guardrail consistency.

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

## Safety Boundaries

Sprint D is advisory and declarative:

- No automation is executed.
- No permission enforcement is active.
- No files are written by `skill-os` commands.
- No network calls are made.
- Registries remain declarative until future implementation work adds explicit enforcement.

