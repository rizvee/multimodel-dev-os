# Tool Permissions

v4.1 Sprint A adds a declarative tool permission model for future Skill OS workflows.

This is a schema and example layer only. Sprint A does not enforce permissions, block tools, or execute automation.

## Files

```text
.ai/registries/tool-permissions.yaml
.ai/schema/tool-permission.schema.json
```

## Permission Classes

| Class | Intended Use |
|:---|:---|
| `read-only` | Inspect, search, list, validate, and report without changing state. |
| `draft-only` | Create proposed text, plans, patches, or release notes without applying external changes. |
| `write-with-confirmation` | Perform local or reversible writes only after explicit confirmation and validation. |
| `restricted-admin` | Publish, deploy, DNS, billing, ad spend, production credentials, tag movement, or public release publication. |

## Example Tool IDs

The Sprint A registry includes generic examples:

- `filesystem-read`
- `filesystem-write`
- `git-commit`
- `git-push`
- `npm-publish`
- `github-release`
- `github-release-publish`
- `dns-change`
- `ad-spend-change`
- `secret-rotation`

## Restricted Examples

The following are modeled as `restricted-admin`:

- npm publish
- GitHub release publication
- DNS changes
- Ad spend changes
- Secret rotation

## Sprint C Status

Permission classes remain declarative, and Sprint C adds read-only CLI inspection:

- No permission enforcement.
- No command blocking.
- No external tool automation.
- No runtime behavior change.
- Validation checks known classes, confirmation requirements, and dangerous operations that cannot be marked read-only.
- `multimodel-dev-os skill-os list permissions` prints known permission IDs.
- `multimodel-dev-os skill-os show permission <id>` prints class and guardrail metadata.

Future sprints should add read-only inspection, then carefully scoped guardrail integration.

## Safety Direction

Restricted-admin operations should require explicit current-turn maintainer approval. They should never be inferred from nearby planning, release-prep, or validation tasks.
