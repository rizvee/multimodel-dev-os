# Release State

MultiModel Dev OS uses a maintainer-controlled release process. Package preparation, Git tagging, draft GitHub releases, npm publication, and mirror publication are separate states.

`npm publish` is always a manual maintainer action. A version can be prepared in the repository before it is published to npmjs. During that window the repository may already contain the version bump, release commit, annotated tag, and draft GitHub release.

The GitHub release should remain draft until npmjs confirms the version is published. The optional GitHub Packages mirror should run after npmjs publication is confirmed.

## Release States

| State | Meaning |
|:---|:---|
| Prepared | Version metadata, changelog, release notes, and package files are ready locally or in a release commit. |
| Pushed | The release preparation commit has been pushed to `main`. |
| Tagged | An annotated Git tag exists for the prepared version. |
| Draft release created | A draft GitHub release exists for the tag, but it is not public yet. |
| npmjs published | The version is visible on npmjs and `npm view multimodel-dev-os version` returns that version. |
| GitHub release published | The GitHub release is no longer draft and is marked latest when appropriate. |
| GitHub Packages mirrored | The optional `@rizvee/multimodel-dev-os` package has been published to GitHub Packages. |
| Fully released | npmjs, GitHub release, GitHub Actions, docs, and optional package mirrors have all reached the intended final state. |

## Current Status

### v4.0.0

- Fully released on npmjs.
- Public GitHub release is published.
- GitHub Packages mirror has been published.

### v4.0.1

- Prepared but not npm-published.
- Tagged as `v4.0.1`.
- Draft GitHub release exists.
- Superseded by v4.1.0.
- v4.0.1 should remain historical/prepared unless Hasan explicitly chooses otherwise.
- If v4.0.1 is ever published, it must only be published from the existing `v4.0.1` tag.

### v4.2.0

| State | Status |
|---|---|
| Prepared | Yes |
| Pushed | Yes |
| Tagged | Yes |
| Draft GitHub release | Completed before publication |
| npmjs published | Yes |
| GitHub release published | Yes |
| GitHub Packages mirrored | No |
| Fully released | Yes |

- v4.2.0 is published on npmjs and is the npm latest.
- The public GitHub release for `v4.2.0` is published and marked latest.
- The corrected annotated `v4.2.0` tag resolves to npm artifact provenance commit `dbda023`.
- GitHub Packages mirroring has not been run for v4.2.0.
- npm publication remains a manual maintainer action guarded by `scripts/prepublish-guard.js`.

### main

- main package version is `4.2.0`.
- main must not be published as v4.0.1.
- v4.1.0 is published on npmjs.
- v4.2.0 is the npm latest.
- The GitHub release for v4.1.0 is public; v4.2.0 is the current latest release.
- The optional GitHub Packages mirror workflow has completed; package visibility and access are controlled by GitHub Packages settings.
- v4.1.0 provides declarative Skill OS metadata, validation, documentation, and read-only inspection foundations; it does not execute automation, enforce permissions at runtime, or make advisory guardrails block live commands.
- v4.2.0 provides the Gateway Foundation release.
- The mock provider is the only executable provider.
- External providers remain metadata-only.
- Live fallback and retry execution are not enabled.
- Client configurations remain preview-only.
- Observability remains local, bounded, redacted, and in-memory.

## Release Notes

- v4.0.1 remains unpublished and superseded; it should only be revisited if Hasan explicitly chooses to publish from the existing `v4.0.1` tag.
- v4.1.0 is fully released from `main`.
- v4.2.0 is fully released from corrected tag `v4.2.0`, aligned with npm artifact provenance commit `dbda023`.

## Manual Publish Command

```bash
npm publish --access public
```

## Post-Publish Command Sequence

After any future manual npmjs publish, confirm the public package before publishing the matching GitHub release:

```bash
npm view multimodel-dev-os version
npx -y multimodel-dev-os@latest --help
gh release edit <version-tag> --draft=false --latest
gh workflow run publish-github-package.yml --ref main
```

The GitHub release should stay draft if npmjs still reports the previous latest version.
