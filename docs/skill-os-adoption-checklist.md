# Skill OS Adoption Checklist

Use this checklist to adopt the v4.1 Skill OS foundation without changing runtime behavior.

## Prompt Templates

- [ ] Convert repeated prompts into RACE+ sections.
- [ ] Store reusable prompt text under `.ai/prompts/`.
- [ ] Add metadata to `.ai/registries/prompt-templates.yaml`.
- [ ] Keep examples generic and public-facing.
- [ ] Confirm `role`, `action`, `context`, `expectation`, `constraints`, `output_format`, `verification`, and `next_action` are present.

## Skills

- [ ] Keep existing markdown skills.
- [ ] Add only useful discovery metadata to `.ai/registries/skills.yaml`.
- [ ] Use lowercase slug IDs.
- [ ] Use semver-like versions.
- [ ] Point `skill_file` at a safe relative path.
- [ ] Choose conservative risk levels.
- [ ] Reference only known permission classes.

## Tool Permissions

- [ ] Use `read-only` for inspection.
- [ ] Use `draft-only` for generated text or plans.
- [ ] Reserve `write-with-confirmation` for future confirmed local or reversible writes.
- [ ] Reserve `restricted-admin` for publish, deploy, DNS, credential, billing, and ad-spend actions.
- [ ] Do not mark dangerous operations read-only.

## Guardrails

- [ ] Add guardrail metadata for sensitive future paths.
- [ ] Keep guardrails advisory-only for v4.1.
- [ ] Require confirmation metadata for restricted or external-write paths.
- [ ] Reference existing check files.
- [ ] Avoid claiming command blocking exists today.

## Workflows

- [ ] Keep existing workflows valid without `skill_os`.
- [ ] Add `skill_os` metadata only where it improves inspection.
- [ ] Reference existing skill, prompt, permission, and guardrail IDs.
- [ ] Keep `required_context` paths relative and inside the workspace.
- [ ] Confirm workflow behavior is unchanged.

## Business Operator Templates

- [ ] Use draft-only permissions.
- [ ] Work only from provided information.
- [ ] Avoid private business details in packaged templates.
- [ ] Do not describe live Gmail, Calendar, Drive, Slack, CRM, analytics, ad, or publishing actions as implemented.
- [ ] Keep manual review as the next action.

## Validation

- [ ] Run `multimodel-dev-os skill-os status`.
- [ ] Run `multimodel-dev-os skill-os validate`.
- [ ] Run `npm run verify`.
- [ ] Run `npm run docs:build`.
- [ ] Inspect changed docs for stale version claims and broken links.

## Documentation Hygiene

- [ ] Use "declarative", "validation-only", "read-only inspection", "draft-only", and "advisory" accurately.
- [ ] Avoid local machine paths.
- [ ] Avoid private business names.
- [ ] Link new pages from the sidebar and README when public.
- [ ] Update `llms.txt` and `llms-full.txt` when docs are maintained manually.

## Release Readiness

- [ ] Package version remains unchanged unless release prep explicitly approves a bump.
- [ ] npm publish is not run from development sprints.
- [ ] Existing tags are not moved.
- [ ] CI Verification passes.
- [ ] Deploy Docs passes.
