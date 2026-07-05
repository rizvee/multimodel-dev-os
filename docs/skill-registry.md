# Skill Registry

v4.1 Sprint A adds an optional skill registry foundation for MultiModel Dev OS.

This does not replace existing markdown skills. Existing files under `.ai/skills/` remain valid.

## Files

```text
.ai/registries/skills.yaml
.ai/schema/skill.schema.json
```

The registry provides example metadata for reusable skills such as:

- Release governance
- Security audit
- SEO audit
- Content brief
- Document production
- Business ops
- Code review

## Sprint A Status

The registry is declarative in Sprint A:

- No runtime behavior change.
- No CLI command change.
- No automatic skill triggering.
- No permission enforcement.
- No registry validation is active yet.

Future sprints are expected to add validation and read-only inspection before any workflow integration.

## Metadata Shape

Skill entries are expected to support:

- `id`
- `name`
- `version`
- `description`
- `category`
- `triggers`
- `required_context`
- `provided_outputs`
- `risk_level`
- `permissions`
- `recommended_models`
- `token_budget`
- `skill_file`
- `checks`
- `examples`

## Compatibility

The registry is an overlay on top of markdown-compatible skills. A workspace can continue using `.ai/skills/*.md` without a registry.

When validation is added later, registry entries should point to relative workspace paths and use the shared tool permission classes:

- `read-only`
- `draft-only`
- `write-with-confirmation`
- `restricted-admin`

## Recommended Adoption

1. Keep current markdown skills.
2. Add metadata only for skills that need discovery or routing.
3. Use low-risk or draft-only permissions by default.
4. Add checks for skills that may lead to writes or release operations.
5. Wait for future validation support before treating the registry as enforced.
