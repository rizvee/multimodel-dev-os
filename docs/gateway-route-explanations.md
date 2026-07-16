# Gateway Route Explanations

Route explanations make dry-run decisions auditable for humans and machines.

## Explanation Shape

```text
summary
strategy
selected
hard_requirements
score_breakdown
rejected
fallbacks
warnings
policy_source
preset_id
deterministic_tie_break
```

## Language Rules

Explanations use planning language:

- selected for planning
- recommended candidate
- fallback plan
- dry-run decision

They avoid wording that implies a request was transmitted, a provider was invoked, an upstream answer came back, or failover actually ran.

## Redaction Boundary

Explanations must not include:

- prompt bodies
- API keys
- authorization headers
- credential values
- sensitive environment values
- absolute local machine paths

## Determinism

Equivalent inputs produce equivalent explanations when the caller supplies the same request ID and decision timestamp.
