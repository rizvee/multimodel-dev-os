# Skill OS Authoring Reference

This is a concise field reference for v4.1 Skill OS metadata. The metadata is declarative and validation-only.

## Skill Registry Fields

| Field | Required | Notes |
|:---|:---:|:---|
| `id` | Yes | Lowercase slug. |
| `name` | Yes | Human-readable name. |
| `version` | Yes | Semver-like string. |
| `description` | Yes | Public-facing summary. |
| `category` | Yes | Group such as `business-operator` or `security-audit`. |
| `triggers` | No | Optional discovery hints. |
| `required_context` | No | Safe relative paths. |
| `provided_outputs` | No | Expected draft/report outputs. |
| `risk_level` | Yes | `low`, `medium`, `high`, or `restricted`. |
| `permissions` | Yes | Known permission classes or mapped tool permissions. |
| `recommended_models` | No | Model category hints only. |
| `token_budget` | No | Suggested budget, not enforced. |
| `skill_file` | Yes | Safe relative path to markdown skill. |
| `checks` | No | Safe relative paths to check files. |
| `examples` | No | Generic public examples. |

## Prompt Template Fields

| Field | Required | Notes |
|:---|:---:|:---|
| `id` | Yes | Lowercase slug. |
| `name` | Yes | Human-readable name. |
| `version` | Yes | Semver-like string. |
| `description` | Yes | Public-facing summary. |
| `race_plus.role` | Yes | Who the prompt acts as. |
| `race_plus.action` | Yes | What it should do. |
| `race_plus.context` | Yes | Inputs and required files. |
| `race_plus.expectation` | Yes | Desired result. |
| `race_plus.constraints` | Yes | Safety and scope limits. |
| `race_plus.output_format` | Yes | Expected shape. |
| `race_plus.verification` | Yes | Checks before use. |
| `race_plus.next_action` | Yes | Manual next step. |
| `variables` | No | Named placeholders. |
| `compatible_agents` | No | Portability hints. |
| `examples` | No | Generic prompts. |

## Permission Classes

| Class | Meaning |
|:---|:---|
| `read-only` | Inspect or report without state changes. |
| `draft-only` | Produce text, plans, or drafts for review. |
| `write-with-confirmation` | Future write path requiring explicit confirmation. |
| `restricted-admin` | Future high-risk path such as publish, deploy, DNS, credentials, billing, or ad spend. |

## Guardrail Types

| Type | Intended Use |
|:---|:---|
| `pre_tool` | Advisory check before a tool class or operation. |
| `pre_write` | Advisory check before local write paths. |
| `pre_external_write` | Advisory check before future external write paths. |
| `post_change` | Validation reminder after changes. |
| `session_summary` | Capture or review session summary expectations. |

## Guardrail Severity

| Severity | Intended Use |
|:---|:---|
| `low` | Informational boundary. |
| `medium` | Review recommended. |
| `high` | Explicit care and validation expected. |
| `restricted` | Confirmation metadata required. |

## Workflow `skill_os` Fields

| Field | Required | Notes |
|:---|:---:|:---|
| `skills` | No | Existing skill IDs. |
| `prompts` | No | Existing prompt template IDs. |
| `permissions` | No | Existing tool permission IDs. |
| `guardrails` | No | Existing guardrail IDs. |
| `required_context` | No | Safe relative paths that must exist. |

All `skill_os` fields are optional. Workflows without Skill OS metadata remain valid.

## Recommended Risk Levels

| Work Type | Suggested Risk |
|:---|:---|
| Read-only inspection | `low` |
| Draft-only docs or operator summaries | `low` |
| Source edits with tests | `medium` |
| Release preparation or security audit | `high` |
| Publish, deploy, DNS, credential, billing, or ad-spend path | `restricted` |

## Safe Path Rules

- Use relative paths.
- Do not use drive letters or home-directory paths.
- Do not use `..` traversal.
- Keep paths inside the workspace.
- Reference files that exist when bundled.
- Prefer repo paths such as `.ai/prompts/example.md` or `docs/example.md`.
