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

## Sprint C Status

The registry remains declarative, and Sprint C adds read-only CLI inspection:

- No runtime behavior change.
- No automatic skill triggering.
- No permission enforcement.
- Validation checks required fields, slug-safe IDs, semver-like versions, risk levels, permission classes, safe relative paths, and referenced files.
- `multimodel-dev-os skill-os list skills` prints known skill IDs.
- `multimodel-dev-os skill-os show skill <id>` prints selected metadata.

Future sprints may add richer inspection before any workflow integration.

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

Registry entries should point to safe relative workspace paths and use the shared tool permission classes:

- `read-only`
- `draft-only`
- `write-with-confirmation`
- `restricted-admin`

## Recommended Adoption

1. Keep current markdown skills.
2. Add metadata only for skills that need discovery or routing.
3. Use low-risk or draft-only permissions by default.
4. Add checks for skills that may lead to writes or release operations.
5. Treat validation as a safety net, not as automation or permission enforcement.

See [Skill OS CLI](./skill-os-cli.md) for read-only inspection commands.
